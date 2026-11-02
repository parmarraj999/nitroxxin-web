import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "./GooglePhoneModal.css";

export default function GooglePhoneModal() {
  const {
    pendingGoogleUser,
    submitGooglePhone,
    loginWithPhoneNoOtp,
    modalLoading,
    modalError,
    setModalError,
    openLogin,
  } = useAuth();

  const [phone, setPhone] = useState("");
  const [localError, setLocalError] = useState("");
  const [noOtpLoading, setNoOtpLoading] = useState(false);

  const handleSubmit = async (e) => {
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

    try {
      await submitGooglePhone(trimmedPhone);
    } catch (err) {
      console.error("Submit Google phone error:", err);
    }
  };

  const handleNoOtpSubmit = async (e) => {
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

    setNoOtpLoading(true);
    try {
      await loginWithPhoneNoOtp(trimmedPhone);
    } catch (err) {
      console.error("Dev no-OTP login failed:", err);
    } finally {
      setNoOtpLoading(false);
    }
  };

  return (
    <div className="google-phone-modal-content">
      {/* Account Info Card / Pill */}
      <div className="google-account-pill">
        {pendingGoogleUser?.photoURL ? (
          <img
            src={pendingGoogleUser.photoURL}
            alt={pendingGoogleUser.displayName || "Google User"}
            className="google-account-avatar"
          />
        ) : (
          <div className="google-account-avatar google-account-avatar--fallback">
            {(pendingGoogleUser?.displayName?.[0] || "G").toUpperCase()}
          </div>
        )}
        <div className="google-account-details">
          <div className="google-account-name">
            {pendingGoogleUser?.displayName || "Google Account"}
          </div>
          <div className="google-account-email">
            {pendingGoogleUser?.email || "Signed in with Google"}
          </div>
        </div>
        <div className="google-badge-check" title="Google verified">
          ✓
        </div>
      </div>

      <p className="google-phone-hint">
        Link your mobile number to complete verification. We'll send a 6-digit OTP to verify.
      </p>

      <form className="google-phone-form" onSubmit={handleSubmit} noValidate>
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
              id="google-phone-field"
              name="phone"
              maxLength="10"
              placeholder="Enter 10-digit mobile number"
              value={phone}
              onChange={(e) => {
                setLocalError("");
                setModalError(null);
                setPhone(e.target.value.replace(/\D/g, ""));
              }}
              disabled={modalLoading || noOtpLoading}
              className="login-phone-input"
              autoFocus
            />
          </div>
          {localError && <span className="login-inline-error">{localError}</span>}
          {modalError && <div className="login-alert-error">{modalError}</div>}
        </div>

        {/* Primary Action Button: Send Verification Code */}
        <button
          type="submit"
          className="login-action-btn login-btn-primary"
          disabled={modalLoading || noOtpLoading || phone.length === 0}
        >
          {modalLoading && !noOtpLoading ? (
            <span className="login-btn-loading">
              <span className="login-spinner" />
              <span>Sending OTP...</span>
            </span>
          ) : (
            "Send Verification Code"
          )}
        </button>

        {/* Dev Testing Option: Login directly without OTP */}
        <button
          type="button"
          className="login-action-btn login-btn-no-otp"
          onClick={handleNoOtpSubmit}
          disabled={modalLoading || noOtpLoading || phone.length === 0}
        >
          {noOtpLoading ? (
            <span className="login-btn-loading">
              <span className="login-spinner" />
              <span>Verifying...</span>
            </span>
          ) : (
            <>
              <span className="login-no-otp-badge">DEV</span>
              <span>Login without OTP</span>
            </>
          )}
        </button>

        {/* Switch Account Option */}
        <div className="google-switch-account-row">
          <button
            type="button"
            className="google-switch-btn"
            onClick={openLogin}
            disabled={modalLoading || noOtpLoading}
          >
            ← Use a different login method
          </button>
        </div>
      </form>
    </div>
  );
}
