import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth, db, serverTimestamp, storage } from "../services/firebase";

const AuthContext = createContext(null);

export const FirebaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribeProfile;

    const unsubscribeAuth = auth().onAuthStateChanged((firebaseUser) => {
      if (unsubscribeProfile) unsubscribeProfile();
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      unsubscribeProfile = db()
        .collection("users")
        .doc(firebaseUser.uid)
        .onSnapshot(
          (doc) => {
            setProfile(doc.exists ? { id: doc.id, ...doc.data() } : null);
            setLoading(false);
          },
          (snapshotError) => {
            setError(snapshotError);
            setLoading(false);
          }
        );
    });

    return () => {
      if (unsubscribeProfile) unsubscribeProfile();
      unsubscribeAuth();
    };
  }, []);

  const signUp = useCallback(async ({ fullName, email, password }) => {
    setError(null);
    const credential = await auth().createUserWithEmailAndPassword(email, password);
    await credential.user.updateProfile({ displayName: fullName });
    await db().collection("users").doc(credential.user.uid).set(
      {
        uid: credential.user.uid,
        fullName,
        displayName: fullName,
        email,
        role: "user",
        photoURL: "",
        phone: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return credential.user;
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setError(null);
    const credential = await auth().signInWithEmailAndPassword(email, password);
    await db().collection("users").doc(credential.user.uid).set(
      {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName || "",
        photoURL: credential.user.photoURL || "",
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
    return credential.user;
  }, []);

  const logout = useCallback(() => auth().signOut(), []);
  const forgotPassword = useCallback((email) => auth().sendPasswordResetEmail(email), []);

  const updateProfile = useCallback(
    async (updates) => {
      if (!user) throw new Error("You must be logged in.");
      await db().collection("users").doc(user.uid).set(
        {
          ...updates,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const authUpdates = {};
      if (updates.displayName || updates.fullName) {
        authUpdates.displayName = updates.displayName || updates.fullName;
      }
      if (updates.photoURL) authUpdates.photoURL = updates.photoURL;
      if (Object.keys(authUpdates).length) await user.updateProfile(authUpdates);
    },
    [user]
  );

  const uploadProfilePhoto = useCallback(
    async (file) => {
      if (!user) throw new Error("You must be logged in.");
      const ref = storage().ref(`users/${user.uid}/profile/${Date.now()}-${file.name}`);
      await ref.put(file);
      const photoURL = await ref.getDownloadURL();
      await updateProfile({ photoURL });
      return photoURL;
    },
    [updateProfile, user]
  );

  const changePassword = useCallback(
    (newPassword) => {
      if (!user) throw new Error("You must be logged in.");
      return user.updatePassword(newPassword);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      error,
      signUp,
      login,
      logout,
      forgotPassword,
      updateProfile,
      uploadProfilePhoto,
      changePassword,
      isAuthenticated: !!user,
    }),
    [changePassword, error, forgotPassword, loading, login, logout, profile, signUp, updateProfile, uploadProfilePhoto, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within FirebaseAuthProvider");
  return context;
};
