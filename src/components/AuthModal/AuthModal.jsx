import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { createPortal } from "react-dom";
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

const AuthModal = () => {
  const { isAuthOpen, activeView, openLogin, openSignup, closeAuth } =
    useAuthModal();
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);
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

  if (!isAuthOpen) {
    return null;
  }

  return createPortal(
    <div className="auth-modal-backdrop" onMouseDown={handleBackdropMouseDown}>
      <div
        className={`auth-modal-shell ${isSignup ? "is-signup" : "is-login"}`}
        role="dialog"
        aria-modal="true"
        aria-label={dialogTitle}
        ref={dialogRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
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
          <div className="auth-form-zone">
            <div className="auth-form-slide">
              <Suspense
                fallback={<div className="auth-form-loading">Loading...</div>}
              >
                {isSignup ? (
                  <SignupModal onSwitchToLogin={openLogin} />
                ) : (
                  <LoginModal onSwitchToSignup={openSignup} />
                )}
              </Suspense>
            </div>
          </div>

          <div className="auth-visual-zone">
            <AuthImagePanel />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AuthModal;
