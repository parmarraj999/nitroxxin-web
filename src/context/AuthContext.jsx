import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { firestoreInstance } from "../services/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { subscribeToAuth, sendOTP, verifyOTP, logoutUser } from "../services/authService";
import { createUserProfile, updateUserProfile, ensureUserProfile } from "../services/userService";
import { uploadProfileImage } from "../services/storageService";

const AuthContext = createContext(null);

export const FirebaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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
        setUser(firebaseUser);

        // Realtime listener to users/{uid} document
        const docRef = doc(firestoreInstance, "users", firebaseUser.uid);
        unsubscribeProfile = onSnapshot(
          docRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const profileData = { id: docSnap.id, ...docSnap.data() };
              setProfile(profileData);
            } else {
              setProfile(null);
            }
            setLoading(false);
          },
          (snapError) => {
            console.error("Firestore sync error:", snapError);
            setError(snapError.message);
            setLoading(false);
          }
        );
      } else {
        // Check if a dev test UID is active in localStorage
        const savedDevUid = localStorage.getItem("nitroxxin_dev_test_uid");
        if (savedDevUid) {
          const docRef = doc(firestoreInstance, "users", savedDevUid);
          unsubscribeProfile = onSnapshot(
            docRef,
            (docSnap) => {
              if (docSnap.exists()) {
                const profileData = { id: docSnap.id, ...docSnap.data() };
                setProfile(profileData);
                setUser({
                  uid: savedDevUid,
                  phone: profileData?.phone || "+919999999999",
                  displayName: profileData?.fullName || profileData?.displayName || "Test User",
                  email: profileData?.email || `${savedDevUid}@test.nitroxxin.com`,
                  isDevMock: true,
                });
              } else {
                setProfile(null);
                setUser({
                  uid: savedDevUid,
                  phone: "+919999999999",
                  displayName: "Test User",
                  email: `${savedDevUid}@test.nitroxxin.com`,
                  isDevMock: true,
                });
              }
              setLoading(false);
            },
            (snapError) => {
              console.error("Dev UID Firestore sync error:", snapError);
              setLoading(false);
            }
          );
        } else {
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
      
      // Ensure basic user profile exists in Firestore without blocking on full detail setup
      try {
        await ensureUserProfile(firebaseUser.uid, {
          phone: firebaseUser.phoneNumber || phoneNumber || "",
        });
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
        photoURL: finalPhotoURL || userData.photoURL || "",
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
      const err = new Error("Please enter a valid UID");
      setModalError(err.message);
      throw err;
    }
    const trimmedUid = customUid.trim();
    setModalLoading(true);
    setModalError(null);

    try {
      localStorage.setItem("nitroxxin_dev_test_uid", trimmedUid);

      let profileData = null;
      try {
        profileData = await ensureUserProfile(trimmedUid, {
          phone: "+919999999999",
          fullName: "Test User (" + (trimmedUid.length > 6 ? trimmedUid.slice(0, 6) : trimmedUid) + ")",
        });
      } catch (err) {
        console.warn("Could not ensure profile document for test UID:", err);
      }

      const mockUser = {
        uid: trimmedUid,
        phoneNumber: profileData?.phone || "+919999999999",
        displayName: profileData?.fullName || profileData?.displayName || "Test User",
        email: profileData?.email || `${trimmedUid}@test.nitroxxin.com`,
        isDevMock: true,
      };

      setUser(mockUser);
      if (profileData) {
        setProfile(profileData);
      }

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

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      localStorage.removeItem("nitroxxin_dev_test_uid");
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
      await updateProfile({ photoURL, profilePhoto: photoURL });
      return photoURL;
    } catch (err) {
      console.error("Upload photo error:", err);
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
    loginWithUid,

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
    completeProfileSetup,
  }), [
    user,
    profile,
    loading,
    error,
    logout,
    updateProfile,
    uploadProfilePhoto,
    loginWithUid,
    isAuthOpen,
    activeView,
    phoneNumber,
    modalLoading,
    modalError,
    openLogin,
    closeAuth,
    triggerOTP,
    confirmOTP,
    completeProfileSetup,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within FirebaseAuthProvider");
  return context;
};
