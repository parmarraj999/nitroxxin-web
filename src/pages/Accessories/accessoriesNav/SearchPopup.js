import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAccessoriesContext } from "../../../context/AccessoriesContext";
import { useAuth } from "../../../context/AuthContext";
import { useAuthModal } from "../../../components/AuthModal/useAuthModal";
import { addToCart } from "../../../services/commerceService";
import "./SearchPopup.css";

// Popular searches from Culture Circle & top trending searches
const POPULAR_SEARCHES = [
  "Seiko Watches",
  "Nike Mind 001",
  "Adidas CTT Chinese Jackets",
  "miu miu sunglasses",
  "YSL Perfumes",
  "Casio Youth Watches",
  "Rynox Stealth Air Jacket",
  "Full Face Helmets",
  "Akrapovič Exhaust",
];

// Fallback products matching Culture Circle style
const FALLBACK_POPUP_PRODUCTS = [
  {
    id: "pop-prod-1",
    name: "Air Force 1 Low 07 Triple White",
    brand: "Nike",
    category: "Rider Wear",
    price: 6499,
    offerPrice: 5625,
    emiText: "₹625/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-2",
    name: "Nike Air Jordan 1 Low Aura White & Sky Blue",
    brand: "Nike",
    category: "Rider Wear",
    price: 8999,
    offerPrice: 7700,
    emiText: "₹856/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-3",
    name: "Nike Dunk Low Panda Classic Edition",
    brand: "Nike",
    category: "Rider Wear",
    price: 7999,
    offerPrice: 6999,
    emiText: "₹778/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-4",
    name: "Nike Air Force 1 '07 White Midnight Navy",
    brand: "Nike",
    category: "Rider Wear",
    price: 7999,
    offerPrice: 6999,
    emiText: "₹778/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-5",
    name: "Nike Mind 001 Slide Solar Red",
    brand: "Nike",
    category: "Accessories",
    price: 13999,
    offerPrice: 12425,
    emiText: "₹1,381/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-6",
    name: "Dunk Low Vintage Green Sail Gum",
    brand: "Nike",
    category: "Rider Wear",
    price: 7499,
    offerPrice: 6499,
    emiText: "₹722/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1579338559194-a162d19bf842?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-7",
    name: "Killshot 2 Leather Navy & Sail Gum Sole",
    brand: "Nike",
    category: "Rider Wear",
    price: 6999,
    offerPrice: 5999,
    emiText: "₹666/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-8",
    name: "Air Force 1 Low Triple Black Edition",
    brand: "Nike",
    category: "Rider Wear",
    price: 7999,
    offerPrice: 6999,
    emiText: "₹778/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-9",
    name: "Supertech R10 Carbon Aerodynamic Helmet",
    brand: "Alpinestars",
    category: "Helmets",
    price: 64999,
    offerPrice: 58499,
    emiText: "₹6,499/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-10",
    name: "Stealth Air Pro Mesh CE-Level 2 Riding Jacket",
    brand: "Rynox",
    category: "Rider Wear",
    price: 11500,
    offerPrice: 9775,
    emiText: "₹1,086/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-11",
    name: "Titanium Slip-On Performance Exhaust",
    brand: "Akrapovič",
    category: "Performance",
    price: 48999,
    offerPrice: 42999,
    emiText: "₹4,777/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-12",
    name: "Osmo Action 4 Biker Adventure Kit",
    brand: "DJI",
    category: "Tech & Gadget",
    price: 34990,
    offerPrice: 29990,
    emiText: "₹3,332/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-13",
    name: "Condor 2.0 Heavy Duty Saddlebags (64L)",
    brand: "ViaTerra",
    category: "Bike Accessories",
    price: 7499,
    offerPrice: 6699,
    emiText: "₹744/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-14",
    name: "Sena 50S Mesh 2.0 Dual Intercom Unit",
    brand: "Sena",
    category: "Tech & Gadget",
    price: 32500,
    offerPrice: 28900,
    emiText: "₹3,211/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-15",
    name: "Engine Guard & High Impact Frame Sliders",
    brand: "Zana",
    category: "Protection",
    price: 5499,
    offerPrice: 4799,
    emiText: "₹533/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-16",
    name: "Orsa Leather Waterproof Armored Gloves",
    brand: "Knox",
    category: "Rider Wear",
    price: 8999,
    offerPrice: 7999,
    emiText: "₹888/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-17",
    name: "Typhoon Full Face ECE 22.06 Matte Helmet",
    brand: "SMK",
    category: "Helmets",
    price: 4999,
    offerPrice: 4250,
    emiText: "₹472/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-18",
    name: "Sintered Performance Front Brake Pads",
    brand: "Brembo",
    category: "Performance",
    price: 3899,
    offerPrice: 3299,
    emiText: "₹366/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-19",
    name: "Magnetic Quick-Release Biker Tank Bag (18L)",
    brand: "Dirtsack",
    category: "Bike Accessories",
    price: 4299,
    offerPrice: 3699,
    emiText: "₹411/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
  {
    id: "pop-prod-20",
    name: "Touring Low Comfort Gel Seat",
    brand: "Royal Enfield",
    category: "Bike Accessories",
    price: 3699,
    offerPrice: 3199,
    emiText: "₹355/month",
    badge: "XPRESS",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=80",
    dotsCount: 4,
  },
];



export default function SearchPopup({
  isOpen,
  onClose,
  searchQuery = "",
  onSearchChange,
  inputRef,
  onSearchSubmit,
}) {
  const navigate = useNavigate();
  const { products = [] } = useAccessoriesContext();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  const [wishlist, setWishlist] = useState({});
  const [addedItems, setAddedItems] = useState({});
  const popupRef = useRef(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        inputRef?.current &&
        !inputRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, inputRef]);

  // Recent searches state persisted to localStorage
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored = localStorage.getItem("nitroxx_recent_popup_searches");
      return stored ? JSON.parse(stored) : ["Nike Shoes Women", "Nike"];
    } catch {
      return ["Nike Shoes Women", "Nike"];
    }
  });


  // Function to save a search term to recent searches
  const saveRecentSearch = (text) => {
    if (!text || !text.trim()) return;
    const clean = text.trim();
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((k) => k.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem("nitroxx_recent_popup_searches", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Auto-save user's typed search query to recent searches after typing pause
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) return;

    const timer = setTimeout(() => {
      saveRecentSearch(trimmed);
    }, 800);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const removeRecentSearch = (e, textToRemove) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((k) => k.toLowerCase() !== textToRemove.toLowerCase());
      try {
        localStorage.setItem("nitroxx_recent_popup_searches", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllRecentSearches = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem("nitroxx_recent_popup_searches");
    } catch {}
  };

  // Convert real live products from context
  const normalizedProducts = useMemo(() => {
    const live = products.filter((p) =>
      ["published", "active", "approved"].includes(p.status || "published")
    );

    const mapped = live.map((p) => {
      const name = p.name || p.title || "Accessory Product";
      const brand = p.brand || p.brandName || "Nitroxx";
      const price = Number(p.regularPrice || p.price || 0);
      const offerPrice = Number(p.offerPrice || p.salePrice || p.price || 0);
      const emi = offerPrice ? `₹${Math.round(offerPrice / 9)}/month` : "";

      return {
        id: p.id,
        name,
        brand,
        category: p.category || "Accessories",
        price,
        offerPrice: offerPrice || price,
        emiText: emi,
        badge: "XPRESS",
        image: p.image || p.imageUrl || p.images?.[0] || FALLBACK_POPUP_PRODUCTS[0].image,
        dotsCount: 4,
        isLive: true,
      };
    });

    const liveIds = new Set(mapped.map((p) => p.id));
    const fallbackFiltered = FALLBACK_POPUP_PRODUCTS.filter((f) => !liveIds.has(f.id));
    return [...mapped, ...fallbackFiltered];
  }, [products]);

  // Filter products based on search query, strictly limited to 20 products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = normalizedProducts;

    if (q) {
      const words = q.split(/\s+/).filter(Boolean);
      list = list.filter((p) => {
        const text = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
        return words.every((w) => text.includes(w));
      });
    }

    return list.slice(0, 20);
  }, [normalizedProducts, searchQuery]);

  // Navigate to shop on search icon or view more click
  const handleGoToShop = (queryToUse) => {
    const term = (queryToUse !== undefined ? queryToUse : searchQuery).trim();
    if (term) {
      saveRecentSearch(term);
    }
    if (onSearchSubmit) {
      onSearchSubmit(term);
    } else {
      if (term) {
        navigate(`/shop?search=${encodeURIComponent(term)}`);
      } else {
        navigate("/shop");
      }
      onClose();
    }
  };

  const handleSelectProduct = (product) => {
    saveRecentSearch(product.brand || product.name);
    navigate(`/product/${product.id}`);
    onClose();
  };

  const handleQuickAdd = async (e, product) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal();
      return;
    }
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    try {
      await addToCart({
        userId: user.uid,
        product,
        quantity: 1,
      });
      setTimeout(() => {
        setAddedItems((prev) => ({ ...prev, [product.id]: false }));
      }, 1800);
    } catch {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }
  };

  const toggleWishlist = (e, productId) => {
    e.stopPropagation();
    setWishlist((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  const formatPrice = (val) => {
    if (!val) return "₹0";
    return `₹${Number(val).toLocaleString("en-IN")}`;
  };

  if (!isOpen) return null;

  const hasQuery = Boolean(searchQuery && searchQuery.trim());

  return (
    <>
      {/* Backdrop covers ONLY below the 84px header so the search bar is never blurred */}
      <div className="sp-backdrop" onClick={onClose} aria-hidden="true" />

      {/* Main Popup Modal - exactly 80vw width and 80vh height */}
      <div
        className={`sp-popup-container ${hasQuery ? "has-query" : "is-empty-query"}`}
        ref={popupRef}
      >
        {/* Mobile Top Header (Screenshots 2 & 3) */}
        <div className="sp-mobile-topbar">
          <button
            type="button"
            className="sp-mobile-back-btn"
            onClick={onClose}
            aria-label="Close search"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </button>

          <div className="sp-mobile-input-wrap">
            <span
              className="sp-mobile-search-icon"
              onClick={() => handleGoToShop(searchQuery)}
              title="Search in Shop"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.34-4.34" />
              </svg>
            </span>
            <input
              type="text"
              className="sp-mobile-search-input"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGoToShop(searchQuery);
              }}
              placeholder="Search"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="sp-mobile-clear-btn"
                onClick={() => onSearchChange("")}
                aria-label="Clear"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Desktop & Mobile Responsive Body */}
        <div className="sp-body">
          {/* ═══ LEFT COLUMN: RECENT & POPULAR SEARCHES ═══ */}
          <div className="sp-left-col">
            {/* 1. RECENT SEARCHES */}
            <div className="sp-section">
              <div className="sp-section__header sp-section__header--flex">
                <span className="sp-section__title">RECENT SEARCHES</span>
                {recentSearches.length > 0 && (
                  <button
                    type="button"
                    className="sp-clear-all-link"
                    onClick={clearAllRecentSearches}
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="sp-recent-chips">
                {recentSearches.map((chip, idx) => (
                  <div key={idx} className="sp-chip-wrap">
                    <button
                      type="button"
                      className="sp-chip"
                      onClick={() => {
                        onSearchChange(chip);
                        saveRecentSearch(chip);
                      }}
                    >
                      <span>{chip}</span>
                    </button>
                    <button
                      type="button"
                      className="sp-chip-delete"
                      onClick={(e) => removeRecentSearch(e, chip)}
                      title="Remove"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>


            {/* 3. POPULAR SEARCHES */}
            <div className="sp-section sp-section--popular">
              <div className="sp-section__header">
                <span className="sp-section__title">POPULAR SEARCHES</span>
              </div>
              <div className="sp-popular-list">
                {POPULAR_SEARCHES.map((queryText, idx) => (
                  <div
                    key={idx}
                    className="sp-popular-row"
                    onClick={() => {
                      onSearchChange(queryText);
                      saveRecentSearch(queryText);
                    }}
                  >
                    <div className="sp-popular-row__left">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sp-popular-row__icon">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.34-4.34" />
                      </svg>
                      <span className="sp-popular-row__text">{queryText}</span>
                    </div>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="sp-popular-row__arrow">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN: 4-COLUMN PRODUCTS GRID (MAX 20 PRODUCTS) ═══ */}
          <div className="sp-right-col">
            <div className="sp-right-header">
              <span className="sp-section__title">
                {hasQuery ? `SEARCH RESULTS (${filteredProducts.length})` : "RECOMMENDED PRODUCTS"}
              </span>

              {/* View all in shop button / search shortcut */}
              <button
                type="button"
                className="sp-see-all-btn"
                onClick={() => handleGoToShop(searchQuery)}
                title="View all in Shop"
              >
                <span>View all in Shop</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="sp-product-grid">
                {filteredProducts.map((product) => {
                  const isWishlisted = Boolean(wishlist[product.id]);
                  const isAdded = Boolean(addedItems[product.id]);

                  return (
                    <div
                      key={product.id}
                      className="sp-product-card"
                      onClick={() => handleSelectProduct(product)}
                    >
                      {/* Product Image Area: Square 1:1, centered product image */}
                      <div className="sp-product-card__img-box">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="sp-product-card__img"
                          loading="lazy"
                        />

                        {/* Heart Wishlist Icon top-right */}
                        <button
                          type="button"
                          className={`sp-product-card__heart${isWishlisted ? " is-active" : ""}`}
                          onClick={(e) => toggleWishlist(e, product.id)}
                          aria-label="Wishlist"
                          title="Wishlist"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted ? "#ff1f1f" : "none"} stroke={isWishlisted ? "#ff1f1f" : "#666"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                          </svg>
                        </button>


                        {/* Quick Add (+) Button in bottom-right */}
                        <button
                          type="button"
                          className={`sp-product-card__add-btn${isAdded ? " is-added" : ""}`}
                          onClick={(e) => handleQuickAdd(e, product)}
                          aria-label="Quick Add"
                          title="Quick Add to Cart"
                        >
                          {isAdded ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 5v14" />
                              <path d="M5 12h14" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Info below image */}
                      <div className="sp-product-card__info">
                        <span className="sp-product-card__brand" title={product.brand}>{product.brand}</span>
                        <h4 className="sp-product-card__name" title={product.name}>
                          {product.name}
                        </h4>

                        <div className="sp-product-card__price-row">
                          <span className="sp-product-card__price">
                            {formatPrice(product.offerPrice || product.price)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="sp-no-results">
                <p>No products found matching "{searchQuery}"</p>
                <button
                  type="button"
                  className="sp-chip"
                  onClick={() => handleGoToShop(searchQuery)}
                >
                  Search all categories in Shop →
                </button>
              </div>
            )}

            {/* Prompt when 20 products reached */}
            {filteredProducts.length >= 20 && (
              <div className="sp-right-footer">
                <span>Showing top 20 matches.</span>
                <button
                  type="button"
                  className="sp-footer-link"
                  onClick={() => handleGoToShop(searchQuery)}
                >
                  Click search icon or here for all results in Shop →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
