import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useAuthModal } from '../../../components/AuthModal/useAuthModal';
import { useAccessoriesContext } from '../../../context/AccessoriesContext';
import SearchPopup from './SearchPopup';
import './AccessoriesHeader.css';

// ── Default fallback categories if database is loading or empty ──
const DEFAULT_NAV_CATEGORIES = [
  { id: 'rider-wear', label: 'Rider Wear' },
  { id: 'tech-gadget', label: 'Tech & Gadget' },
  { id: 'performance', label: 'Performance' },
  { id: 'helmets', label: 'Helmets' },
  { id: 'bike-accessories', label: 'Bike Accessories' },
];

// ── Comprehensive fallback catalog for subcategories ──
const FALLBACK_SUBCATEGORIES_MAP = {
  'rider wear': [
    { id: 'riding-jackets', name: 'Riding Jackets' },
    { id: 'riding-pants', name: 'Riding Pants' },
    { id: 'riding-boots', name: 'Riding Boots' },
    { id: 'armored-hoodies', name: 'Armored Hoodies' },
    { id: 'safety-vests', name: 'High-Vis & Safety Vests' },
    { id: 'rain-suits', name: 'Rain Suits & Thermals' },
    { id: 'base-layers', name: 'Base Layers & Balaclavas' },
  ],
  'helmets': [
    { id: 'full-face-helmets', name: 'Full Face Helmets' },
    { id: 'modular-helmets', name: 'Modular & Flip-Up' },
    { id: 'open-face-helmets', name: 'Open Face Helmets' },
    { id: 'off-road-helmets', name: 'Off-Road & MX Helmets' },
    { id: 'helmet-visors', name: 'Visors & Pinlocks' },
    { id: 'helmet-bluetooth', name: 'Helmet Bluetooth Intercoms' },
  ],
  'bike accessories': [
    { id: 'luggage-saddlebags', name: 'Luggage & Saddlebags' },
    { id: 'crash-protection', name: 'Crash Protection & Sliders' },
    { id: 'phone-mounts', name: 'Phone Mounts & Chargers' },
    { id: 'bike-covers', name: 'All-Weather Bike Covers' },
    { id: 'security-locks', name: 'Security & Anti-Theft Locks' },
    { id: 'handlebar-grips', name: 'Handlebar Grips & Levers' },
  ],
  'tech & gadget': [
    { id: 'bluetooth-intercoms', name: 'Bluetooth Intercoms' },
    { id: 'action-cameras', name: 'Action Cameras & Mounts' },
    { id: 'gps-navigators', name: 'GPS Navigators & Trackers' },
    { id: 'tpms', name: 'Tire Pressure Monitors (TPMS)' },
    { id: 'smart-lighting', name: 'Smart Lighting & HUD' },
  ],
  'performance': [
    { id: 'exhaust-systems', name: 'Exhaust Systems' },
    { id: 'air-filters', name: 'High-Flow Air Filters' },
    { id: 'brake-pads', name: 'Performance Brake Pads' },
    { id: 'suspension-shocks', name: 'Suspensions & Shocks' },
    { id: 'racing-chains', name: 'Chains & Sprockets' },
    { id: 'engine-oils', name: 'Engine Oils & Lubricants' },
  ],
  'footwear': [
    { id: 'casual-footwear', name: 'Casual Footwear' },
    { id: 'performance-footwear', name: 'Performance Footwear' },
    { id: 'indoor-footwear', name: 'Indoor Footwear' },
    { id: 'daily-footwear', name: 'Daily Footwear' },
    { id: 'sandals', name: 'Sandals' },
    { id: 'formal-footwear', name: 'Formal Footwear' },
    { id: 'boots', name: 'Boots' },
    { id: 'dance-footwear', name: 'Dance Footwear' },
    { id: 'traditional-footwear', name: 'Traditional Footwear' },
  ],
  'apparel': [
    { id: 'jackets-hoodies', name: 'Jackets & Hoodies' },
    { id: 't-shirts-tops', name: 'T-Shirts & Tops' },
    { id: 'pants-jeans', name: 'Pants & Jeans' },
    { id: 'riding-apparel', name: 'Riding Apparel' },
    { id: 'shorts', name: 'Shorts' },
    { id: 'rainwear-suits', name: 'Rainwear & Suits' },
  ],
  'accessories': [
    { id: 'bags-backpacks', name: 'Bags & Backpacks' },
    { id: 'gloves-mitts', name: 'Gloves & Mitts' },
    { id: 'hats-caps', name: 'Hats & Caps' },
    { id: 'eyewear-sunglasses', name: 'Eyewear & Sunglasses' },
    { id: 'belts-wallets', name: 'Belts & Wallets' },
    { id: 'keychains-badges', name: 'Keychains & Badges' },
  ],
};

function getMatchingFallbackSubcategories(catName = '') {
  const normalized = String(catName).toLowerCase().trim();
  for (const [key, subcats] of Object.entries(FALLBACK_SUBCATEGORIES_MAP)) {
    if (normalized === key || normalized.includes(key) || key.includes(normalized)) {
      return subcats;
    }
  }
  return [
    { id: `${normalized}-all`, name: `All ${catName}` },
    { id: `${normalized}-trending`, name: `Trending ${catName}` },
    { id: `${normalized}-featured`, name: `Featured ${catName}` },
  ];
}

function ChevronRightIcon({ className = '' }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="7" stroke="#000" strokeWidth="2" />
      <path d="M16.5 16.5L22 22" stroke="#000" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CartIcon({ color = '#000' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16 10a4 4 0 0 1-8 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AccessoriesHeader({ showBack = false, search = '', onSearchChange }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const accessoriesContext = useAccessoriesContext();

  const [activeHoveredCat, setActiveHoveredCat] = useState(null);
  const [localSearch, setLocalSearch] = useState(search);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const closeTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Determine active categories to show in the navigation bar
  const navCategories = useMemo(() => {
    if (accessoriesContext?.categories && accessoriesContext.categories.length > 0) {
      return accessoriesContext.categories.map((c) => ({
        id: c.id,
        label: c.label || c.title || c.name || 'Category',
        slug: c.slug || c.id,
      }));
    }
    return DEFAULT_NAV_CATEGORIES;
  }, [accessoriesContext?.categories]);

  // Resolver for sub-categories of any category
  const getSubcategoriesForCategory = useCallback(
    (cat) => {
      if (!cat) return [];
      const catId = String(cat.id || '').toLowerCase();
      const catLabel = String(cat.label || cat.name || cat.title || '').toLowerCase();

      // 1. Embedded subcategories
      const embedded = cat.subcategories || cat.subCats || cat.subCategories || [];
      if (Array.isArray(embedded) && embedded.length > 0) {
        return embedded.map((s, idx) => ({
          id: s.id || s.subcategoryId || `${s.name || s.label}-${idx}`,
          name: s.name || s.label || s.title || 'Sub-category',
        }));
      }

      // 2. From subcategories collection in AccessoriesContext
      const contextSubcats = accessoriesContext?.subcategories || [];
      const matchedFromCollection = contextSubcats.filter((s) => {
        const parentId = String(s.parentId || s.categoryId || '').toLowerCase();
        const parentLabel = String(s.category || s.categoryName || '').toLowerCase();
        return (
          parentId === catId ||
          parentId === catLabel ||
          parentLabel === catLabel ||
          parentLabel === `${catLabel}s` ||
          catLabel === `${parentLabel}s`
        );
      });
      if (matchedFromCollection.length > 0) {
        return matchedFromCollection.map((s) => ({
          id: s.id,
          name: s.label || s.title || s.name,
        }));
      }

      // 3. Fallback to product subcategories
      const contextProducts = accessoriesContext?.products || [];
      const matchedProducts = contextProducts.filter((p) => {
        const pCat = String(p.category || '').toLowerCase();
        return (
          pCat === catLabel ||
          pCat === `${catLabel}s` ||
          catLabel === `${pCat}s` ||
          pCat === catId
        );
      });
      const subcatNames = [
        ...new Set(matchedProducts.map((p) => p.subcategory || p.subCategory).filter(Boolean)),
      ];
      if (subcatNames.length > 0) {
        return subcatNames.map((name, idx) => ({
          id: `prod-subcat-${name}-${idx}`,
          name,
        }));
      }

      // 4. Fallback catalog matching categories
      return getMatchingFallbackSubcategories(cat.label || cat.name);
    },
    [accessoriesContext]
  );

  // Pre-compute subcategories for each nav category
  const navCategoriesWithSubcategories = useMemo(() => {
    return navCategories.map((cat) => ({
      ...cat,
      subcategories: getSubcategoriesForCategory(cat),
    }));
  }, [navCategories, getSubcategoriesForCategory]);

  // Hover handlers with debounce timer for smooth mouse movement
  const handleMouseEnterCategory = (catId) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setActiveHoveredCat(catId);
  };

  const handleMouseLeaveCategory = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setActiveHoveredCat(null);
    }, 180);
  };

  const cancelClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
  };

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveHoveredCat(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle clicking a subcategory -> redirects to /shop?subcategory=...
  const handleSubcategoryClick = (subcat) => {
    setActiveHoveredCat(null);
    const subcatName = subcat.name || subcat.label;
    navigate(`/shop?subcategory=${encodeURIComponent(subcatName)}`);
  };

  // Handle search submission on Enter -> redirects to /shop?search=...
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      const term = localSearch.trim();
      setIsSearchOpen(false);
      if (term) {
        navigate(`/shop?search=${encodeURIComponent(term)}`);
      } else {
        navigate('/shop');
      }
    }
  };

  const handleSearchIconClick = () => {
    const term = localSearch.trim();
    setIsSearchOpen(false);
    if (term) {
      navigate(`/shop?search=${encodeURIComponent(term)}`);
    } else {
      navigate('/shop');
    }
  };

  return (
    <header className={`ap-header${isSearchOpen ? ' has-search-open' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0px', flexShrink: 0 }}>
        {showBack && (
          <div
            onClick={() => navigate(-1)}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(40, 40, 40, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s ease',
            }}
            aria-label="Back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
          </div>
        )}
        <Link to="/accessories" className="ap-header__logo-link">
          <img
            src="/assets/images/logo-black.png"
            alt="Nitroxx"
            className="ap-header__logo-img"
          />
        </Link>
      </div>

      <div className="ap-header__divider" />

      {/* Nav with Per-Category Hover Dropdown */}
      <nav className="ap-header__nav" onMouseLeave={handleMouseLeaveCategory}>
        {navCategoriesWithSubcategories.map((cat) => {
          const isDropdownOpen = activeHoveredCat === cat.id;
          const subcategories = cat.subcategories || [];

          return (
            <div
              key={cat.id}
              className="ap-header__nav-item"
              onMouseEnter={() => handleMouseEnterCategory(cat.id)}
            >
              {/* Category Link: redirects to /shop?category=... */}
              <Link
                to={`/shop?category=${encodeURIComponent(cat.label)}`}
                className={`ap-header__nav-link ${isDropdownOpen ? 'is-active' : ''}`}
                onClick={() => setActiveHoveredCat(null)}
              >
                <span>{cat.label}</span>
                {subcategories.length > 0 && (
                  <svg
                    className={`ap-header__cat-chevron ${isDropdownOpen ? 'is-open' : ''}`}
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                )}
              </Link>

              {/* Invisible bridge so mouse hover never drops */}
              {isDropdownOpen && <div className="ap-header__dropdown-bridge" />}

              {/* Sub-categories Dropdown for THIS category only */}
              {isDropdownOpen && subcategories.length > 0 && (
                <div
                  className="ap-header__subcat-dropdown"
                  onMouseEnter={cancelClose}
                  onMouseLeave={handleMouseLeaveCategory}
                >
                  {subcategories.map((sub, idx) => (
                    <div
                      key={sub.id || idx}
                      className="ap-header__subcat-row"
                      onClick={() => handleSubcategoryClick(sub)}
                    >
                      <span className="ap-header__subcat-title">{sub.name}</span>
                      <ChevronRightIcon className="ap-header__subcat-arrow" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Right side: search + cart + login + profile (Logout button removed) */}
      <div className="ap-header__right">
        {/* Search bar: Click/type opens SearchPopup; clicking search icon redirects to /shop */}
        <div
          className="ap-header__search"
          ref={searchContainerRef}
          onClick={() => setIsSearchOpen(true)}
        >
          <span
            className="ap-header__search-icon-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleSearchIconClick();
            }}
            title="Search in Shop"
          >
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search Accessories.."
            value={localSearch}
            onFocus={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              if (!isSearchOpen) setIsSearchOpen(true);
              if (onSearchChange) onSearchChange(e.target.value);
            }}
            onKeyDown={handleSearchKeyDown}
          />
        </div>

        <Link to="/cart" className="ap-header__icon-btn" aria-label="Cart">
          <CartIcon />
        </Link>

        {/* Removed Logout button - only display Log In when unauthenticated */}
        {!isAuthenticated && (
          <button
            type="button"
            className="ap-header__icon-btn ap-header__login-btn"
            onClick={openLogin}
          >
            Log In
          </button>
        )}

        {/* Profile icon: clicking when authenticated opens profile; when not authenticated opens login */}
        <Link
          to="/profile"
          className="ap-header__icon-btn"
          aria-label="Profile"
          onClick={
            !isAuthenticated
              ? (e) => {
                  e.preventDefault();
                  openLogin();
                }
              : undefined
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            color="#000"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="10" r="3" />
            <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
          </svg>
        </Link>
      </div>

      {/* Search Popup Dropdown (Culture Circle Inspired) */}
      <SearchPopup
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={localSearch}
        onSearchChange={(val) => {
          setLocalSearch(val);
          if (onSearchChange) onSearchChange(val);
        }}
        inputRef={searchContainerRef}
        onSearchSubmit={(val) => {
          const term = (val !== undefined ? val : localSearch).trim();
          setIsSearchOpen(false);
          if (term) {
            navigate(`/shop?search=${encodeURIComponent(term)}`);
          } else {
            navigate('/shop');
          }
        }}
      />
    </header>
  );
}
