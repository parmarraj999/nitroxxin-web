import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import "./ProfileOverview.css";

export default function ProfileOverview() {
  const {
    user,
    profile,
    updateProfile,
    uploadProfilePhoto,
    uploadUserDrivingLicense,
    removeUserDrivingLicense,
  } = useAuth();

  const fileInputRef = useRef(null);
  const licenseFileInputRef = useRef(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingLicense, setIsUploadingLicense] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showLicensePreview, setShowLicensePreview] = useState(false);

  // Profile Form state matching screenshot fields
  const [form, setForm] = useState({
    username: "",
    name: "",
    phone: "",
    email: "",
    drivingLicense: "",
    emergencyNumber: "",
  });

  // Sync state whenever profile/user updates
  useEffect(() => {
    const rawUsername =
      profile?.username ||
      (user?.phone || user?.phoneNumber
        ? `user_${(user.phone || user.phoneNumber).slice(-4)}`
        : user?.uid
        ? `user_${user.uid.slice(0, 5)}`
        : user?.email
        ? user.email.split("@")[0]
        : "");

    const formattedUsername = rawUsername ? (rawUsername.startsWith("@") ? rawUsername : `@${rawUsername}`) : "";

    setForm({
      username: formattedUsername,
      name:
        profile?.fullName ||
        profile?.name ||
        profile?.displayName ||
        user?.fullName ||
        user?.displayName ||
        "",
      phone: profile?.phone || profile?.phoneNumber || user?.phone || user?.phoneNumber || "",
      email: profile?.email || user?.email || "",
      drivingLicense: profile?.drivingLicense || "",
      emergencyNumber: profile?.emergencyNumber || "",
    });
  }, [profile, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaveSuccess(false);
    setErrorMessage("");
  };

  // Handle avatar photo selection and upload
  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setErrorMessage("");
    try {
      await uploadProfilePhoto(file);
    } catch (err) {
      console.error("Photo upload error:", err);
      setErrorMessage(err.message || "Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle driving license document photo upload
  const handleLicenseSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLicense(true);
    setErrorMessage("");
    try {
      await uploadUserDrivingLicense(file);
    } catch (err) {
      console.error("License photo upload error:", err);
      setErrorMessage(err.message || "Failed to upload license photo. Please try again.");
    } finally {
      setIsUploadingLicense(false);
    }
  };

  // Handle driving license removal
  const handleRemoveLicense = async (e) => {
    e.preventDefault();
    if (!window.confirm("Remove your attached driving license document?")) return;

    try {
      await removeUserDrivingLicense();
    } catch (err) {
      console.error("Failed to remove license:", err);
      setErrorMessage("Could not remove license photo.");
    }
  };

  // Save details
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    try {
      const cleanUsername = form.username.trim().replace(/^@/, "");
      const trimmedName = form.name.trim();
      const trimmedPhone = form.phone.trim();
      const trimmedEmail = form.email.trim();
      const trimmedLicense = form.drivingLicense.trim().toUpperCase();
      const trimmedEmergency = form.emergencyNumber.trim();

      await updateProfile({
        fullName: trimmedName,
        name: trimmedName,
        displayName: trimmedName,
        username: cleanUsername ? `@${cleanUsername}` : "",
        phone: trimmedPhone,
        phoneNumber: trimmedPhone,
        email: trimmedEmail,
        drivingLicense: trimmedLicense,
        emergencyNumber: trimmedEmergency,
        isProfileComplete: Boolean(
          trimmedName && trimmedPhone && trimmedEmail && trimmedLicense
        ),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setErrorMessage(err.message || "Failed to update profile details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentPhoto = profile?.profilePhoto || profile?.photoURL || user?.profilePhoto || user?.photoURL;
  const currentLicenseImage =
    profile?.drivingLicenseImage ||
    profile?.drivingLicensePhoto ||
    null;

  const hasLicenseAttached = Boolean(currentLicenseImage);

  return (
    <div className="nx-details-page-wrap">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={handlePhotoSelect}
      />
      <input
        type="file"
        ref={licenseFileInputRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleLicenseSelect}
      />

      {/* Top Header matching Screenshot 1 */}
      <div className="nx-details-header">
        <h1 className="nx-details-title">Your Details</h1>
        <button
          type="button"
          className="nx-details-check-btn"
          onClick={handleSave}
          title="Save Details"
          aria-label="Save Details"
          disabled={isSaving}
        >
          {isSaving ? (
            <div className="nx-btn-mini-spinner" />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>
      </div>

      {saveSuccess && (
        <div className="nx-details-alert-success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Details saved successfully!
        </div>
      )}

      {errorMessage && (
        <div className="nx-details-alert-error">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="nx-details-desktop-layout">
        {/* Left Column: Avatar & License Document */}
        <div className="nx-details-left-panel">
          <div className="nx-details-avatar-card">
            {/* Centered Avatar with Blue Ring & Pencil Badge */}
            <div className="nx-details-avatar-section">
              <div
                className="nx-details-avatar-ring"
                onClick={() => fileInputRef.current?.click()}
                title="Change profile picture"
              >
                {currentPhoto ? (
                  <img src={currentPhoto} alt="Profile" className="nx-details-avatar-img" />
                ) : (
                  <div className="nx-details-avatar-empty">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}

                {/* Blue floating edit pencil button */}
                <button
                  type="button"
                  className="nx-details-pencil-badge"
                  aria-label="Upload photo"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
              </div>

              {isUploadingPhoto && (
                <span className="nx-details-uploading-tag">Uploading photo...</span>
              )}

              <h3 className="nx-details-profile-name">{form.name || "Nitroxx Rider"}</h3>
              <span className="nx-details-profile-handle">{form.username || "@rider"}</span>
            </div>
          </div>

          {/* License Document Photo Card */}
          <div className="nx-details-field">
            <div className="nx-details-license-label-row">
              <label className="nx-details-label">License Document Photo</label>
              {hasLicenseAttached && (
                <span className="nx-details-attached-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Attached
                </span>
              )}
            </div>

            <div className="nx-details-license-card">
              {currentLicenseImage ? (
                <div className="nx-details-license-preview-box">
                  <img
                    src={currentLicenseImage}
                    alt="Driving License Document"
                    className="nx-details-license-img"
                  />
                  <button
                    type="button"
                    className="nx-details-tap-preview-pill"
                    onClick={() => setShowLicensePreview(true)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Tap to preview
                  </button>
                </div>
              ) : (
                <div
                  className="nx-details-license-empty"
                  onClick={() => licenseFileInputRef.current?.click()}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>Upload Driving License Photo</span>
                </div>
              )}

              {isUploadingLicense && (
                <div className="nx-details-license-uploading">Uploading document...</div>
              )}

              <div className="nx-details-license-actions">
                <button
                  type="button"
                  className="nx-details-btn-change-photo"
                  onClick={() => licenseFileInputRef.current?.click()}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Change Photo
                </button>

                {hasLicenseAttached && (
                  <button
                    type="button"
                    className="nx-details-btn-remove-photo"
                    onClick={handleRemoveLicense}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Personal Info Fields */}
        <div className="nx-details-right-panel">
          {/* Username */}
          <div className="nx-details-field">
            <label className="nx-details-label">Username</label>
            <input
              type="text"
              name="username"
              className="nx-details-input"
              value={form.username}
              onChange={handleInputChange}
              placeholder="@username"
            />
          </div>

          {/* Name */}
          <div className="nx-details-field">
            <label className="nx-details-label">Name</label>
            <input
              type="text"
              name="name"
              className="nx-details-input"
              value={form.name}
              onChange={handleInputChange}
              placeholder="Full Name"
            />
          </div>

          {/* Phone */}
          <div className="nx-details-field">
            <label className="nx-details-label">Phone</label>
            <input
              type="tel"
              name="phone"
              className="nx-details-input"
              value={form.phone}
              onChange={handleInputChange}
              placeholder="+919876543210"
            />
          </div>

          {/* Email */}
          <div className="nx-details-field">
            <label className="nx-details-label">Email</label>
            <input
              type="email"
              name="email"
              className="nx-details-input"
              value={form.email}
              onChange={handleInputChange}
              placeholder="name@example.com"
            />
          </div>

          {/* Driving License Number */}
          <div className="nx-details-field">
            <label className="nx-details-label">Driving License Number</label>
            <input
              type="text"
              name="drivingLicense"
              className="nx-details-input"
              value={form.drivingLicense}
              onChange={handleInputChange}
              placeholder="e.g. DL7282627272"
            />
          </div>

          {/* Emergency Number */}
          <div className="nx-details-field">
            <label className="nx-details-label">Emergency Number</label>
            <input
              type="tel"
              name="emergencyNumber"
              className="nx-details-input"
              value={form.emergencyNumber}
              onChange={handleInputChange}
              placeholder="e.g. 9098959014"
            />
          </div>

          {/* Bottom Full Width Blue Button */}
          <div className="nx-details-submit-wrap">
            <button
              type="submit"
              className="nx-details-save-btn"
              disabled={isSaving}
            >
              {isSaving ? "Saving Details..." : "Save Details"}
            </button>
          </div>
        </div>
      </form>

      {/* Full Screen Image Lightbox Preview */}
      {showLicensePreview && (
        <div
          className="profile-modal-backdrop"
          onClick={() => setShowLicensePreview(false)}
        >
          <div
            className="profile-modal"
            style={{ maxWidth: "680px", background: "#0e1115", padding: "16px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-modal-header" style={{ marginBottom: 12 }}>
              <h3>Driving License Document</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setShowLicensePreview(false)}
              >
                &times;
              </button>
            </div>
            <img
              src={currentLicenseImage}
              alt="Driving License Full Preview"
              style={{
                width: "100%",
                maxHeight: "75vh",
                objectFit: "contain",
                borderRadius: "12px",
                display: "block",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
