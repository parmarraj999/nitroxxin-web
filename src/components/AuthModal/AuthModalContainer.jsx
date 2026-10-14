import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import LoginModal from "./LoginModal";
import OTPModal from "./OTPModal";
import ProfileSetupModal from "./ProfileSetupModal";
import "./AuthModalContainer.css";

export default function AuthModalContainer() {
  const { isAuthOpen, activeView, closeAuth, openLogin } = useAuth();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isAuthOpen) {
        closeAuth();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthOpen, closeAuth]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isAuthOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAuthOpen]);

  return (
    <AnimatePresence>
      {isAuthOpen && (
        <motion.div
          className="auth-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuth}
        >
          <motion.div
            className="auth-modal-card"
            initial={{ scale: 0.95, y: 25, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 25, opacity: 0 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Scenic Banner Section with voxel nature artwork */}
            <div className="auth-modal-banner">
              <img
                src="/assets/images/auth-header-banner.jpg"
                alt="Nitroxx Authentication"
                className="auth-modal-banner-img"
              />
              <div className="auth-modal-banner-gradient" />

              {/* Back button (on OTP view) */}
              {activeView === "otp" && (
                <button
                  type="button"
                  className="auth-modal-nav-btn auth-modal-back-btn"
                  onClick={openLogin}
                  aria-label="Back to login"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                className="auth-modal-nav-btn auth-modal-close-btn"
                onClick={closeAuth}
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {/* Title overlaying banner bottom matching screenshot */}
              <div className="auth-modal-banner-text">
                <h1 className="auth-modal-main-title">
                  {activeView === "login" ? "Welcome back" : activeView === "otp" ? "Verify Code" : "Setup Profile"}
                </h1>
              </div>
            </div>

            {/* Bottom Form Body */}
            <div className="auth-modal-body">
              <div className="auth-modal-view-wrapper">
                {activeView === "login" && <LoginModal />}
                {activeView === "otp" && <OTPModal />}
                {activeView === "profileSetup" && <ProfileSetupModal />}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
