import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { resetRecaptchaVerifier, formatAuthError } from "../../services/authService";
import "./OTPModal.css";

export default function OTPModal() {
  const {
    phoneNumber,
    confirmOTP,
    triggerOTP,
    loginWithPhoneNoOtp,
    modalLoading,
    modalError,
    setModalError,
    openLogin,
    pendingGoogleUser,
    setActiveView,
  } = useAuth();

  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [timer, setTimer] = useState(30);
  const inputRefs = useRef([]);
  const isSubmittingRef = useRef(false);

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
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleVerification = async (code) => {
    if (isSubmittingRef.current || modalLoading) return;
    isSubmittingRef.current = true;
    try {
      await confirmOTP(code);
    } catch (err) {
      console.error("OTP verification failed:", err);
      setOtp(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleChange = (value, index) => {
    setModalError(null);
    const cleanDigits = value.replace(/\D/g, "");
    if (!cleanDigits && value !== "") return;

    // Support mobile SMS autofill and pasting multiple digits
    if (cleanDigits.length > 1) {
      const digitsArr = cleanDigits.slice(0, 6).split("");
      const newOtp = [...otp];
      const startIdx = digitsArr.length === 6 ? 0 : index;
      for (let i = 0; i < digitsArr.length && (startIdx + i) < 6; i++) {
        newOtp[startIdx + i] = digitsArr[i];
      }
      setOtp(newOtp);
      const nextFocus = Math.min(startIdx + digitsArr.length, 5);
      inputRefs.current[nextFocus]?.focus();
      const completeCode = newOtp.join("");
      if (completeCode.length === 6) {
        handleVerification(completeCode);
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanDigits.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input box
    if (cleanDigits && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // Auto-verify if all 6 digits are provided
    const completeCode = newOtp.join("");
    if (completeCode.length === 6) {
      handleVerification(completeCode);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      setModalError(null);
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      } else if (otp[index]) {
        e.preventDefault();
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0 && inputRefs.current[index - 1]) {
      e.preventDefault();
      inputRefs.current[index - 1].focus();
    } else if (e.key === "ArrowRight" && index < 5 && inputRefs.current[index + 1]) {
      e.preventDefault();
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    setModalError(null);
    const pasteData = (e.clipboardData || window.clipboardData)?.getData("text")?.trim() || "";
    const cleanDigits = pasteData.replace(/\D/g, "");
    if (cleanDigits.length >= 6) {
      const digits = cleanDigits.slice(0, 6).split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
      handleVerification(cleanDigits.slice(0, 6));
    } else if (cleanDigits.length > 0) {
      const digits = cleanDigits.split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      inputRefs.current[Math.min(digits.length, 5)]?.focus();
    }
  };

  const handleResend = async () => {
    if (timer > 0 || modalLoading || isSubmittingRef.current) return;
    setModalError(null);
    setOtp(new Array(6).fill(""));
    try {
      const verifier = resetRecaptchaVerifier("recaptcha-container");
      if (!verifier) {
        throw new Error("Verification service is unavailable. Please reload the page.");
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
            onClick={() => (pendingGoogleUser ? setActiveView("googlePhone") : openLogin())}
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
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(e.target.value, idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              disabled={modalLoading}
              className={`otp-digit-box ${digit ? "otp-digit-box--filled" : ""}`}
              autoComplete={idx === 0 ? "one-time-code" : "off"}
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

      <div style={{ marginTop: "14px", textAlign: "center" }}>
        <button
          type="button"
          className="otp-bypass-btn"
          onClick={async () => {
            try {
              await loginWithPhoneNoOtp(phoneNumber);
            } catch (err) {
              console.error("OTP bypass failed:", err);
            }
          }}
          disabled={modalLoading}
        >
          ⚡ Login without OTP (Dev Bypass)
        </button>
      </div>

      <div className="otp-back-row">
        <button
          type="button"
          className="otp-back-link-btn"
          onClick={() => (pendingGoogleUser ? setActiveView("googlePhone") : openLogin())}
          disabled={modalLoading}
        >
          {pendingGoogleUser ? "← Change Phone Number" : "← Back to Phone Login"}
        </button>
      </div>
    </div>
  );
}
