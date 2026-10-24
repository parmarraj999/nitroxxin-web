const { defineSecret } = require('firebase-functions/params');

/**
 * Secret Manager parameter for Resend API Key
 * Never hardcoded. Set via Firebase CLI:
 *   firebase functions:secrets:set RESEND_API_KEY
 */
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');

/**
 * Optional custom sender email address.
 * Set via Firebase CLI:
 *   firebase functions:secrets:set SENDER_EMAIL
 * Defaults to: "Nitroxx Events <tickets@nitroxx.in>"
 */
const SENDER_EMAIL = defineSecret('SENDER_EMAIL');

module.exports = {
  RESEND_API_KEY,
  SENDER_EMAIL,
};
