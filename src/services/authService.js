import { authInstance } from "./firebase";
import {
  signInWithPhoneNumber,
  linkWithPhoneNumber,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

/**
 * Initializes or retrieves the singleton RecaptchaVerifier instance.
 * @param {string} containerId - Element ID for the reCAPTCHA container.
 * @param {function} [onExpired] - Optional callback when reCAPTCHA token expires.
 * @returns {RecaptchaVerifier|null}
 */
export const getOrCreateRecaptchaVerifier = (containerId = "recaptcha-container", onExpired) => {
  if (typeof window === "undefined") return null;

  if (window.recaptchaVerifier) {
    return window.recaptchaVerifier;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`reCAPTCHA container #${containerId} not found in DOM.`);
    return null;
  }

  // Ensure container element has no stale children
  container.innerHTML = "";

  window.recaptchaVerifier = new RecaptchaVerifier(authInstance, container, {
    size: "invisible",
    callback: () => {
      // reCAPTCHA solved
    },
    "expired-callback": () => {
      console.warn("reCAPTCHA token expired.");
      if (typeof onExpired === "function") {
        onExpired();
      }
    },
  });

  return window.recaptchaVerifier;
};

/**
 * Clears and resets the RecaptchaVerifier instance.
 * @param {string} containerId - Element ID for the reCAPTCHA container.
 */
export const resetRecaptchaVerifier = (containerId = "recaptcha-container") => {
  if (typeof window === "undefined") return null;

  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      // ignore
    }
    window.recaptchaVerifier = null;
  }

  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = "";
  }

  return getOrCreateRecaptchaVerifier(containerId);
};

/**
 * Formats Firebase auth error codes into user-friendly messages.
 * @param {Error} error
 * @returns {string}
 */
export const formatAuthError = (error) => {
  if (!error) return "An unexpected error occurred. Please try again.";
  const code = error.code || "";
  switch (code) {
    case "auth/invalid-app-credential":
      return "Verification failed (invalid app credential). If running locally, ensure 'localhost' is listed under Firebase Console > Authentication > Settings > Authorized domains.";
    case "auth/captcha-check-failed": {
      const currentHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
      if (error.message && error.message.includes("Hostname match not found")) {
        return `Domain not authorized (${currentHost}). Add "${currentHost}" in Firebase Console > Authentication > Settings > Authorized domains.`;
      }
      return "reCAPTCHA verification failed. Please check your network and try again.";
    }
    case "auth/too-many-requests":
      return "Too many requests. Please wait a few moments before trying again.";
    case "auth/quota-exceeded":
      return "SMS quota exceeded. Please try again later.";
    case "auth/invalid-phone-number":
      return "Please enter a valid phone number.";
    default:
      return error.message || "Failed to send verification code. Please try again.";
  }
};

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

/**
 * Attempts to retrieve phone number from Google People API using the OAuth access token.
 * @param {string} accessToken
 * @returns {Promise<string|null>}
 */
export const getPhoneNumberFromGoogle = async (accessToken) => {
  if (!accessToken) return null;
  try {
    const res = await fetch("https://people.googleapis.com/v1/people/me?personFields=phoneNumbers", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const phoneList = data.phoneNumbers || [];
    for (const item of phoneList) {
      const val = item.canonicalForm || item.value;
      if (val) return val;
    }
  } catch (e) {
    console.warn("Could not fetch phone number from Google People API:", e);
  }
  return null;
};

/**
 * Initiates Google Sign-In using Firebase Auth popup.
 * Also requests phone number scope and attempts to retrieve phone from Google account.
 * @returns {Promise<{ user: object, accessToken: string|null, googlePhone: string|null }>}
 */
export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope("https://www.googleapis.com/auth/user.phonenumbers.read");
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(authInstance, provider);

    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;

    let googlePhone = result.user?.phoneNumber || null;
    if (!googlePhone) {
      const providerPhone = result.user?.providerData?.find((p) => p.phoneNumber)?.phoneNumber;
      if (providerPhone) googlePhone = providerPhone;
    }

    if (!googlePhone && accessToken) {
      googlePhone = await getPhoneNumberFromGoogle(accessToken);
    }

    return {
      user: result.user,
      accessToken,
      googlePhone,
    };
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

/**
 * Sends OTP for a user already signed in (e.g. Google user), attempting to link the phone number.
 * Falls back to regular sendOTP if linkWithPhoneNumber fails or throws.
 * @param {object} currentUser - Firebase auth user
 * @param {string} phoneNumber - E.164 formatted number (+91...)
 * @param {object} recaptchaVerifier - RecaptchaVerifier instance
 * @returns {Promise<object>} confirmationResult
 */
export const sendOTPForUser = async (currentUser, phoneNumber, recaptchaVerifier) => {
  if (currentUser) {
    try {
      const confirmationResult = await linkWithPhoneNumber(
        currentUser,
        phoneNumber,
        recaptchaVerifier
      );
      return confirmationResult;
    } catch (err) {
      console.warn("linkWithPhoneNumber error, falling back to sendOTP:", err);
      if (
        err.code === "auth/credential-already-in-use" ||
        err.code === "auth/provider-already-linked" ||
        err.code === "auth/invalid-verification-id"
      ) {
        return await sendOTP(phoneNumber, recaptchaVerifier);
      }
      throw err;
    }
  }
  return await sendOTP(phoneNumber, recaptchaVerifier);
};

