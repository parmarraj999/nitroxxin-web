import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import "./ProfileReminder.css";

const DISMISS_KEY = "nitroxx_profile_reminder_dismissed_until";

export default function ProfileReminder() {
  const { user, profile, openLogin, setActiveView, setIsAuthOpen } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isVisible, setIsVisible] = useState(false);

  // Check if current page is one where the reminder should NEVER appear
  const isProfilePage = location.pathname.startsWith("/profile");
  const isBookingPage = location.pathname.includes("/book");
  const isCheckoutPage = location.pathname === "/cart" || location.pathname.includes("/cart");

  // Determine if BottomNav is present on this page
  const isSearchPage = location.pathname.includes("/search");
  const isComboPage = location.pathname.includes("/combo/");
  const isPrivacyPage = location.pathname.includes("/privacy");
  const isOrganizerPage = location.pathname.includes("/organizer");
  const isEventDetailPage =
    (location.pathname.startsWith("/events/") || location.pathname.startsWith("/event/")) &&
    !["/events/all", "/events/near-you", "/events/near-me", "/events/upcoming", "/events/search"].some((p) =>
      location.pathname.startsWith(p)
    );

  const hasBottomNav =
    !isBookingPage &&
    !isProfilePage &&
    !isSearchPage &&
    !isComboPage &&
    !isPrivacyPage &&
    !isOrganizerPage &&
    !isEventDetailPage;

  // Determine if profile is already complete
  const isProfileComplete = Boolean(
    profile?.isProfileComplete ||
    (user &&
      (profile?.email || user?.email) &&
      (profile?.fullName || profile?.name || profile?.displayName || user?.fullName || user?.displayName) &&
      profile?.username)
  );

  useEffect(() => {
    // If on profile/booking/checkout pages or profile already complete, don't show
    if (isProfilePage || isBookingPage || isCheckoutPage || isProfileComplete) {
      setIsVisible(false);
      return;
    }

    // Check dismissal state in localStorage
    try {
      const dismissedUntil = localStorage.getItem(DISMISS_KEY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        setIsVisible(false);
        return;
      }
    } catch (_) {}

    // Delay appearance slightly for smooth entrance
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1200);

    return () => clearTimeout(timer);
  }, [isProfilePage, isBookingPage, isCheckoutPage, isProfileComplete]);

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsVisible(false);
    try {
      // Dismiss for 24 hours
      localStorage.setItem(DISMISS_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    } catch (_) {}
  };

  const handleAdd = () => {
    if (!user) {
      openLogin();
    } else if (!profile?.username) {
      // Open initial profile setup modal
      setActiveView("profileSetup");
      setIsAuthOpen(true);
    } else {
      // Navigate to profile edit details
      navigate("/profile/edit-details");
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`profile-reminder-pill ${hasBottomNav ? "profile-reminder-pill--above-nav" : ""}`}
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
          role="dialog"
          aria-label="Complete your profile reminder"
        >
          {/* Avatar icon matching the uploaded image */}
          <div className="profile-reminder__avatar" aria-hidden="true" onClick={handleAdd}>
            <svg
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="8" r="4.2" fill="#586274" />
              <path
                d="M4.5 20C4.5 16.134 7.85786 13.5 12 13.5C16.1421 13.5 19.5 16.134 19.5 20"
                fill="#586274"
              />
            </svg>
          </div>

          {/* Texts */}
          <div className="profile-reminder__content" onClick={handleAdd}>
            <span className="profile-reminder__title">Complete your profile</span>
            <span className="profile-reminder__subtitle">Add your email and other details...</span>
          </div>

          {/* Action buttons matching the uploaded image */}
          <div className="profile-reminder__actions">
            <button
              type="button"
              className="profile-reminder__add-btn"
              onClick={handleAdd}
              aria-label="Add details"
            >
              Add
            </button>
            <button
              type="button"
              className="profile-reminder__close-btn"
              onClick={handleDismiss}
              aria-label="Dismiss reminder"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
