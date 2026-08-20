import { authInstance } from "./firebase";
import { signInWithPhoneNumber, signOut, onAuthStateChanged } from "firebase/auth";

/**
 * Sends an OTP to the given phone number.
 * @param {string} phoneNumber - E.164 formatted number (e.g. +919876543210).
 * @param {object} recaptchaVerifier - Firebase RecaptchaVerifier instance.
 * @returns {Promise<object>} confirmationResult
 */
export const sendOTP = async (phoneNumber, recaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(
      authInstance,
      phoneNumber,
      recaptchaVerifier
    );
    return confirmationResult;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};

/**
 * Verifies the OTP code.
 * @param {object} confirmationResult - Firebase confirmation result object.
 * @param {string} code - The 6-digit OTP code entered by the user.
 * @returns {Promise<object>} Firebase User
 */
export const verifyOTP = async (confirmationResult, code) => {
  try {
    const credential = await confirmationResult.confirm(code);
    return credential.user;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw error;
  }
};

/**
 * Signs out the current Firebase user.
 * @returns {Promise<void>}
 */
export const logoutUser = () => {
  return signOut(authInstance);
};

/**
 * Subscribes to Firebase Authentication state changes.
 * @param {function} callback - Triggers on auth state change.
 * @returns {function} unsubscribe callback
 */
export const subscribeToAuth = (callback) => {
  return onAuthStateChanged(authInstance, callback);
};
