import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthModal } from "./AuthModal/useAuthModal";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const { openLogin } = useAuthModal();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) openLogin();
  }, [isAuthenticated, loading, openLogin]);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="profile-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
}
