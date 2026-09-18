import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import LoginModal from "./LoginModal";
import OTPModal from "./OTPModal";
import ProfileSetupModal from "./ProfileSetupModal";
import "./AuthModalContainer.css";

export default function AuthModalContainer() {
  const { isAuthOpen, activeView, closeAuth } = useAuth();

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
            initial={{ scale: 0.95, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 30, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button className="auth-modal-close-btn" onClick={closeAuth} aria-label="Close modal">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Top Half: Neon Gradient Banner with Space for Image */}
            <div className="auth-modal-banner">
              {/* IMAGE SPACE: Customize this block to insert your logo/image */}
              <div className="auth-modal-image-space">
                <div className="auth-modal-image-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    <circle cx="9" cy="9" r="2"/>
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                  <span>IMAGE SPACE</span>
                </div>
              </div>

              <div className="auth-modal-banner-info">
                <h2 className="auth-modal-brand-title">
                  NITRO<span className="neon-red-text">X</span>XIN
                </h2>
                {/* <p className="auth-modal-brand-subtitle">Ride. Meet. Trade. Explore.</p> */}
              </div>
            </div>

            {/* Bottom Half: Form Screen Views */}
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
