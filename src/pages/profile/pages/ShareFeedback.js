import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db, serverTimestamp } from "../../../services/firebase";

export default function ShareFeedback() {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState("App Experience");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      alert("Please share your thoughts before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      await db().collection("feedback").add({
        userId: user?.uid || "anonymous",
        userEmail: user?.email || "anonymous",
        userName: user?.displayName || "Rider",
        rating,
        category,
        message: message.trim(),
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setMessage("");
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      alert("Could not submit feedback. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-page-header">
        <div>
          <h1 className="profile-page-title">Share Feedback</h1>
          <p className="profile-page-subtitle">
            Help us build the ultimate motorcycling platform. Your ideas and suggestions shape Nitroxx.
          </p>
        </div>
      </div>

      {submitted ? (
        <div className="profile-empty-state">
          <div className="profile-empty-icon" style={{ color: "var(--green, #50d735)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3>Thank you for your feedback!</h3>
          <p>We read every single suggestion and review from our riding community.</p>
          <button
            type="button"
            className="profile-btn-primary"
            onClick={() => setSubmitted(false)}
          >
            Send Another Note
          </button>
        </div>
      ) : (
        <div className="profile-feedback-card">
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-feedback-rating-wrap">
              <label>How would you rate your Nitroxx experience?</label>
              <div className="profile-feedback-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="profile-feedback-star-btn"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    aria-label={`${star} star`}
                  >
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill={(hoverRating || rating) >= star ? "#ffb703" : "none"}
                      stroke={(hoverRating || rating) >= star ? "#ffb703" : "rgba(255, 255, 255, 0.2)"}
                      strokeWidth="2"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div className="profile-form-group">
              <label>Feedback Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="App Experience">App Experience & UI</option>
                <option value="Events & Rallies">Events & Rallies</option>
                <option value="Store & Gear">Store & Accessories</option>
                <option value="Payments & Wallet">Payments & Wallet</option>
                <option value="Feature Request">New Feature Request</option>
                <option value="Bug Report">Report an Issue / Bug</option>
              </select>
            </div>

            <div className="profile-form-group">
              <label>Your Message / Suggestions *</label>
              <textarea
                rows="5"
                placeholder="Tell us what you liked or how we can make your rides better..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <div className="profile-modal-actions" style={{ justifyContent: "flex-start", marginTop: 12 }}>
              <button
                type="submit"
                className="profile-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Submit Feedback"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
