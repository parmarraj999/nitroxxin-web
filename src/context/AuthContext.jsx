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

  // Subscribe to Firebase Auth and sync with Firestore profile
  useEffect(() => {
    let unsubscribeProfile;

    const unsubscribeAuth = subscribeToAuth(async (firebaseUser) => {
      if (unsubscribeProfile) unsubscribeProfile();
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

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

  const logout = useCallback(async () => {
    setLoading(true);
    try {
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
      await updateProfile({ photoURL });
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
