import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import "./ProfileOverview.css";

// Fallback Anime Avatar matching the exact illustration from the mockup
const DefaultAnimeAvatar = () => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="default-anime-svg"
  >
    <circle cx="50" cy="50" r="50" fill="#FFFDF9" />
    {/* Body / Shirt */}
    <path
      d="M20 90C20 75 33 71 50 71C67 71 80 75 80 90"
      stroke="#1E293B"
      strokeWidth="3.2"
      strokeLinecap="round"
      fill="#FFFFFF"
    />
    <path
      d="M37 71L43 83L50 84L57 83L63 71"
      stroke="#1E293B"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Neck */}
    <rect x="44" y="61" width="12" height="12" fill="#FEE5D8" />
    {/* Face */}
    <ellipse cx="50" cy="48" rx="21" ry="19" fill="#FEE5D8" />
    {/* Hair back */}
    <circle cx="50" cy="41" r="23" fill="#1E293B" />
    {/* Hair Bangs */}
    <path
      d="M26 44C26 27 35 20 50 20C65 20 74 27 74 44C69 35 61 36 55 38C49 40 41 35 34 40C29 42 27 44 26 44Z"
      fill="#1E293B"
    />
    <path
      d="M33 37C35 44 39 47 42 45C44 43 44 37 44 37"
      fill="#1E293B"
    />
    <path
      d="M53 37C56 45 62 46 65 43C66 41 66 36 66 36"
      fill="#1E293B"
    />
    {/* Eyes */}
    <circle cx="41.5" cy="48" r="2.8" fill="#1E293B" />
    <circle cx="58.5" cy="48" r="2.8" fill="#1E293B" />
    {/* Cute blush */}
    <circle cx="37" cy="53" r="3" fill="#FCA5A5" opacity="0.6" />
    <circle cx="63" cy="53" r="3" fill="#FCA5A5" opacity="0.6" />
    {/* Friendly Smile */}
    <path
      d="M47 55.5C48.2 57 51.8 57 53 55.5"
      stroke="#1E293B"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

export default function ProfileOverview() {
  const { user, profile, updateProfile, uploadProfilePhoto } = useAuth();
  const fileInputRef = useRef(null);

  const [editing, setEditing] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Profile Form state
  const [form, setForm] = useState({
    name: "",
    username: "",
    phone: "",
    email: "",
    drivingLicense: "",
    emergencyNumber: "",
  });

  // Sync state whenever profile/user updates
  useEffect(() => {
    setForm({
      name:
        profile?.name ||
        profile?.fullName ||
        profile?.displayName ||
        user?.displayName ||
        "",
      username: profile?.username
        ? profile.username.replace(/^@/, "")
        : user?.phoneNumber
        ? `rider_${user.phoneNumber.slice(-4)}`
        : "",
      phone: profile?.phone || profile?.phoneNumber || user?.phoneNumber || "",
      email: profile?.email || user?.email || "",
      drivingLicense: profile?.drivingLicense || "",
      emergencyNumber: profile?.emergencyNumber || "",
    });
  }, [profile, user]);

  // Handle image upload
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

  // Save profile updates to Firestore
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    try {
      const trimmedName = form.name.trim();
      const rawUsername = form.username.trim().replace(/^@/, "");
      const formattedUsername = rawUsername ? `@${rawUsername}` : "";
      const trimmedPhone = form.phone.trim();
      const trimmedEmail = form.email.trim();
      const trimmedLicense = form.drivingLicense.trim();
      const trimmedEmergency = form.emergencyNumber.trim();

      await updateProfile({
        name: trimmedName,
        fullName: trimmedName,
        displayName: trimmedName,
        username: formattedUsername,
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
      setTimeout(() => {
        setSaveSuccess(false);
        setEditing(false);
      }, 900);
    } catch (err) {
      console.error("Failed to save profile:", err);
      setErrorMessage(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Display values
  const displayName =
    profile?.name ||
    profile?.fullName ||
    profile?.displayName ||
    user?.displayName ||
    "Olivia Rhye";

  const rawUsername = profile?.username || (user?.phoneNumber ? `@rider_${user.phoneNumber.slice(-4)}` : "@Oliviar_");
  const displayUsername = rawUsername.startsWith("@") ? rawUsername : `@${rawUsername}`;

  const currentPhoto = profile?.profilePhoto || profile?.photoURL || user?.photoURL;
  const ratingValue = profile?.rating || "4.9";
  const postsCount = profile?.postsCount || profile?.ridesCount || "125";
  const followersCount = profile?.followers || "12.4K";

  return (
    <section className="profile-overview-wrapper">
      <article className="aurora-profile-card">
        {/* Hidden File Input for Avatar */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: "none" }}
          onChange={handlePhotoSelect}
        />

        {/* TOP: Aurora Mesh Gradient Banner */}
        <div className="aurora-banner">
          <div className="aurora-glow-1" />
          <div className="aurora-glow-2" />
          <div className="aurora-glow-3" />
        </div>

        {/* AVATAR: Overlaps bottom-left of the banner */}
        <div className="aurora-avatar-container">
          <div
            className="aurora-avatar-ring"
            onClick={() => fileInputRef.current?.click()}
            title="Click to change profile picture"
          >
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt={displayName}
                className="aurora-avatar-img"
              />
            ) : (
              <DefaultAnimeAvatar />
            )}

            {/* Camera Overlay Icon */}
            <div className="aurora-avatar-upload-overlay">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>

          {isUploadingPhoto && (
            <span className="uploading-badge">Uploading...</span>
          )}
        </div>

        {!editing ? (
          /* ================= VIEW MODE ================= */
          <div className="aurora-card-body">
            {/* Header: Name, Username & Action Buttons */}
            <div className="aurora-header-row">
              <div className="aurora-user-meta">
                <h2 className="aurora-name">{displayName}</h2>
                <p className="aurora-username">{displayUsername}</p>
              </div>

              <div className="aurora-actions-group">
                <button
                  type="button"
                  className="aurora-follow-btn"
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </button>

                <button
                  type="button"
                  className={`aurora-icon-btn ${isBookmarked ? "bookmarked" : ""}`}
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  aria-label="Bookmark Profile"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill={isBookmarked ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Additional Details (Driving License & Emergency Number) */}
            <div className="aurora-details-section">
              <div className="aurora-pill-badges-row">
                {profile?.drivingLicense ? (
                  <div className="aurora-badge license-badge" title="Verified Rider License">
                    <span className="badge-icon">🪪</span>
                    <span className="badge-label">DL:</span>
                    <span className="badge-text">{profile.drivingLicense}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="aurora-badge add-badge"
                    onClick={() => setEditing(true)}
                  >
                    <span className="badge-icon">🪪</span>
                    <span className="badge-text">+ Add Driving License</span>
                  </button>
                )}

                {profile?.emergencyNumber ? (
                  <div className="aurora-badge emergency-badge" title="Emergency Contact">
                    <span className="badge-icon">🚨</span>
                    <span className="badge-label">SOS:</span>
                    <span className="badge-text">{profile.emergencyNumber}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="aurora-badge add-badge"
                    onClick={() => setEditing(true)}
                  >
                    <span className="badge-icon">🚨</span>
                    <span className="badge-text">+ Add Emergency No.</span>
                  </button>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="aurora-divider" />

            {/* Stats Row */}
            <div className="aurora-stats-row">
              <div className="aurora-stat-col">
                <div className="aurora-stat-top">
                  <span className="stat-icon star">★</span>
                  <span className="stat-number">{ratingValue}</span>
                </div>
                <span className="aurora-stat-label">Rating</span>
              </div>

              <div className="aurora-stat-col">
                <div className="aurora-stat-top">
                  <span className="stat-icon doc">📄</span>
                  <span className="stat-number">{postsCount}</span>
                </div>
                <span className="aurora-stat-label">Posts</span>
              </div>

              <div className="aurora-stat-col">
                <div className="aurora-stat-top">
                  <span className="stat-icon user">👥</span>
                  <span className="stat-number">{followersCount}</span>
                </div>
                <span className="aurora-stat-label">Followers</span>
              </div>
            </div>

            {/* Bottom Pill Button: "Get in Touch" */}
            <button
              type="button"
              className="aurora-bottom-pill-btn"
              onClick={() => setShowContactModal(true)}
            >
              <div className="pill-circle-arrow">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
              <span className="pill-btn-text">Get in Touch</span>
            </button>
          </div>
        ) : (
          /* ================= EDIT MODE ================= */
          <div className="aurora-card-body edit-mode">
            <div className="edit-header-row">
              <h3 className="edit-title">Edit Profile</h3>
              <button
                type="button"
                className="edit-close-btn"
                onClick={() => {
                  setEditing(false);
                  setErrorMessage("");
                }}
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="aurora-alert-error">{errorMessage}</div>
            )}
            {saveSuccess && (
              <div className="aurora-alert-success">✓ Profile saved successfully!</div>
            )}

            <form className="aurora-edit-form" onSubmit={handleSave}>
              {/* Photo Upload Shortcut */}
              <div className="edit-photo-shortcut">
                <button
                  type="button"
                  className="change-photo-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                >
                  📷 {isUploadingPhoto ? "Uploading Photo..." : "Change Profile Photo"}
                </button>
              </div>

              {/* Full Name */}
              <div className="aurora-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Olivia Rhye"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              {/* Username */}
              <div className="aurora-form-group">
                <label>Username</label>
                <div className="input-with-prefix">
                  <span className="input-prefix">@</span>
                  <input
                    type="text"
                    placeholder="Oliviar_"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value.replace(/\s+/g, "") })
                    }
                  />
                </div>
              </div>

              {/* Driving License */}
              <div className="aurora-form-group">
                <label className="label-with-icon">
                  <span>🪪 Driving License</span>
                  <span className="field-tag">Rider ID</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. DL-0420110012345"
                  value={form.drivingLicense}
                  onChange={(e) =>
                    setForm({ ...form, drivingLicense: e.target.value.toUpperCase() })
                  }
                />
                <span className="field-hint">
                  Used to verify your license for rides and rentals.
                </span>
              </div>

              {/* Emergency Contact Number */}
              <div className="aurora-form-group">
                <label className="label-with-icon">
                  <span>🚨 Emergency Contact Number</span>
                  <span className="field-tag emergency">SOS</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={form.emergencyNumber}
                  onChange={(e) =>
                    setForm({ ...form, emergencyNumber: e.target.value })
                  }
                />
                <span className="field-hint">
                  Primary contact notified in case of on-road emergency.
                </span>
              </div>

              {/* Phone */}
              <div className="aurora-form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="aurora-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="olivia@nitroxxin.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div className="edit-actions-row">
                <button
                  type="button"
                  className="aurora-cancel-btn"
                  onClick={() => {
                    setEditing(false);
                    setErrorMessage("");
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="aurora-save-btn"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}
      </article>

      {/* "GET IN TOUCH" QUICK MODAL */}
      {showContactModal && (
        <div
          className="aurora-modal-backdrop"
          onClick={() => setShowContactModal(false)}
        >
          <div
            className="aurora-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-top">
              <h3 className="modal-title">Get in Touch</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowContactModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="modal-subtitle">
              Contact and verified documents for <strong>{displayName}</strong>
            </p>

            <div className="contact-list">
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <div className="contact-text">
                  <span className="contact-label">Phone</span>
                  <span className="contact-val">
                    {profile?.phone || user?.phoneNumber || "Not provided"}
                  </span>
                </div>
                {(profile?.phone || user?.phoneNumber) && (
                  <a
                    href={`tel:${profile?.phone || user?.phoneNumber}`}
                    className="contact-action-btn"
                  >
                    Call
                  </a>
                )}
              </div>

              <div className="contact-item">
                <span className="contact-icon">✉️</span>
                <div className="contact-text">
                  <span className="contact-label">Email</span>
                  <span className="contact-val">
                    {profile?.email || user?.email || "Not provided"}
                  </span>
                </div>
                {(profile?.email || user?.email) && (
                  <a
                    href={`mailto:${profile?.email || user?.email}`}
                    className="contact-action-btn"
                  >
                    Email
                  </a>
                )}
              </div>

              <div className="contact-item highlight">
                <span className="contact-icon">🚨</span>
                <div className="contact-text">
                  <span className="contact-label">Emergency SOS</span>
                  <span className="contact-val">
                    {profile?.emergencyNumber || "No Emergency Contact Added"}
                  </span>
                </div>
                {profile?.emergencyNumber ? (
                  <a
                    href={`tel:${profile.emergencyNumber}`}
                    className="contact-action-btn sos"
                  >
                    SOS Call
                  </a>
                ) : (
                  <button
                    type="button"
                    className="contact-action-btn add"
                    onClick={() => {
                      setShowContactModal(false);
                      setEditing(true);
                    }}
                  >
                    Add
                  </button>
                )}
              </div>

              <div className="contact-item">
                <span className="contact-icon">🪪</span>
                <div className="contact-text">
                  <span className="contact-label">Driving License</span>
                  <span className="contact-val">
                    {profile?.drivingLicense || "No License Attached"}
                  </span>
                </div>
                {!profile?.drivingLicense && (
                  <button
                    type="button"
                    className="contact-action-btn add"
                    onClick={() => {
                      setShowContactModal(false);
                      setEditing(true);
                    }}
                  >
                    Add
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              className="modal-edit-shortcut-btn"
              onClick={() => {
                setShowContactModal(false);
                setEditing(true);
              }}
            >
              Edit All Details
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
