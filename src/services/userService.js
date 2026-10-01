import { firestoreInstance } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";

/**
 * Searches for an existing user document in the "users" collection without creating a new document.
 * Looks up by document ID, field "uid", "phone", "email", or "username".
 * @param {string} identifier - UID, phone, email, or username.
 * @returns {Promise<object|null>} user profile document or null
 */
export const findExistingUser = async (identifier) => {
  if (!identifier) return null;
  const trimmed = identifier.trim();

  try {
    // 1. Exact document ID lookup
    const docRef = doc(firestoreInstance, "users", trimmed);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }

    // 2. Query where uid == trimmed
    const usersCol = collection(firestoreInstance, "users");
    const uidQuery = query(usersCol, where("uid", "==", trimmed), limit(1));
    const uidSnap = await getDocs(uidQuery);
    if (!uidSnap.empty) {
      const found = uidSnap.docs[0];
      return { id: found.id, ...found.data() };
    }

    // 3. Query where phone == trimmed (also test variations like with or without +91)
    const phoneVariations = [
      trimmed,
      trimmed.replace(/\s+/g, ""),
      trimmed.startsWith("+91") ? trimmed.slice(3) : `+91${trimmed}`,
      trimmed.startsWith("91") && trimmed.length === 12 ? `+${trimmed}` : null,
      trimmed.startsWith("0") ? trimmed.slice(1) : null,
    ].filter(Boolean);

    for (const ph of phoneVariations) {
      const phoneQuery = query(usersCol, where("phone", "==", ph), limit(1));
      const phoneSnap = await getDocs(phoneQuery);
      if (!phoneSnap.empty) {
        const found = phoneSnap.docs[0];
        return { id: found.id, ...found.data() };
      }
    }

    // 4. Query where email == trimmed
    const emailQuery = query(usersCol, where("email", "==", trimmed.toLowerCase()), limit(1));
    const emailSnap = await getDocs(emailQuery);
    if (!emailSnap.empty) {
      const found = emailSnap.docs[0];
      return { id: found.id, ...found.data() };
    }

    // 5. Query where username == trimmed
    const usernameQuery = query(usersCol, where("username", "==", trimmed), limit(1));
    const usernameSnap = await getDocs(usernameQuery);
    if (!usernameSnap.empty) {
      const found = usernameSnap.docs[0];
      return { id: found.id, ...found.data() };
    }

    // 6. Case-insensitive document ID check fallback across users
    const allUsersSnap = await getDocs(query(usersCol, limit(50)));
    for (const d of allUsersSnap.docs) {
      if (d.id.toLowerCase() === trimmed.toLowerCase()) {
        return { id: d.id, ...d.data() };
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding existing user:", error);
    throw error;
  }
};

/**
 * Fetches all present users from the "users" collection for test login selector.
 * @param {number} limitCount
 * @returns {Promise<Array<object>>}
 */
export const getExistingUsers = async (limitCount = 20) => {
  try {
    const q = query(collection(firestoreInstance, "users"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((docSnap) => ({
      id: docSnap.id,
      uid: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (err) {
    console.error("Error fetching existing users list:", err);
    return [];
  }
};

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
 * Ensures a basic user profile document exists in Firestore for the given user ID.
 * Useful for immediate OTP login without blocking on profile details.
 * @param {string} uid - Firebase Auth user ID.
 * @param {object} userData - Basic user attributes (e.g. phone).
 * @returns {Promise<object>} user profile document
 */
export const ensureUserProfile = async (uid, userData = {}) => {
  try {
    const userRef = doc(firestoreInstance, "users", uid);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      const initialData = {
        uid,
        phone: userData.phone || "",
        fullName: userData.fullName || userData.name || userData.displayName || "",
        isProfileComplete: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, initialData, { merge: true });
      return { id: uid, ...initialData };
    }
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error("Error ensuring user profile:", error);
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
 * @param {object} userData - { fullName, username, email, phone, profilePhoto, drivingLicense, drivingLicenseImage, interests }
 * @returns {Promise<void>}
 */
export const createUserProfile = async (uid, userData) => {
  const usernameLower = userData.username.trim().toLowerCase();
  
  const userRef = doc(firestoreInstance, "users", uid);
  const usernameRef = doc(firestoreInstance, "usernames", usernameLower);

  const batch = writeBatch(firestoreInstance);

  batch.set(userRef, {
    uid,
    fullName: (userData.fullName || userData.name || userData.displayName || "").trim(),
    username: userData.username.trim(),
    usernameLower,
    email: userData.email ? userData.email.trim() : "",
    phone: userData.phone || userData.phoneNumber || "",
    profilePhoto: userData.profilePhoto || userData.photoURL || "",
    drivingLicense: userData.drivingLicense || "",
    drivingLicenseImage: userData.drivingLicenseImage || userData.drivingLicensePhoto || "",
    interests: userData.interests || [],
    isProfileComplete: true,
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
    await setDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};
