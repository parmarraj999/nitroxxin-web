import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { firestoreInstance } from "../services/firebase";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { subscribeToAuth, sendOTP, verifyOTP, logoutUser, loginWithGoogle } from "../services/authService";
import { createUserProfile, updateUserProfile, ensureUserProfile, findExistingUser } from "../services/userService";
import { uploadProfileImage, uploadDrivingLicenseImage } from "../services/storageService";

const AuthContext = createContext(null);

const getInitialUser = () => {
  try {
    const savedUser = localStorage.getItem("nitroxxin_user");
    if (savedUser) return JSON.parse(savedUser);
    const devUid = localStorage.getItem("nitroxxin_dev_test_uid");
    if (devUid) {
      return {
        uid: devUid,
        isDevMock: true,
        phone: "+919999999999",
        fullName: "User",
      };
    }
  } catch (e) {
    console.warn("Error reading cached user:", e);
  }
  return null;
};

const getInitialProfile = () => {
  try {
    const savedProfile = localStorage.getItem("nitroxxin_profile");
    if (savedProfile) return JSON.parse(savedProfile);
  } catch (e) {
    console.warn("Error reading cached profile:", e);
  }
  return null;
};

export const FirebaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser);
  const [profile, setProfile] = useState(getInitialProfile);
  const [loading, setLoading] = useState(() => !getInitialUser());
  const [error, setError] = useState(null);

  // Modal flow state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeView, setActiveView] = useState("login"); // "login" | "otp" | "profileSetup"
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Subscribe to Firebase Auth and sync with Firestore profile (supports both real Auth & Dev Test UID)
  useEffect(() => {
    let unsubscribeProfile;

    const unsubscribeAuth = subscribeToAuth(async (firebaseUser) => {
      if (unsubscribeProfile) unsubscribeProfile();

      if (firebaseUser) {
        localStorage.removeItem("nitroxxin_dev_test_uid");
        localStorage.setItem("userId", firebaseUser.uid);
        localStorage.setItem("nitroxxin_auth_uid", firebaseUser.uid);

        const basePayload = {
          uid: firebaseUser.uid,
          phone: firebaseUser.phoneNumber || "",
          phoneNumber: firebaseUser.phoneNumber || "",
          email: firebaseUser.email || "",
          fullName: firebaseUser.displayName || "",
          displayName: firebaseUser.displayName || "",
          photoURL: firebaseUser.photoURL || "",
        };
        localStorage.setItem("nitroxxin_user", JSON.stringify(basePayload));
        setUser((prev) => ({ ...basePayload, ...(prev || {}), ...firebaseUser }));

        // Realtime listener to users/{uid} document
        const docRef = doc(firestoreInstance, "users", firebaseUser.uid);
        unsubscribeProfile = onSnapshot(
          docRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const profileData = { id: docSnap.id, ...docSnap.data() };
              setProfile(profileData);
              localStorage.setItem("nitroxxin_profile", JSON.stringify(profileData));
            } else {
              // Ensure user profile document exists so we don't end up with an empty state
              ensureUserProfile(firebaseUser.uid, {
                phone: firebaseUser.phoneNumber || "",
                fullName: firebaseUser.displayName || "",
                email: firebaseUser.email || "",
              })
                .then((ensured) => {
                  setProfile(ensured);
                  localStorage.setItem("nitroxxin_profile", JSON.stringify(ensured));
                })
                .catch((pErr) => {
                  console.warn("Could not ensure profile document:", pErr);
                });
            }
            setLoading(false);
          },
          (snapError) => {
            console.error("Firestore sync error:", snapError);
            // DO NOT log out on snapshot error; preserve user session
            setLoading(false);
          }
        );
      } else {
        // Firebase has no active user in authInstance
        const savedDevUid = localStorage.getItem("nitroxxin_dev_test_uid");
        if (savedDevUid) {
          localStorage.setItem("userId", savedDevUid);
          const docRef = doc(firestoreInstance, "users", savedDevUid);
          unsubscribeProfile = onSnapshot(
            docRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const profileData = { id: docSnap.id, ...docSnap.data() };
                setProfile(profileData);
                localStorage.setItem("nitroxxin_profile", JSON.stringify(profileData));
                const mockUser = {
                  uid: savedDevUid,
                  phone: profileData?.phone || profileData?.phoneNumber || "+919999999999",
                  fullName:
                    profileData?.fullName ||
                    profileData?.name ||
                    profileData?.displayName ||
                    "Test User",
                  email: profileData?.email || `${savedDevUid}@test.nitroxxin.com`,
                  isDevMock: true,
                };
                setUser(mockUser);
                localStorage.setItem("nitroxxin_user", JSON.stringify(mockUser));
              } else {
                // If docSnap doesn't exist, still preserve the active dev session
                const fallbackUser = {
                  uid: savedDevUid,
                  phone: "+919999999999",
                  fullName: "Test User",
                  email: `${savedDevUid}@test.nitroxxin.com`,
                  isDevMock: true,
                };
                setUser(fallbackUser);
              }
              setLoading(false);
            },
            (snapError) => {
              console.error("Dev UID Firestore sync error:", snapError);
              setLoading(false);
            }
          );
        } else {
          // Truly unauthenticated: clear user and profile
          localStorage.removeItem("nitroxxin_user");
          localStorage.removeItem("nitroxxin_profile");
          localStorage.removeItem("userId");
          localStorage.removeItem("nitroxxin_auth_uid");
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeAuth();
    };
  }, []);

  const openLogin = useCallback(() => {
    setModalError(null);
    setPhoneNumber("");
    setConfirmationResult(null);
    setActiveView("login");
    setIsAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setIsAuthOpen(false);
    setPhoneNumber("");
    setConfirmationResult(null);
    setModalError(null);
  }, []);

  const triggerOTP = useCallback(async (phoneVal, recaptchaVerifier) => {
    setModalLoading(true);
    setModalError(null);
    try {
      const confirmResult = await sendOTP(phoneVal, recaptchaVerifier);
      setConfirmationResult(confirmResult);
      setPhoneNumber(phoneVal);
      setActiveView("otp");
    } catch (err) {
      console.error("Trigger OTP error:", err);
      setModalError(err.message || "Failed to send verification code. Please try again.");
      throw err;
    } finally {
      setModalLoading(false);
    }
  }, []);

  const confirmOTP = useCallback(async (code) => {
    setModalLoading(true);
    setModalError(null);
    try {
      if (!confirmationResult) throw new Error("No verification context found. Please request OTP again.");
      const firebaseUser = await verifyOTP(confirmationResult, code);

      localStorage.setItem("userId", firebaseUser.uid);
      localStorage.setItem("nitroxxin_auth_uid", firebaseUser.uid);
      const userPayload = {
        uid: firebaseUser.uid,
        phoneNumber: firebaseUser.phoneNumber || phoneNumber || "",
        phone: firebaseUser.phoneNumber || phoneNumber || "",
      };
      localStorage.setItem("nitroxxin_user", JSON.stringify(userPayload));
      setUser(firebaseUser);

      // Ensure basic user profile exists in Firestore without blocking on full detail setup
      try {
        const ensured = await ensureUserProfile(firebaseUser.uid, {
          phone: firebaseUser.phoneNumber || phoneNumber || "",
        });
        setProfile(ensured);
        localStorage.setItem("nitroxxin_profile", JSON.stringify(ensured));
      } catch (profileErr) {
        console.warn("Could not ensure profile document:", profileErr);
      }

      // Close auth modal directly upon successful OTP verification
      setIsAuthOpen(false);
      setConfirmationResult(null);
      return firebaseUser;
    } catch (err) {
      console.error("Confirm OTP error:", err);
      setModalError(err.message || "Invalid OTP code. Please enter the correct code.");
      throw err;
    } finally {
      setModalLoading(false);
    }
  }, [confirmationResult, phoneNumber]);

  const completeProfileSetup = useCallback(async (userData) => {
    if (!user) throw new Error("No authenticated session found.");
    setModalLoading(true);
    setModalError(null);
    try {
      let finalPhotoURL = "";
      if (userData.avatarFile) {
        finalPhotoURL = await uploadProfileImage(user.uid, userData.avatarFile);
      }

      await createUserProfile(user.uid, {
        ...userData,
        phone: user.phoneNumber || phoneNumber || "",
        profilePhoto: finalPhotoURL || userData.profilePhoto || "",
      });

      setIsAuthOpen(false);
    } catch (err) {
      console.error("Profile Setup error:", err);
      setModalError(err.message || "Failed to save profile details. Please try again.");
      throw err;
    } finally {
      setModalLoading(false);
    }
  }, [user, phoneNumber]);

  const loginWithUid = useCallback(async (customUid) => {
    if (!customUid || !customUid.trim()) {
      const err = new Error("Please enter a valid UID, Phone, or Email");
      setModalError(err.message);
      throw err;
    }
    const trimmedInput = customUid.trim();
    setModalLoading(true);
    setModalError(null);

    try {
      // Find present user in Firestore - DO NOT CREATE A NEW DOCUMENT
      const presentUser = await findExistingUser(trimmedInput);

      if (!presentUser) {
        const notFoundErr = new Error(
          `No existing user found for "${trimmedInput}". Please enter a valid existing UID or select from the present users below.`
        );
        setModalError(notFoundErr.message);
        throw notFoundErr;
      }

      const realUid = presentUser.id || presentUser.uid;
      localStorage.setItem("nitroxxin_dev_test_uid", realUid);
      localStorage.setItem("userId", realUid);

      const mockUser = {
        uid: realUid,
        phone: presentUser.phone || presentUser.phoneNumber || "+919999999999",
        fullName: presentUser.fullName || presentUser.name || presentUser.displayName || "User",
        email: presentUser.email || `${realUid}@test.nitroxxin.com`,
        ...presentUser,
        isDevMock: true,
      };

      localStorage.setItem("nitroxxin_user", JSON.stringify(mockUser));
      localStorage.setItem("nitroxxin_profile", JSON.stringify(presentUser));

      setUser(mockUser);
      setProfile(presentUser);

      setIsAuthOpen(false);
      setConfirmationResult(null);
      return mockUser;
    } catch (err) {
      console.error("Login with UID failed:", err);
      setModalError(err.message || "Failed to log in with UID");
      throw err;
    } finally {
      setModalLoading(false);
    }
  }, []);

  const loginWithPhoneNoOtp = useCallback(async (rawPhone) => {
    const trimmed = (rawPhone || "").trim().replace(/\D/g, "");
    if (!trimmed || trimmed.length !== 10) {
      const err = new Error("Please enter a valid 10-digit mobile number.");
      setModalError(err.message);
      throw err;
    }

    const fullPhoneNumber = `+91${trimmed}`;
    setModalLoading(true);
    setModalError(null);

    try {
      // 1. Check if user already exists with this phone number in Firestore
      let existing = await findExistingUser(fullPhoneNumber);
      if (!existing) {
        existing = await findExistingUser(trimmed);
      }

      let targetUid = existing?.id || existing?.uid;

      if (!existing || !targetUid) {
        // Create user profile document in Firestore for testing
        targetUid = `dev_user_${trimmed}`;
        const userRef = doc(firestoreInstance, "users", targetUid);
        const newProfile = {
          id: targetUid,
          uid: targetUid,
          phone: fullPhoneNumber,
          phoneNumber: fullPhoneNumber,
          fullName: `Rider ${trimmed.slice(-4)}`,
          displayName: `Rider ${trimmed.slice(-4)}`,
          email: `rider${trimmed.slice(-4)}@test.nitroxxin.com`,
          isProfileComplete: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, newProfile, { merge: true });
        existing = newProfile;
      }

      localStorage.setItem("nitroxxin_dev_test_uid", targetUid);
      localStorage.setItem("userId", targetUid);
      localStorage.setItem("nitroxxin_auth_uid", targetUid);

      const mockUser = {
        uid: targetUid,
        phone: existing.phone || fullPhoneNumber,
        phoneNumber: existing.phone || fullPhoneNumber,
        fullName: existing.fullName || existing.name || existing.displayName || `Rider ${trimmed.slice(-4)}`,
        displayName: existing.fullName || existing.name || existing.displayName || `Rider ${trimmed.slice(-4)}`,
        email: existing.email || `rider${trimmed.slice(-4)}@test.nitroxxin.com`,
        ...existing,
        isDevMock: true,
      };

      localStorage.setItem("nitroxxin_user", JSON.stringify(mockUser));
      localStorage.setItem("nitroxxin_profile", JSON.stringify(existing));

      setUser(mockUser);
      setProfile(existing);

      setIsAuthOpen(false);
      setConfirmationResult(null);
      return mockUser;
    } catch (err) {
      console.error("Localhost No-OTP login failed:", err);
      setModalError(err.message || "Failed to log in without OTP");
      throw err;
    } finally {
      setModalLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setModalLoading(true);
    setModalError(null);
    try {
      const firebaseUser = await loginWithGoogle();
      if (firebaseUser) {
        localStorage.setItem("userId", firebaseUser.uid);
        localStorage.setItem("nitroxxin_auth_uid", firebaseUser.uid);
        const userPayload = {
          uid: firebaseUser.uid,
          fullName: firebaseUser.displayName || "",
          displayName: firebaseUser.displayName || "",
          email: firebaseUser.email || "",
          profilePhoto: firebaseUser.photoURL || "",
          photoURL: firebaseUser.photoURL || "",
          phone: firebaseUser.phoneNumber || "",
        };
        localStorage.setItem("nitroxxin_user", JSON.stringify(userPayload));
        setUser(firebaseUser);

        try {
          const ensured = await ensureUserProfile(firebaseUser.uid, {
            fullName: firebaseUser.displayName || "",
            email: firebaseUser.email || "",
            profilePhoto: firebaseUser.photoURL || "",
            phone: firebaseUser.phoneNumber || "",
          });
          setProfile(ensured);
          localStorage.setItem("nitroxxin_profile", JSON.stringify(ensured));
        } catch (profileErr) {
          console.warn("Could not ensure profile document:", profileErr);
        }
        setIsAuthOpen(false);
        setConfirmationResult(null);
        return firebaseUser;
      }
    } catch (err) {
      console.error("Google sign-in error in context:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setModalError(err.message || "Failed to sign in with Google.");
      }
      throw err;
    } finally {
      setModalLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      localStorage.removeItem("nitroxxin_dev_test_uid");
      localStorage.removeItem("nitroxxin_user");
      localStorage.removeItem("nitroxxin_profile");
      localStorage.removeItem("userId");
      localStorage.removeItem("nitroxxin_auth_uid");
      await logoutUser();
      setProfile(null);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!user) throw new Error("You must be logged in.");
    try {
      await updateUserProfile(user.uid, updates);
    } catch (err) {
      console.error("Update profile error:", err);
      throw err;
    }
  }, [user]);

  const uploadProfilePhoto = useCallback(async (file) => {
    if (!user) throw new Error("You must be logged in.");
    try {
      const photoURL = await uploadProfileImage(user.uid, file);
      await updateProfile({ profilePhoto: photoURL });
      return photoURL;
    } catch (err) {
      console.warn("Storage upload failed, attempting fallback to data URL:", err);
      if (file && file.size < 600 * 1024) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const dataUrl = reader.result;
              await updateProfile({ profilePhoto: dataUrl });
              resolve(dataUrl);
            } catch (upErr) {
              reject(err);
            }
          };
          reader.onerror = () => reject(err);
          reader.readAsDataURL(file);
        });
      }
      throw err;
    }
  }, [user, updateProfile]);

  const uploadUserDrivingLicense = useCallback(async (file) => {
    if (!user) throw new Error("You must be logged in.");
    try {
      const downloadURL = await uploadDrivingLicenseImage(user.uid, file);
      await updateProfile({
        drivingLicenseImage: downloadURL,
      });
      return downloadURL;
    } catch (err) {
      console.warn("Storage license upload failed, attempting fallback to data URL:", err);
      if (file && file.size < 600 * 1024) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const dataUrl = reader.result;
              await updateProfile({ drivingLicenseImage: dataUrl });
              resolve(dataUrl);
            } catch (upErr) {
              reject(err);
            }
          };
          reader.onerror = () => reject(err);
          reader.readAsDataURL(file);
        });
      }
      throw err;
    }
  }, [user, updateProfile]);

  const removeUserDrivingLicense = useCallback(async () => {
    if (!user) throw new Error("You must be logged in.");
    try {
      await updateProfile({
        drivingLicenseImage: "",
      });
    } catch (err) {
      console.error("Remove driving license error:", err);
      throw err;
    }
  }, [user, updateProfile]);

  const value = useMemo(() => ({
    // Auth state
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    logout,
    updateProfile,
    uploadProfilePhoto,
    uploadUserDrivingLicense,
    removeUserDrivingLicense,
    loginWithUid,
    loginWithPhoneNoOtp,

    // Modal state
    isAuthOpen,
    activeView,
    phoneNumber,
    modalLoading,
    modalError,
    setModalError,
    openLogin,
    closeAuth,
    triggerOTP,
    confirmOTP,
    signInWithGoogle,
    loginWithGoogle: signInWithGoogle,
    completeProfileSetup,
  }), [
    user,
    profile,
    loading,
    error,
    logout,
    updateProfile,
    uploadProfilePhoto,
    uploadUserDrivingLicense,
    removeUserDrivingLicense,
    loginWithUid,
    loginWithPhoneNoOtp,
    isAuthOpen,
    activeView,
    phoneNumber,
    modalLoading,
    modalError,
    openLogin,
    closeAuth,
    triggerOTP,
    confirmOTP,
    signInWithGoogle,
    completeProfileSetup,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within FirebaseAuthProvider");
  return context;
};
