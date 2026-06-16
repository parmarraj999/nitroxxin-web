import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const AuthModalContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeView, setActiveView] = useState("login");

  const openLogin = useCallback(() => {
    setActiveView("login");
    setIsAuthOpen(true);
  }, []);

  const openSignup = useCallback(() => {
    setActiveView("signup");
    setIsAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setIsAuthOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isAuthOpen,
      activeView,
      openLogin,
      openSignup,
      closeAuth,
    }),
    [activeView, closeAuth, isAuthOpen, openLogin, openSignup]
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
