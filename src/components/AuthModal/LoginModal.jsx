import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getOrCreateRecaptchaVerifier, resetRecaptchaVerifier, formatAuthError } from "../../services/authService";
import "./LoginModal.css";

export default function LoginModal() {
  const { triggerOTP, modalLoading, modalError, setModalError } = useAuth();
  const [phone, setPhone] = useState("");
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setModalError(null);

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setLocalError("Phone number is required");
      return;
    }

    if (!/^\d{10}$/.test(trimmedPhone)) {
      setLocalError("Please enter a valid 10-digit phone number");
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

  return (
    <div className="login-modal-content">
      <div className="login-prompt-header">
        <h3 className="login-prompt-title">Enter your mobile number</h3>
        <p className="login-prompt-subtitle">
          If you don't have an account yet, we'll create one for you
        </p>
      </div>

      <form className="login-modal-form" onSubmit={handleSubmit} noValidate>
        <div className="login-input-wrapper">
          <div className="phone-input-container">
            <div className="phone-country-select">
              <span className="country-flag">🇮🇳</span>
              <span className="country-code">+91</span>
              <span className="dropdown-arrow">▼</span>
            </div>
            <input
              type="tel"
              id="phone"
              name="phone"
              maxLength="10"
              placeholder="Enter mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              disabled={modalLoading}
              className="phone-field"
              autoFocus
            />
          </div>
          {localError && <span className="field-error">{localError}</span>}
        </div>

        {modalError && <div className="modal-alert-error">{modalError}</div>}

        <button
          type="submit"
          className="login-submit-btn"
          disabled={modalLoading}
        >
          {modalLoading ? "Sending OTP..." : "Continue"}
        </button>
      </form>

      <p className="login-terms-footer">
        By continuing, you agree to our <a href="/terms" className="footer-link">Terms of Service</a> and <a href="/privacy" className="footer-link">Privacy Policy</a>.
      </p>
    </div>
  );
}
