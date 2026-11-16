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

/**
 * Uploads a driving license image file to Firebase Storage.
 * @param {string} uid - User UID.
 * @param {File} file - Driving license image file.
 * @returns {Promise<string>} Download URL of the uploaded image
 */
export const uploadDrivingLicenseImage = async (uid, file) => {
  try {
    const storageRef = ref(storageInstance, `driving_licenses/${uid}/license_${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading driving license image:", error);
    throw error;
  }
};

/**
 * Uploads an Instagram professional dashboard screenshot for partner/creator affiliate applications.
 * @param {string} uidOrGuest - User UID or guest identifier.
 * @param {File} file - Screenshot image file.
 * @returns {Promise<string>} Download URL of the uploaded image
 */
export const uploadPartnerScreenshot = async (uidOrGuest, file) => {
  try {
    const safeName = file.name ? file.name.replace(/[^a-zA-Z0-9.-]/g, '_') : 'stats_screenshot.jpg';
    const storageRef = ref(
      storageInstance,
      `partner_applications/affiliates/${uidOrGuest || 'guest'}_${Date.now()}_${safeName}`
    );
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading partner screenshot:", error);
    throw error;
  }
};


