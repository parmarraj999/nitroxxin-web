import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { firestoreInstance } from "../services/firebase";
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import {
  subscribeToAuth,
  sendOTP,
  verifyOTP,
  logoutUser,
  loginWithGoogle,
  sendOTPForUser,
  getOrCreateRecaptchaVerifier,
  resetRecaptchaVerifier,
  formatAuthError,
} from "../services/authService";
import { createUserProfile, updateUserProfile, findExistingUser } from "../services/userService";
import { uploadProfileImage, uploadDrivingLicenseImage } from "../services/storageService";

const AuthContext = createContext(null);

const isVendorOrHostAccount = (data) => {
  if (!data || typeof data !== "object") return false;
  const role = String(data.role || "").toLowerCase();
  const email = String(data.email || "").toLowerCase();
  return (
    role === "host" ||
    role === "vendor" ||
    role === "organizer" ||
    Boolean(data.isHost) ||
    Boolean(data.isVendor) ||
    email.includes("vendor") ||
    email.includes("host")
  );
};

const getInitialUser = () => {
  try {
    const savedUser = localStorage.getItem("nitroxxin_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      // Evict any vendor/host account mistakenly cached in localStorage
      if (isVendorOrHostAccount(parsed)) {
        localStorage.removeItem("nitroxxin_user");
        localStorage.removeItem("nitroxxin_profile");
        localStorage.removeItem("userId");
        localStorage.removeItem("nitroxxin_auth_uid");
        return null;
      }
      return parsed;
    }
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
    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      if (isVendorOrHostAccount(parsed)) {
        localStorage.removeItem("nitroxxin_profile");
        return null;
      }
      return parsed;
    }
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
  const [activeView, setActiveView] = useState("login"); // "login" | "otp" | "googlePhone" | "profileSetup"
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Google Sign-In pending verification state
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const pendingGoogleLoginRef = useRef(false);

  // Subscribe to Firebase Auth and sync with Firestore profile (supports both real Auth & Dev Test UID)
  useEffect(() => {
    let unsubscribeProfile = null;

    const clearWebSession = () => {
      localStorage.removeItem("nitroxxin_user");
      localStorage.removeItem("nitroxxin_profile");
      localStorage.removeItem("userId");
      localStorage.removeItem("nitroxxin_auth_uid");
      setUser(null);
      setProfile(null);
      setLoading(false);
    };

    const unsubscribeAuth = subscribeToAuth(async (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (pendingGoogleLoginRef.current) {
        setLoading(false);
        return;
      }

      if (firebaseUser) {
        try {
          // 1. Guard against Event Hosts, Vendors, and Organizers logged into dashboards
          // E.g. rajparmarvendor@gmail.com logged into Events-Host-Dashboard or Products-Vendor-Dashboard.
          // They must NEVER be automatically signed up or logged in as a consumer on nitroxx-web,
          // and must NEVER have a document auto-created in the "users" collection!
          const [hostSnap, vendorSnap, hostAppSnap] = await Promise.all([
            getDoc(doc(firestoreInstance, "event_host", firebaseUser.uid)).catch(() => null),
            getDoc(doc(firestoreInstance, "vendors", firebaseUser.uid)).catch(() => null),
            getDoc(doc(firestoreInstance, "host_applications", firebaseUser.uid)).catch(() => null),
          ]);

          const isDashboardAccount = Boolean(
            hostSnap?.exists() || vendorSnap?.exists() || hostAppSnap?.exists()
          );

          if (isDashboardAccount) {
            console.info("Firebase Auth session belongs to an Event Host/Vendor Dashboard account; ignoring on public web store.");
            clearWebSession();
            return;
          }

          // 2. Realtime listener to users/{uid} document
          const docRef = doc(firestoreInstance, "users", firebaseUser.uid);
          unsubscribeProfile = onSnapshot(
            docRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const profileData = { id: docSnap.id, ...docSnap.data() };

                // Guard: If document has role 'Host', 'Vendor', or 'Organizer', do not treat as customer
                if (
                  profileData.role === "Host" ||
                  profileData.role === "Vendor" ||
                  profileData.role === "Organizer" ||
                  profileData.isHost ||
                  profileData.isVendor
                ) {
                  clearWebSession();
                  return;
                }

                // Legitimate registered customer user on nitroxx-web
                localStorage.removeItem("nitroxxin_dev_test_uid");
                localStorage.setItem("userId", firebaseUser.uid);
                localStorage.setItem("nitroxxin_auth_uid", firebaseUser.uid);

                const basePayload = {
                  uid: firebaseUser.uid,
                  phone: profileData.phone || profileData.phoneNumber || firebaseUser.phoneNumber || "",
                  phoneNumber: profileData.phone || profileData.phoneNumber || firebaseUser.phoneNumber || "",
                  email: profileData.email || firebaseUser.email || "",
                  fullName: profileData.fullName || profileData.name || firebaseUser.displayName || "",
                  displayName: profileData.displayName || profileData.fullName || firebaseUser.displayName || "",
                  photoURL: profileData.profilePhoto || profileData.photoURL || firebaseUser.photoURL || "",
                };

                localStorage.setItem("nitroxxin_user", JSON.stringify(basePayload));
                localStorage.setItem("nitroxxin_profile", JSON.stringify(profileData));
                setUser(basePayload);
                setProfile(profileData);
              } else {
                // User does NOT exist in the website's `users` collection!
                // NEVER auto-create a document in `users` collection on auth state change!
                // Legitimate users are created only during explicit OTP verification or registration.
                clearWebSession();
              }
              setLoading(false);
            },
            (snapError) => {
              console.error("Firestore sync error:", snapError);
              setLoading(false);
            }
          );
        } catch (err) {
          console.error("Error in auth session check:", err);
          clearWebSession();
        }
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
    if (pendingGoogleUser && pendingGoogleLoginRef.current) {
      logoutUser().catch((e) => console.warn("Cleanup logout on openLogin:", e));
      setPendingGoogleUser(null);
      pendingGoogleLoginRef.current = false;
    }
    setModalError(null);
    setPhoneNumber("");
    setConfirmationResult(null);
    setActiveView("login");
    setIsAuthOpen(true);
  }, [pendingGoogleUser]);

  const closeAuth = useCallback(() => {
    if (pendingGoogleUser && pendingGoogleLoginRef.current) {
      logoutUser().catch((e) => console.warn("Cleanup logout on closeAuth:", e));
      setPendingGoogleUser(null);
      pendingGoogleLoginRef.current = false;
    }
    setIsAuthOpen(false);
    setPhoneNumber("");
    setConfirmationResult(null);
    setModalError(null);
  }, [pendingGoogleUser]);

  const triggerOTP = useCallback(async (phoneVal, recaptchaVerifier) => {
    setModalLoading(true);
    setModalError(null);
    try {
      const confirmResult = pendingGoogleUser
        ? await sendOTPForUser(pendingGoogleUser, phoneVal, recaptchaVerifier)
        : await sendOTP(phoneVal, recaptchaVerifier);
      setConfirmationResult(confirmResult);
      setPhoneNumber(phoneVal);
      setActiveView("otp");
    } catch (err) {
      console.error("Trigger OTP error:", err);
      setModalError(formatAuthError(err));
      throw err;
    } finally {
      setModalLoading(false);
    }
  }, [pendingGoogleUser]);

  const submitGooglePhone = useCallback(async (rawPhone) => {
    const cleanDigits = (rawPhone || "").trim().replace(/\D/g, "");
    if (!cleanDigits || cleanDigits.length !== 10) {
      const err = new Error("Please enter a valid 10-digit mobile number");
      setModalError(err.message);
      throw err;
    }

    const fullPhoneNumber = `+91${cleanDigits}`;
    setModalLoading(true);
    setModalError(null);

    try {
      const verifier = getOrCreateRecaptchaVerifier("recaptcha-container", () => {
        setModalError("reCAPTCHA expired. Please request OTP again.");
      });

      if (!verifier) {
        throw new Error("Unable to initialize verification service. Please reload the page.");
      }

      const confirmResult = await sendOTPForUser(pendingGoogleUser, fullPhoneNumber, verifier);
      setConfirmationResult(confirmResult);
      setPhoneNumber(fullPhoneNumber);
      setActiveView("otp");
      return confirmResult;
    } catch (err) {
      console.error("Failed to send OTP for Google user:", err);
      resetRecaptchaVerifier("recaptcha-container");
      setModalError(formatAuthError(err));
      throw err;
    } finally {
      setModalLoading(false);
    }
  }, [pendingGoogleUser]);

  const confirmOTP = useCallback(async (code) => {
    setModalLoading(true);
    setModalError(null);
    try {
      if (!confirmationResult) throw new Error("No verification context found. Please request OTP again.");
      const firebaseUser = await verifyOTP(confirmationResult, code);

      const finalUser = pendingGoogleUser || firebaseUser;
      const targetUid = finalUser.uid;
      const verifiedPhone = phoneNumber || firebaseUser.phoneNumber || "";

      localStorage.setItem("userId", targetUid);
      localStorage.setItem("nitroxxin_auth_uid", targetUid);
      const userPayload = {
        uid: targetUid,
        phoneNumber: verifiedPhone,
        phone: verifiedPhone,
        fullName: finalUser.displayName || finalUser.fullName || "",
        displayName: finalUser.displayName || finalUser.fullName || "",
        email: finalUser.email || "",
        profilePhoto: finalUser.photoURL || "",
        photoURL: finalUser.photoURL || "",
        isPhoneVerified: true,
      };
      localStorage.setItem("nitroxxin_user", JSON.stringify(userPayload));
      setUser(userPayload);

      // Ensure / update basic user profile in Firestore
      try {
        const userRef = doc(firestoreInstance, "users", targetUid);
        const profileUpdate = {
          uid: targetUid,
          phone: verifiedPhone,
          phoneNumber: verifiedPhone,
          fullName: finalUser.displayName || finalUser.fullName || "",
          displayName: finalUser.displayName || finalUser.fullName || "",
          email: finalUser.email || "",
          profilePhoto: finalUser.photoURL || "",
          photoURL: finalUser.photoURL || "",
          isPhoneVerified: true,
          updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, profileUpdate, { merge: true });
        const finalProfile = { id: targetUid, ...profileUpdate };
        setProfile(finalProfile);
        localStorage.setItem("nitroxxin_profile", JSON.stringify(finalProfile));
      } catch (profileErr) {
        console.warn("Could not save profile document:", profileErr);
      }

      setPendingGoogleUser(null);
      pendingGoogleLoginRef.current = false;
      setIsAuthOpen(false);
      setConfirmationResult(null);
      return finalUser;
    } catch (err) {
      console.error("Confirm OTP error:", err);
      setModalError(formatAuthError(err));
      throw err;
    } finally {
      setModalLoading(false);
    }
  }, [confirmationResult, phoneNumber, pendingGoogleUser]);

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
    const trimmed = (rawPhone || phoneNumber || "").trim().replace(/\D/g, "");
    if (!trimmed || trimmed.length !== 10) {
      const err = new Error("Please enter a valid 10-digit mobile number.");
      setModalError(err.message);
      throw err;
    }

    const fullPhoneNumber = `+91${trimmed}`;
    setModalLoading(true);
    setModalError(null);

    try {
      if (pendingGoogleUser) {
        const targetUid = pendingGoogleUser.uid;
        localStorage.setItem("userId", targetUid);
        localStorage.setItem("nitroxxin_auth_uid", targetUid);

        const profileUpdate = {
          id: targetUid,
          uid: targetUid,
          phone: fullPhoneNumber,
          phoneNumber: fullPhoneNumber,
          fullName: pendingGoogleUser.displayName || `Rider ${trimmed.slice(-4)}`,
          displayName: pendingGoogleUser.displayName || `Rider ${trimmed.slice(-4)}`,
          email: pendingGoogleUser.email || "",
          profilePhoto: pendingGoogleUser.photoURL || "",
          photoURL: pendingGoogleUser.photoURL || "",
          isPhoneVerified: true,
          isProfileComplete: true,
          updatedAt: serverTimestamp(),
        };

        const userRef = doc(firestoreInstance, "users", targetUid);
        await setDoc(userRef, profileUpdate, { merge: true });

        const mockUser = {
          ...pendingGoogleUser,
          ...profileUpdate,
        };

        localStorage.setItem("nitroxxin_user", JSON.stringify(mockUser));
        localStorage.setItem("nitroxxin_profile", JSON.stringify(profileUpdate));

        setUser(mockUser);
        setProfile(profileUpdate);
        setPendingGoogleUser(null);
        pendingGoogleLoginRef.current = false;
        setIsAuthOpen(false);
        setConfirmationResult(null);
        return mockUser;
      }

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
          isPhoneVerified: true,
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
        isPhoneVerified: true,
      };

      localStorage.setItem("nitroxxin_user", JSON.stringify(mockUser));
      localStorage.setItem("nitroxxin_profile", JSON.stringify(existing));

      setUser(mockUser);
      setProfile(existing);

      setIsAuthOpen(false);
      setConfirmationResult(null);
      return mockUser;
    } catch (err) {
      console.error("No-OTP login failed:", err);
      setModalError(err.message || "Failed to log in without OTP");
      throw err;
    } finally {
      setModalLoading(false);
    }
  }, [pendingGoogleUser, phoneNumber]);

  const signInWithGoogle = useCallback(async () => {
    setModalLoading(true);
    setModalError(null);
    pendingGoogleLoginRef.current = true;
    try {
      const result = await loginWithGoogle();
      const firebaseUser = result.user;
      let targetPhone = result.googlePhone || "";

      // Check existing Firestore profile for saved phone number
      if (!targetPhone) {
        try {
          const docRef = doc(firestoreInstance, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().phone) {
            targetPhone = docSnap.data().phone;
          }
        } catch (e) {
          console.warn("Could not check existing user profile:", e);
        }
      }

      setPendingGoogleUser(firebaseUser);

      const digits = (targetPhone || "").replace(/\D/g, "");
      if (digits.length >= 10) {
        // Phone number obtained from Google data -> Auto send OTP!
        const fullPhone = digits.length === 10 ? `+91${digits}` : `+${digits}`;
        setPhoneNumber(fullPhone);

        const verifier = getOrCreateRecaptchaVerifier("recaptcha-container", () => {
          setModalError("reCAPTCHA expired. Please request OTP again.");
        });

        if (!verifier) {
          throw new Error("Unable to initialize verification service. Please reload the page.");
        }

        const confirmResult = await sendOTPForUser(firebaseUser, fullPhone, verifier);
        setConfirmationResult(confirmResult);
        setActiveView("otp");
      } else {
        // No phone number available from Google data -> Ask user for their number
        setActiveView("googlePhone");
      }
      return firebaseUser;
    } catch (err) {
      console.error("Google sign-in error in context:", err);
      pendingGoogleLoginRef.current = false;
      setPendingGoogleUser(null);
      if (err.code !== "auth/popup-closed-by-user") {
        setModalError(formatAuthError(err));
      }
      resetRecaptchaVerifier("recaptcha-container");
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
    setActiveView,
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

    // Google flow
    pendingGoogleUser,
    submitGooglePhone,
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
    pendingGoogleUser,
    submitGooglePhone,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within FirebaseAuthProvider");
  return context;
};
