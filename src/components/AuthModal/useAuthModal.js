import { useAuth } from "../../context/AuthContext";

/**
 * Legacy AuthProvider placeholder to avoid breaking App.js layout.
 * Delegates modal context management to FirebaseAuthProvider.
 */
export const AuthProvider = ({ children }) => {
  return children;
};

/**
 * useAuthModal hook delegates to the new Firebase AuthContext state.
 */
export const useAuthModal = () => {
  const { isAuthOpen, activeView, openLogin, closeAuth } = useAuth();

  return {
    isAuthOpen,
    activeView,
    openLogin,
    closeAuth,
  };
};
