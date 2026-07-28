import { createContext, useCallback, useContext, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const AuthModalContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const openLogin = useCallback(() => {
    navigate("/login", { state: { from: location } });
  }, [navigate, location]);

  const openSignup = useCallback(() => {
    navigate("/signup", { state: { from: location } });
  }, [navigate, location]);

  const closeAuth = useCallback(() => {
    // If we need to close auth without logging in, we could navigate back.
    // However, it's safer to just let the user navigate manually or use browser back.
  }, []);

  const value = useMemo(
    () => ({
      isAuthOpen: false,
      activeView: "login",
      openLogin,
      openSignup,
      closeAuth,
    }),
    [openLogin, openSignup, closeAuth]
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);

  if (!context) {
    throw new Error("useAuthModal must be used within an AuthProvider");
  }

  return context;
};
