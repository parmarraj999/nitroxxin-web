import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getOrCreateRecaptchaVerifier, resetRecaptchaVerifier, formatAuthError } from "../../services/authService";
import "./LoginModal.css";

export default function LoginModal() {
  const { triggerOTP, loginWithUid, modalLoading, modalError, setModalError } = useAuth();
  const [loginMode, setLoginMode] = useState("phone"); // "phone" | "uid"
  const [phone, setPhone] = useState("");
  const [testUid, setTestUid] = useState("");
  const [localError, setLocalError] = useState("");

  const handlePhoneSubmit = async (e) => {
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

  const handleUidSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setModalError(null);

    const trimmedUid = testUid.trim();
    if (!trimmedUid) {
      setLocalError("Please enter a UID to test");
      return;
    }

    try {
      await loginWithUid(trimmedUid);
    } catch (err) {
      console.error("UID login error:", err);
    }
  };

  return (
    <div className="login-modal-content">
      {/* Dev / Test Switcher */}
      <div className="login-tab-container">
        <button
          type="button"
          className={`login-tab-btn ${loginMode === "phone" ? "active" : ""}`}
          onClick={() => {
            setLoginMode("phone");
            setLocalError("");
            setModalError(null);
          }}
        >
          📱 Mobile OTP
        </button>
        <button
          type="button"
          className={`login-tab-btn ${loginMode === "uid" ? "active" : ""}`}
          onClick={() => {
            setLoginMode("uid");
            setLocalError("");
            setModalError(null);
          }}
        >
          🧪 Test UID Login
        </button>
      </div>

      {loginMode === "phone" ? (
        <>
          <div className="login-prompt-header">
            <h3 className="login-prompt-title">Enter your mobile number</h3>
            <p className="login-prompt-subtitle">
              If you don't have an account yet, we'll create one for you
            </p>
          </div>

          <form className="login-modal-form" onSubmit={handlePhoneSubmit} noValidate>
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
        </>
      ) : (
        <>
          <div className="login-prompt-header">
            <h3 className="login-prompt-title">Test Login with UID</h3>
            <p className="login-prompt-subtitle">
              Directly authenticate with any User ID to bypass OTP limit during testing
            </p>
          </div>

          <form className="login-modal-form" onSubmit={handleUidSubmit} noValidate>
            <div className="login-input-wrapper">
              <div className="uid-input-container">
                <span className="uid-input-icon">🔑</span>
                <input
                  type="text"
                  id="testUid"
                  name="testUid"
                  placeholder="Enter User UID (e.g. test_user_001)"
                  value={testUid}
                  onChange={(e) => setTestUid(e.target.value)}
                  disabled={modalLoading}
                  className="uid-field"
                  autoFocus
                />
              </div>
              {localError && <span className="field-error">{localError}</span>}

              {/* Quick Fill suggestions */}
              <div className="uid-demo-chips">
                <span className="uid-chip-label">Quick fill:</span>
                <button
                  type="button"
                  className="uid-chip-btn"
                  onClick={() => setTestUid("test_rider_01")}
                >
                  test_rider_01
                </button>
                <button
                  type="button"
                  className="uid-chip-btn"
                  onClick={() => setTestUid("demo_user_vip")}
                >
                  demo_vip
                </button>
              </div>
            </div>

            {modalError && <div className="modal-alert-error">{modalError}</div>}

            <button
              type="submit"
              className="login-submit-btn uid-submit-btn"
              disabled={modalLoading}
            >
              {modalLoading ? "Authenticating..." : "Sign In with UID"}
            </button>
          </form>
        </>
      )}

      <p className="login-terms-footer">
        By continuing, you agree to our <a href="/terms" className="footer-link">Terms of Service</a> and <a href="/privacy" className="footer-link">Privacy Policy</a>.
      </p>
    </div>
  );
}
