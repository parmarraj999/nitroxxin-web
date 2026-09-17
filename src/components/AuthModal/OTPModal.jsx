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

  // Focus the first input box on component mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer for resend OTP
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
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    // If user typed/pasted a single digit
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input if filled
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // Auto-submit if all 6 digits are entered
    const completeCode = newOtp.join("");
    if (completeCode.length === 6) {
      handleVerification(completeCode);
    }
  };

  const handleKeyDown = (e, index) => {
    // Handle backspace navigation
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
      // Clear inputs on failure to allow retry
      setOtp(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setModalError(null);
    setOtp(new Array(6).fill(""));
    try {
      const verifier = getOrCreateRecaptchaVerifier("recaptcha-container");
      if (!verifier) {
        throw new Error("reCAPTCHA verifier is missing. Please restart.");
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
      setModalError("Please enter the full 6-digit OTP code");
      return;
    }
    handleVerification(fullOtp);
  };

  return (
    <div className="otp-modal-content">
      <div className="otp-prompt-header">
        <h3 className="otp-prompt-title">Enter OTP</h3>
        <p className="otp-prompt-subtitle">
          We have sent a verification code to <span className="highlight-phone">{phoneNumber}</span>{" "}
          <button className="change-phone-btn" onClick={openLogin} disabled={modalLoading}>
            (Change)
          </button>
        </p>
      </div>

      <form className="otp-modal-form" onSubmit={handleFormSubmit}>
        <div className="otp-inputs-row" onPaste={handlePaste}>
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
              className="otp-digit-field"
            />
          ))}
        </div>

        {modalError && <div className="modal-alert-error">{modalError}</div>}

        <button
          type="submit"
          className="otp-submit-btn"
          disabled={modalLoading || otp.join("").length < 6}
        >
          {modalLoading ? "Verifying..." : "Continue"}
        </button>
      </form>

      <div className="otp-resend-container">
        {timer > 0 ? (
          <p className="resend-timer-text">
            Didn't get the OTP? (Request again in <span className="timer-seconds">{timer}s</span>)
          </p>
        ) : (
          <button
            type="button"
            className="resend-code-btn"
            onClick={handleResend}
            disabled={modalLoading}
          >
            Resend OTP
          </button>
        )}
      </div>
    </div>
  );
}
