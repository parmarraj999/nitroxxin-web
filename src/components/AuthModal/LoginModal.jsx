import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getOrCreateRecaptchaVerifier, resetRecaptchaVerifier, formatAuthError } from "../../services/authService";
import { getExistingUsers } from "../../services/userService";
import "./LoginModal.css";

export default function LoginModal() {
  const { triggerOTP, loginWithUid, modalLoading, modalError, setModalError } = useAuth();
  const [loginMode, setLoginMode] = useState("phone"); // "phone" | "uid"
  const [phone, setPhone] = useState("");
  const [testUid, setTestUid] = useState("");
  const [localError, setLocalError] = useState("");
  const [presentUsers, setPresentUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch actual present users from Firestore when entering UID test mode
  useEffect(() => {
    if (loginMode === "uid") {
      let isMounted = true;
      setLoadingUsers(true);
      getExistingUsers(10)
        .then((users) => {
          if (isMounted) setPresentUsers(users);
        })
        .catch((err) => {
          console.error("Error loading present users:", err);
        })
        .finally(() => {
          if (isMounted) setLoadingUsers(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [loginMode]);

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
      setLocalError("Please enter an existing UID, Phone, or Email");
      return;
    }

    try {
      await loginWithUid(trimmedUid);
    } catch (err) {
      console.error("UID login error:", err);
    }
  };

  const handleSelectPresentUser = async (userDoc) => {
    setLocalError("");
    setModalError(null);
    setTestUid(userDoc.id);
    try {
      await loginWithUid(userDoc.id);
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
          🧪 Present UID Login
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
            <h3 className="login-prompt-title">Login with Present UID</h3>
            <p className="login-prompt-subtitle">
              Choose an existing user from the database or enter a UID/Phone to test without creating new documents
            </p>
          </div>

          {/* Present Users in Firestore List */}
          <div className="present-users-section">
            <div className="present-users-header">
              <span className="present-users-title">👤 Present Accounts in Database</span>
              {loadingUsers && <span className="present-users-loading">Loading accounts…</span>}
            </div>

            {presentUsers.length > 0 ? (
              <div className="present-users-grid">
                {presentUsers.map((u) => {
                  const displayName = u.fullName || u.name || u.displayName || "User";
                  const phoneText = u.phone || u.phoneNumber || "No phone";
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className="present-user-card"
                      disabled={modalLoading}
                      onClick={() => handleSelectPresentUser(u)}
                    >
                      <div className="present-user-avatar">
                        {u.profilePhoto || u.photoURL ? (
                          <img src={u.profilePhoto || u.photoURL} alt={displayName} />
                        ) : (
                          <span>{displayName[0]?.toUpperCase() || "U"}</span>
                        )}
                      </div>
                      <div className="present-user-details">
                        <div className="present-user-top">
                          <span className="present-user-name">{displayName}</span>
                          <span className="present-user-login-badge">Select ➔</span>
                        </div>
                        <div className="present-user-sub">
                          <span className="present-user-phone">{phoneText}</span>
                          <span className="present-user-uid" title={u.id}>
                            UID: {u.id.slice(0, 10)}…{u.id.slice(-4)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : !loadingUsers ? (
              <div className="present-users-empty">No users found in database</div>
            ) : null}
          </div>

          <form className="login-modal-form" onSubmit={handleUidSubmit} noValidate>
            <div className="login-input-wrapper">
              <label className="manual-uid-label" htmlFor="testUid">
                Or enter UID, Phone, or Email manually:
              </label>
              <div className="uid-input-container">
                <span className="uid-input-icon">🔑</span>
                <input
                  type="text"
                  id="testUid"
                  name="testUid"
                  placeholder="e.g. zpUzjlcVLkN4JAbq3OCerqY5SCw2 or 8869959066"
                  value={testUid}
                  onChange={(e) => setTestUid(e.target.value)}
                  disabled={modalLoading}
                  className="uid-field"
                />
              </div>
              {localError && <span className="field-error">{localError}</span>}

              <div className="uid-safe-notice">
                <span>🛡️ Safe for Testing: Only logs in from present users. Never creates new documents.</span>
              </div>
            </div>

            {modalError && <div className="modal-alert-error">{modalError}</div>}

            <button
              type="submit"
              className="login-submit-btn uid-submit-btn"
              disabled={modalLoading}
            >
              {modalLoading ? "Authenticating..." : "Sign In with Present Account"}
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
