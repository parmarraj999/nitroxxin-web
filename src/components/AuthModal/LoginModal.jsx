import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getOrCreateRecaptchaVerifier, resetRecaptchaVerifier, formatAuthError } from "../../services/authService";
import "./LoginModal.css";

export default function LoginModal() {
  const { triggerOTP, signInWithGoogle, modalLoading, modalError, setModalError } = useAuth();
  const [phone, setPhone] = useState("");
  const [localError, setLocalError] = useState("");

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setModalError(null);

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setLocalError("Please enter your mobile number");
      return;
    }

    if (!/^\d{10}$/.test(trimmedPhone)) {
      setLocalError("Please enter a valid 10-digit mobile number");
      return;
    }

    const fullPhoneNumber = `+91${trimmedPhone}`;

    try {
      const verifier = getOrCreateRecaptchaVerifier("recaptcha-container", () => {
        setModalError("reCAPTCHA expired. Please request OTP again.");
      });

      if (!verifier) {
        throw new Error("Unable to initialize verification service. Please reload the page.");
      }

      await triggerOTP(fullPhoneNumber, verifier);
    } catch (err) {
      console.error("Failed to send OTP:", err);
      resetRecaptchaVerifier("recaptcha-container");
      setModalError(formatAuthError(err));
    }
  };

  const handleGoogleSignIn = async () => {
    setLocalError("");
    setModalError(null);
    try {
      if (typeof signInWithGoogle === "function") {
        await signInWithGoogle();
      }
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  return (
    <div className="login-modal-content">
      <form className="login-modal-form" onSubmit={handlePhoneSubmit} noValidate>
        {/* Phone Input Box */}
        <div className="login-field-group">
          <div className={`login-input-box ${localError ? "login-input-box--error" : ""}`}>
            <div className="login-country-pill">
              <span className="login-country-flag">🇮🇳</span>
              <span className="login-country-code">+91</span>
            </div>
            <div className="login-input-divider" />
            <input
              type="tel"
              id="login-phone-field"
              name="phone"
              maxLength="10"
              placeholder="Enter mobile number"
              value={phone}
              onChange={(e) => {
                setLocalError("");
                setModalError(null);
                setPhone(e.target.value.replace(/\D/g, ""));
              }}
              disabled={modalLoading}
              className="login-phone-input"
              autoFocus
            />
          </div>
          {localError && <span className="login-inline-error">{localError}</span>}
          {modalError && <div className="login-alert-error">{modalError}</div>}
        </div>

        {/* Primary Action Button: Continue with Phone (Coral/Red Gradient Pill) */}
        <button
          type="submit"
          className="login-action-btn login-btn-primary"
          disabled={modalLoading || phone.length === 0}
        >
          {modalLoading ? (
            <span className="login-btn-loading">
              <span className="login-spinner" />
              <span>Sending code...</span>
            </span>
          ) : (
            "Continue with Phone"
          )}
        </button>

        {/* Secondary Action Button: Continue with Google (Dark Pill with Google Icon) */}
        <button
          type="button"
          className="login-action-btn login-btn-google"
          onClick={handleGoogleSignIn}
          disabled={modalLoading}
        >
          <svg className="google-icon-svg" width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.39 7.37 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.61 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Footer Link */}
        <p className="login-footer-text">
          Don't have an account?{" "}
          <span
            className="login-signup-link"
            role="button"
            tabIndex={0}
            onClick={() => document.getElementById("login-phone-field")?.focus()}
          >
            Sign Up
          </span>
        </p>

        {/* Hidden reCAPTCHA anchor */}
        <div id="recaptcha-container"></div>
      </form>
    </div>
  );
}
