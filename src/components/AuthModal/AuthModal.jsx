import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import AuthImagePanel from "./AuthImagePanel";
import { useAuthModal } from "./useAuthModal";
import "./AuthModal.css";

const LoginModal = lazy(() => import("./LoginModal"));
const SignupModal = lazy(() => import("./SignupModal"));

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const panelTransition = {
  duration: 0.68,
  ease: [0.22, 1, 0.36, 1],
};

const getSlideState = (isActive, direction) => ({
  x: isActive ? 0 : direction,
  opacity: isActive ? 1 : 0,
  pointerEvents: isActive ? "auto" : "none",
});

const AuthModal = () => {
  const { isAuthOpen, activeView, openLogin, openSignup, closeAuth } =
    useAuthModal();
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [isStackedLayout, setIsStackedLayout] = useState(false);
  const isSignup = activeView === "signup";

  const dialogTitle = isSignup ? "Create an account" : "Log in to your account";

  const handleBackdropMouseDown = useCallback(
    (event) => {
      if (event.target === event.currentTarget) {
        closeAuth();
      }
    },
    [closeAuth]
  );

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        closeAuth();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll(focusableSelector)
      ).filter((element) => {
        const style = window.getComputedStyle(element);
        return (
          element.offsetParent !== null &&
          !element.closest("[aria-hidden='true']") &&
          style.visibility !== "hidden" &&
          style.display !== "none"
        );
      });

      if (!focusableElements.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [closeAuth]
  );

  useEffect(() => {
    if (!isAuthOpen) {
      return undefined;
    }

    previousFocusRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const frameId = window.requestAnimationFrame(() => {
      const firstFocusable = dialogRef.current?.querySelector(focusableSelector);
      firstFocusable?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      document.body.style.overflow = originalOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [isAuthOpen]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 900px)");
    const handleMediaChange = () => setIsStackedLayout(mediaQuery.matches);

    handleMediaChange();
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const loginSlideState = isStackedLayout
    ? { y: !isSignup ? 0 : "-18%", x: 0, opacity: !isSignup ? 1 : 0 }
    : getSlideState(!isSignup, "28%");
  const signupSlideState = isStackedLayout
    ? { y: isSignup ? 0 : "18%", x: 0, opacity: isSignup ? 1 : 0 }
    : getSlideState(isSignup, "-28%");
  const visualSlideState = {
    x: !isStackedLayout && isSignup ? "calc(100% + 16px)" : 0,
    y: 0,
  };

  return createPortal(
    <AnimatePresence>
      {isAuthOpen && (
      <motion.div
        className="auth-modal-backdrop"
        onMouseDown={handleBackdropMouseDown}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <motion.div
          className={`auth-modal-shell ${isSignup ? "is-signup" : "is-login"}`}
          role="dialog"
          aria-modal="true"
          aria-label={dialogTitle}
          ref={dialogRef}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            type="button"
            className="auth-close-btn"
            onClick={closeAuth}
            aria-label="Close authentication modal"
          >
            <FaTimes />
          </button>

          <div className="auth-panel-grid">
            <div
              className="auth-form-zone auth-form-zone-login"
              aria-hidden={isSignup}
              inert={isSignup ? "" : undefined}
            >
              <motion.div
                className="auth-form-slide"
                layout
                animate={{
                  ...loginSlideState,
                  pointerEvents: !isSignup ? "auto" : "none",
                }}
                transition={panelTransition}
              >
                <Suspense fallback={<div className="auth-form-loading">Loading...</div>}>
                  <LoginModal onSwitchToSignup={openSignup} />
                </Suspense>
              </motion.div>
            </div>

            <div
              className="auth-form-zone auth-form-zone-signup"
              aria-hidden={!isSignup}
              inert={!isSignup ? "" : undefined}
            >
              <motion.div
                className="auth-form-slide"
                layout
                animate={{
                  ...signupSlideState,
                  pointerEvents: isSignup ? "auto" : "none",
                }}
                transition={panelTransition}
              >
                <Suspense fallback={<div className="auth-form-loading">Loading...</div>}>
                  <SignupModal onSwitchToLogin={openLogin} />
                </Suspense>
              </motion.div>
            </div>

            <motion.div
              className="auth-visual-zone"
              layout
              animate={visualSlideState}
              transition={panelTransition}
            >
              <AuthImagePanel />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default AuthModal;
