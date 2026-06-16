import { NavLink, Outlet, useNavigate } from "react-router-dom";
import "./profile.css";

export default function Profile() {
  const navigate = useNavigate();

  return (
    <div className="profile-layout">

      <div className="profile-sidebar">

        <button
          className="profile-back-btn"
          onClick={() => navigate(-1)}
        >
          ←
        </button>

        <div className="profile-menu">

          <NavLink
            end
            to="/profile"
            className={({ isActive }) =>
              isActive
                ? "profile-link active"
                : "profile-link"
            }
          >
            Profile
          </NavLink>

          <NavLink
            to="/profile/events"
            className="profile-link"
          >
            My Events
          </NavLink>

          <NavLink
            to="/profile/wishlist"
            className="profile-link"
          >
            Wishlist
          </NavLink>

          <NavLink
            to="/profile/accessories"
            className="profile-link"
          >
            My Accessories
          </NavLink>

          <NavLink
            to="/profile/wallet"
            className="profile-link"
          >
            Wallet
          </NavLink>

          <NavLink
            to="/profile/support"
            className="profile-link"
          >
            Help & Support
          </NavLink>

          <button className="logout-btn">
            Log Out
          </button>

        </div>

      </div>

      <div className="profile-content">
        <Outlet />
      </div>

    </div>
  );
}