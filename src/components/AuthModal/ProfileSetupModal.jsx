import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { checkUsernameUnique } from "../../services/userService";
import "./ProfileSetupModal.css";

const INTERESTS_OPTIONS = [
  "Track Days",
  "Off-Road / Enduro",
  "Superbikes",
  "Cruising",
  "Adventure Touring",
  "Stunt Riding",
  "Vintage Classics",
  "Commuting",
];

export default function ProfileSetupModal() {
  const { completeProfileSetup, modalLoading, modalError, setModalError } = useAuth();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]);
  
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const [usernameStatus, setUsernameStatus] = useState(""); // "", "checking", "available", "taken"
  const [validationErrors, setValidationErrors] = useState({});

  // Debounced real-time username uniqueness check
  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus("");
      return;
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3 || !/^[a-zA-Z0-9_.]+$/.test(cleanUsername)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    const delayDebounce = setTimeout(async () => {
      try {
        const isUnique = await checkUsernameUnique(cleanUsername);
        setUsernameStatus(isUnique ? "available" : "taken");
      } catch (err) {
        console.error("Error checking username:", err);
        setUsernameStatus("");
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [username]);

  const handleInterestToggle = (interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest]
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setValidationErrors((prev) => ({ ...prev, avatar: "Image size should be less than 2MB" }));
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setValidationErrors((prev) => ({ ...prev, avatar: "" }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!fullName.trim()) {
      errors.fullName = "Full Name is required";
    } else if (fullName.trim().length < 3) {
      errors.fullName = "Full Name must be at least 3 characters";
    }

    if (!username.trim()) {
      errors.username = "Username is required";
    } else if (username.trim().length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_.]+$/.test(username.trim())) {
      errors.username = "Username can only contain letters, numbers, underscores, and dots";
    } else if (usernameStatus === "taken") {
      errors.username = "Username is already taken";
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);

    if (!validate()) return;
    if (usernameStatus === "checking") {
      setModalError("Please wait for username availability check");
      return;
    }

    try {
      await completeProfileSetup({
        fullName,
        username,
        email,
        interests: selectedInterests,
        avatarFile,
      });
    } catch (err) {
      console.error("Failed to complete profile:", err);
    }
  };

  return (
    <div className="setup-modal-content">
      <div className="setup-prompt-header">
        <h3 className="setup-prompt-title">Complete Your Profile</h3>
        <p className="setup-prompt-subtitle">Tell us about yourself to customize your ride feed</p>
      </div>

      <form className="setup-modal-form" onSubmit={handleSubmit}>
        {/* Avatar Upload */}
        <div className="avatar-upload-section">
          <div className="avatar-preview-container">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" className="avatar-preview-img" />
            ) : (
              <div className="avatar-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
            )}
          </div>
          <div className="avatar-upload-controls">
            <label htmlFor="avatar-file" className="avatar-file-label">
              Upload Profile Photo
            </label>
            <input
              type="file"
              id="avatar-file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={modalLoading}
              className="hidden-file-input"
            />
            <span className="avatar-upload-hint">JPG, PNG (Max 2MB)</span>
            {validationErrors.avatar && <span className="field-error">{validationErrors.avatar}</span>}
          </div>
        </div>

        {/* Full Name */}
        <div className="setup-input-group">
          <label htmlFor="fullName" className="setup-label">Full Name *</label>
          <input
            type="text"
            id="fullName"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={modalLoading}
            className={`setup-input ${validationErrors.fullName ? "input-error" : ""}`}
          />
          {validationErrors.fullName && <span className="field-error">{validationErrors.fullName}</span>}
        </div>

        {/* Username */}
        <div className="setup-input-group">
          <label htmlFor="username" className="setup-label">Choose Username *</label>
          <div className="username-input-wrapper">
            <input
              type="text"
              id="username"
              placeholder="rider_john"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
              disabled={modalLoading}
              className={`setup-input ${validationErrors.username ? "input-error" : ""}`}
            />
            <div className="username-status-indicator">
              {usernameStatus === "checking" && <span className="status-checking">Checking...</span>}
              {usernameStatus === "available" && <span className="status-available">Available ✓</span>}
              {usernameStatus === "taken" && <span className="status-taken">Taken ✗</span>}
              {usernameStatus === "invalid" && <span className="status-taken">Too short / Invalid</span>}
            </div>
          </div>
          {validationErrors.username && <span className="field-error">{validationErrors.username}</span>}
        </div>

        {/* Email */}
        <div className="setup-input-group">
          <label htmlFor="email" className="setup-label">Email Address (Optional)</label>
          <input
            type="email"
            id="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={modalLoading}
            className={`setup-input ${validationErrors.email ? "input-error" : ""}`}
          />
          {validationErrors.email && <span className="field-error">{validationErrors.email}</span>}
        </div>

        {/* Rider Interests Multi-select */}
        <div className="setup-input-group">
          <label className="setup-label">Select Your Rider Interests</label>
          <div className="interests-grid">
            {INTERESTS_OPTIONS.map((interest) => {
              const selected = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  disabled={modalLoading}
                  className={`interest-tag ${selected ? "selected" : ""}`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {modalError && <div className="modal-alert-error">{modalError}</div>}

        <button
          type="submit"
          className="setup-submit-btn"
          disabled={modalLoading || usernameStatus === "taken" || usernameStatus === "checking"}
        >
          {modalLoading ? "Saving Profile..." : "Start Riding"}
        </button>
      </form>
    </div>
  );
}
