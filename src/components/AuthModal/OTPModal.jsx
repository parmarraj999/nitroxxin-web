import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { getOrCreateRecaptchaVerifier, formatAuthError } from "../../services/authService";
import "./OTPModal.css";

export default function OTPModal() {
  const {
    phoneNumber,
    confirmOTP,
    triggerOTP,
    modalLoading,
    modalError,
    setModalError,
    openLogin,
  } = useAuth();

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef([]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // 30s countdown timer for resending OTP
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input box
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // Auto-verify if all 6 digits are provided
    const completeCode = newOtp.join("");
    if (completeCode.length === 6) {
      handleVerification(completeCode);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
      handleVerification(pasteData);
    }
  };

  const handleVerification = async (code) => {
    try {
      await confirmOTP(code);
    } catch (err) {
      console.error("OTP verification failed:", err);
      setOtp(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer > 0 || modalLoading) return;
    setModalError(null);
    setOtp(new Array(6).fill(""));
    try {
      const verifier = getOrCreateRecaptchaVerifier("recaptcha-container");
      if (!verifier) {
        throw new Error("Verification service is unavailable. Please restart.");
      }
      await triggerOTP(phoneNumber, verifier);
      setTimer(30);
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error("Resend OTP error:", err);
      setModalError(formatAuthError(err));
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setModalError("Please enter the complete 6-digit OTP");
      return;
    }
    handleVerification(fullOtp);
  };

  return (
    <div className="otp-modal-content">
      <div className="otp-header-info">
        <p className="otp-sent-to-text">
          Code sent to <span className="otp-phone-highlight">{phoneNumber || "your mobile"}</span>
          <button
            type="button"
            className="otp-change-number-btn"
            onClick={openLogin}
            disabled={modalLoading}
          >
            Edit
          </button>
        </p>
      </div>

      <form className="otp-form" onSubmit={handleFormSubmit}>
        <div className="otp-inputs-grid" onPaste={handlePaste}>
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(e.target.value, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              disabled={modalLoading}
              className={`otp-digit-box ${digit ? "otp-digit-box--filled" : ""}`}
              autoComplete="one-time-code"
            />
          ))}
        </div>

        {modalError && <div className="otp-alert-error">{modalError}</div>}

        <button
          type="submit"
          className="otp-verify-btn"
          disabled={modalLoading || otp.join("").length < 6}
        >
          {modalLoading ? (
            <span className="otp-btn-loading">
              <span className="otp-spinner" />
              <span>Verifying...</span>
            </span>
          ) : (
            "Verify & Continue"
          )}
        </button>
      </form>

      <div className="otp-resend-row">
        {timer > 0 ? (
          <span className="otp-countdown-text">
            Didn't receive code? Resend in <span className="otp-seconds-badge">{timer}s</span>
          </span>
        ) : (
          <button
            type="button"
            className="otp-resend-action-btn"
            onClick={handleResend}
            disabled={modalLoading}
          >
            Resend OTP
          </button>
        )}
      </div>

      <div className="otp-back-row">
        <button
          type="button"
          className="otp-back-link-btn"
          onClick={openLogin}
          disabled={modalLoading}
        >
          ← Back to Phone Login
        </button>
      </div>
    </div>
  );
}
