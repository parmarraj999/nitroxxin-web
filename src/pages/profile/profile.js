import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const linkClass = ({ isActive }) =>
    isActive ? "profile-link active" : "profile-link";

  return (
    <div className="profile-layout">
      <div className="profile-sidebar">
        <button className="profile-back-btn" onClick={() => navigate("/")}>
          &larr;
        </button>

        <div className="profile-menu">
          <NavLink end to="/profile" className={linkClass}>
            Profile
          </NavLink>

          <NavLink to="/profile/events" className={linkClass}>
            My Events
          </NavLink>

          <NavLink to="/profile/wishlist" className={linkClass}>
            Wishlist
          </NavLink>

          <NavLink to="/profile/accessories" className={linkClass}>
            My Accessories
          </NavLink>

          <NavLink to="/profile/wallet" className={linkClass}>
            Wallet
          </NavLink>

          <NavLink to="/profile/support" className={linkClass}>
            Help & Support
          </NavLink>

          <button className="logout-btn">Log Out</button>
        </div>
      </div>

      <div className="profile-content">
        <Outlet />
      </div>
    </div>
  );
}
