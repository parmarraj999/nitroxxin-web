import { storageInstance } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Uploads a profile image file to Firebase Storage.
 * @param {string} uid - User UID.
 * @param {File} file - Profile image file.
 * @returns {Promise<string>} Download URL of the uploaded image
 */
export const uploadProfileImage = async (uid, file) => {
  try {
    const storageRef = ref(storageInstance, `users/${uid}/profile-${Date.now()}-${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw error;
  }
};
