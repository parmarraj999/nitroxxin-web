import React from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import "./profile.css";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // On mobile, if path is exactly "/profile", we show the sidebar menu. If path is a subroute, we can show the content.
  const isRootProfile = location.pathname === "/profile" || location.pathname === "/profile/";

  const handleBack = () => {
    if (!isRootProfile) {
      navigate("/profile");
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out of Nitroxx?")) {
      try {
        await logout();
        navigate("/");
      } catch (err) {
        console.error("Failed to log out:", err);
      }
    }
  };

  const menuItems = [
    {
      to: "/profile/edit-details",
      label: "Edit Details",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      to: "/profile/my-bikes",
      label: "My Bikes",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="5.5" cy="17.5" r="3.5" />
          <circle cx="18.5" cy="17.5" r="3.5" />
          <path d="M15 6h-3l-3 6.5h7.5" />
          <path d="M19 17.5l-4-9-4 9" />
        </svg>
      ),
    },
    {
      to: "/profile/joined-events",
      label: "Joined Events",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="M9 16l2 2 4-4" />
        </svg>
      ),
    },
    {
      to: "/profile/my-orders",
      label: "My Orders",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      to: "/profile/my-tickets",
      label: "My Tickets",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="M12 12h.01" />
          <path d="M17 6v12" strokeDasharray="2 2" />
          <path d="M7 6v12" strokeDasharray="2 2" />
        </svg>
      ),
    },
    {
      to: "/profile/wishlist",
      label: "Wishlist",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ),
    },
    {
      to: "/profile/saved-addresses",
      label: "Saved Addresses",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
      ),
    },
    {
      to: "/profile/saved-events",
      label: "Saved Events",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      to: "/profile/payments",
      label: "Payments",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      to: "/profile/my-wallet",
      label: "My Wallet",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
          <path d="M16 3H4a2 2 0 0 0-2 2v2h18V5a2 2 0 0 0-2-2z" />
          <circle cx="16" cy="14" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      to: "/profile/throttle-list",
      label: "My Throttle List",
      isHighlighted: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#ff6b00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      ),
    },
    {
      to: "/profile/feedback",
      label: "Share Feedback",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <line x1="8" y1="9" x2="16" y2="9" />
          <line x1="8" y1="13" x2="14" y2="13" />
        </svg>
      ),
    },
  ];

  return (
    <div className={`nx-profile-layout${!isRootProfile ? " nx-profile-view-subpage" : ""}`}>
      {/* ── Left Sidebar (Settings & Activity) ── */}
      <aside className="nx-profile-sidebar">
        <div className="nx-profile-header">
          <button
            type="button"
            className="nx-profile-back-circle-btn"
            onClick={handleBack}
            aria-label="Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h2 className="nx-profile-header-title">Settings & Activity</h2>
        </div>

        <nav className="nx-profile-menu">
          {menuItems.map((item) => {
            const isEditDetails = item.to === "/profile/edit-details";
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nx-profile-menu-item${isActive || (isEditDetails && isRootProfile) ? " is-active" : ""}`
                }
              >
                <div className="nx-profile-item-left">
                  <span className={`nx-profile-item-icon${item.isHighlighted ? " is-fire" : ""}`}>
                    {item.icon}
                  </span>
                  <span className="nx-profile-item-text">{item.label}</span>
                </div>
                <span className="nx-profile-item-chevron">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </span>
              </NavLink>
            );
          })}

          {/* ── Logout Button at Bottom ── */}
          <div className="nx-profile-logout-wrap">
            <button
              type="button"
              className="nx-profile-logout-btn"
              onClick={handleLogout}
            >
              <div className="nx-profile-logout-left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </nav>
      </aside>

      {/* ── Right Content Area ── */}
      <main className="nx-profile-content">
        <div className="nx-profile-mobile-nav">
          <button
            type="button"
            className="nx-profile-back-circle-btn"
            onClick={handleBack}
            aria-label="Back to settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="nx-profile-mobile-nav-title">Settings & Activity</span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
