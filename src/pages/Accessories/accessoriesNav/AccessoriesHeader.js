import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useAuthModal } from '../../../components/AuthModal/useAuthModal';

const navLinks = ["Rider Wear", "Tech & Gadget", "Performance", "Helmets", "Bike Accessories"];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px', flexShrink: 0 }}>
      <circle cx="11" cy="11" r="7" stroke="#000" strokeWidth="2" />
      <path d="M16.5 16.5L22 22" stroke="#000" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon({ color = "#000" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '22px', height: '22px' }}>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 10a4 4 0 0 1-8 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AccessoriesHeader({ showBack = false, search = "", onSearchChange }) {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { openLogin } = useAuthModal();

  return (
    <header className="ap-header">
      {showBack ? (
        <div onClick={() => navigate(-1)} style={{ width: '30px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: "pointer" }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left-icon lucide-arrow-left">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
        </div>
      ) : (
        <Link to="/accessories" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="ap-header__logo">
            NITRO<span>X</span><span className="ap-header__logo-suffix">X</span>
          </div>
        </Link>
      )}

      <div className="ap-header__divider" />

      {/* Nav links */}
      <nav className="ap-header__nav">
        {navLinks.map((link) => (
          <Link
            to={`/category/${encodeURIComponent(link)}`}
            key={link}
            className="ap-header__nav-link"
          >
            {link}
          </Link>
        ))}
      </nav>

      {/* Right side: search + cart + login + profile */}
      <div className="ap-header__right">
        {onSearchChange !== undefined && (
          <div className="ap-header__search">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search Accessories.."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
        <Link to="/cart" className="ap-header__icon-btn" aria-label="Cart">
          <CartIcon />
        </Link>
        
        <button
          type="button"
          className="ap-header__icon-btn"
          onClick={isAuthenticated ? logout : openLogin}
          style={{ width: 'auto', padding: '0 16px', fontSize: '14px', fontWeight: '600', color: '#000', textTransform: 'uppercase' }}
        >
          {isAuthenticated ? 'Log Out' : 'Log In'}
        </button>

        {isAuthenticated && (
          <Link to="/profile" className="ap-header__icon-btn" aria-label="Profile">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" color="#000" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-user-icon lucide-circle-user">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="10" r="3"/>
              <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/>
            </svg>
          </Link>
        )}
      </div>
    </header>
  );
}
