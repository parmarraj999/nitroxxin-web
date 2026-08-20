import { firestoreInstance } from "./firebase";
import { doc, getDoc, writeBatch, updateDoc, serverTimestamp } from "firebase/firestore";

/**
 * Fetches the user profile document from the Firestore "users" collection.
 * @param {string} uid - Firebase Auth user ID.
 * @returns {Promise<object|null>} user profile document
 */
export const getUserProfile = async (uid) => {
  try {
    const docRef = doc(firestoreInstance, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

/**
 * Checks if a username is already taken in the "usernames" collection.
 * @param {string} username - User input username.
 * @returns {Promise<boolean>} true if unique (not taken), false otherwise
 */
export const checkUsernameUnique = async (username) => {
  if (!username) return false;
  const usernameLower = username.trim().toLowerCase();
  try {
    const docRef = doc(firestoreInstance, "usernames", usernameLower);
    const docSnap = await getDoc(docRef);
    return !docSnap.exists();
  } catch (error) {
    console.error("Error checking username uniqueness:", error);
    throw error;
  }
};

/**
 * Atomically creates a user profile and reserves the username.
 * @param {string} uid - Firebase Auth user ID.
 * @param {object} userData - { fullName, username, email, phone, photoURL, interests }
 * @returns {Promise<void>}
 */
export const createUserProfile = async (uid, userData) => {
  const usernameLower = userData.username.trim().toLowerCase();
  
  const userRef = doc(firestoreInstance, "users", uid);
  const usernameRef = doc(firestoreInstance, "usernames", usernameLower);

  const batch = writeBatch(firestoreInstance);

  batch.set(userRef, {
    uid,
    fullName: userData.fullName.trim(),
    username: userData.username.trim(),
    usernameLower,
    email: userData.email ? userData.email.trim() : "",
    phone: userData.phone || "",
    photoURL: userData.photoURL || "",
    interests: userData.interests || [],
    isProfileComplete: true,
    role: "user",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  batch.set(usernameRef, {
    uid,
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    console.error("Error writing user profile and username reservation batch:", error);
    throw error;
  }
};

/**
 * Updates user profile attributes.
 * @param {string} uid - Firebase Auth user ID.
 * @param {object} updates - Profile properties to update.
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (uid, updates) => {
  try {
    const userRef = doc(firestoreInstance, "users", uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};
