import { memo } from "react";
import { FaHome } from "react-icons/fa";

const AuthImagePanel = () => (
  <div className="auth-visual-card" aria-hidden="true">
    <img
      src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80"
      alt=""
      className="auth-visual-image"
    />
    <span className="auth-path-line auth-path-line-1" />
    <span className="auth-path-line auth-path-line-2" />
    <span className="auth-path-dot auth-path-dot-1" />
    <span className="auth-path-dot auth-path-dot-2" />

    <div className="auth-floating-card auth-location-card">
      <span className="auth-card-icon">
        <FaHome />
      </span>
      <div>
        <p className="auth-card-title">Garsia Village</p>
        <p className="auth-card-subtitle">Villa Mexico</p>
      </div>
    </div>

    <div className="auth-floating-card auth-distance-card">
      <p className="auth-card-title">1.2 km</p>
      <p className="auth-card-subtitle">left to your accommodation</p>
    </div>

    <div className="auth-floating-card auth-trail-card">
      <p className="auth-card-title">Gringo Trail</p>
    </div>
  </div>
);

export default memo(AuthImagePanel);
