import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAccessoriesContext } from "../../../context/AccessoriesContext";
import { useAuth } from "../../../context/AuthContext";
import { useAuthModal } from "../../../components/AuthModal/useAuthModal";
import { addToCart } from "../../../services/commerceService";
import "./MarketplaceSearch.css";

// Default Marketplace Categories
const DEFAULT_CATEGORY_TABS = [
  "All",
  "Helmets",
  "Rider Wear",
  "Tech & Gadget",
  "Performance",
  "Bike Accessories",
  "Luggage & Bags",
  "Protection",
];

const PLACEHOLDER_SUGGESTIONS = [
  "Full Face ECE 22.06 Helmets",
  "Alpinestars Riding Jacket",
  "Akrapovič Slip-On Exhaust",
  "DJI Action Camera & Mounts",
  "Waterproof Saddlebags",
  "Sena Bluetooth Helmet Intercom",
  "KTM Heavy Duty Crash Guard",
  "Brembo Brake Pads & Rotors",
  "Riding Gloves with Knuckle Armor",
  "Royal Enfield Touring Seats",
];

// Curated high-converting motorcycle accessories for trending showcase & fallback
const CURATED_TRENDING_PRODUCTS = [
  {
    id: "prod-tr-1",
    name: "Alpinestars Supertech R10 Full Face Carbon Helmet",
    category: "Helmets",
    categoryTab: "Helmets",
    brand: "Alpinestars",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=450&auto=format&fit=crop&q=80",
    price: 64999,
    offerPrice: 58499,
    rating: 4.9,
    ratingCount: 142,
    badge: "Top Rated",
    isTrending: true,
    stock: 12,
  },
  {
    id: "prod-tr-2",
    name: "Rynox Stealth Air Pro Mesh Riding Jacket (CE Level 2 Armor)",
    category: "Rider Wear",
    categoryTab: "Rider Wear",
    brand: "Rynox",
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=450&auto=format&fit=crop&q=80",
    price: 11500,
    offerPrice: 9775,
    rating: 4.8,
    ratingCount: 320,
    badge: "Best Seller",
    isTrending: true,
    stock: 25,
  },
  {
    id: "prod-tr-3",
    name: "Akrapovič Titanium Slip-On Performance Exhaust System",
    category: "Performance",
    categoryTab: "Performance",
    brand: "Akrapovič",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=450&auto=format&fit=crop&q=80",
    price: 48999,
    offerPrice: 42999,
    rating: 4.9,
    ratingCount: 88,
    badge: "Trending",
    isTrending: true,
    stock: 7,
  },
  {
    id: "prod-tr-4",
    name: "DJI Osmo Action 4 Standard Motorcycle Adventure Combo",
    category: "Tech & Gadget",
    categoryTab: "Tech & Gadget",
    brand: "DJI",
    image: "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=450&auto=format&fit=crop&q=80",
    price: 34990,
    offerPrice: 29990,
    rating: 4.7,
    ratingCount: 215,
    badge: "Hot Deal",
    isTrending: true,
    stock: 15,
  },
  {
    id: "prod-tr-5",
    name: "ViaTerra Condor 2.0 All-Weather Motorcycle Saddlebags (64L)",
    category: "Bike Accessories",
    categoryTab: "Luggage & Bags",
    brand: "ViaTerra",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=450&auto=format&fit=crop&q=80",
    price: 7499,
    offerPrice: 6699,
    rating: 4.8,
    ratingCount: 190,
    badge: "Touring Pick",
    isTrending: true,
    stock: 18,
  },
  {
    id: "prod-tr-6",
    name: "Sena 50S Mesh 2.0 Motorcycle Bluetooth Communication System",
    category: "Tech & Gadget",
    categoryTab: "Tech & Gadget",
    brand: "Sena",
    image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=450&auto=format&fit=crop&q=80",
    price: 32500,
    offerPrice: 28900,
    rating: 4.9,
    ratingCount: 110,
    badge: "Premium",
    isTrending: true,
    stock: 10,
  },
  {
    id: "prod-tr-7",
    name: "Zana Heavy Duty Frame Sliders & Engine Guard Kit",
    category: "Bike Accessories",
    categoryTab: "Protection",
    brand: "Zana",
    image: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=450&auto=format&fit=crop&q=80",
    price: 5499,
    offerPrice: 4799,
    rating: 4.6,
    ratingCount: 245,
    badge: "Durable",
    isTrending: true,
    stock: 30,
  },
  {
    id: "prod-tr-8",
    name: "KNOX Orsa Leather Waterproof CE Approved Riding Gloves",
    category: "Rider Wear",
    categoryTab: "Rider Wear",
    brand: "Knox",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=450&auto=format&fit=crop&q=80",
    price: 8999,
    offerPrice: 7999,
    rating: 4.8,
    ratingCount: 175,
    badge: "Waterproof",
    isTrending: true,
    stock: 22,
  },
];

export default function MarketplaceSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products = [], categories = [] } = useAccessoriesContext();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  const initialQuery = searchParams.get("q") || searchParams.get("search") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("All");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [addingId, setAddingId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  const inputRef = useRef(null);

  // Auto-focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Cycle animated placeholder text
  useEffect(() => {
    if (query) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_SUGGESTIONS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [query]);

  const handleQueryChange = (val) => {
    setQuery(val);
    if (val.trim()) {
      setSearchParams({ q: val }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handleClearQuery = () => {
    setQuery("");
    setSearchParams({}, { replace: true });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Recent searches and recently visited state with LocalStorage persistence
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored = localStorage.getItem("nitroxx_recent_marketplace_searches");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [recentlyVisited, setRecentlyVisited] = useState(() => {
    try {
      const stored = localStorage.getItem("nitroxx_recently_visited_products");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [recentsFilter, setRecentsFilter] = useState("all"); // 'all' | 'searches' | 'visited'

  const saveRecentSearch = (text) => {
    if (!text || !text.trim()) return;
    const clean = text.trim();
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((k) => k.toLowerCase() !== clean.toLowerCase())].slice(0, 10);
      try {
        localStorage.setItem("nitroxx_recent_marketplace_searches", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const saveRecentlyVisited = (product) => {
    if (!product || !product.id) return;
    setRecentlyVisited((prev) => {
      const cardData = {
        id: product.id,
        name: product.name || product.title,
        image: product.image,
        category: product.category,
        brand: product.brand,
        price: product.price,
        offerPrice: product.offerPrice,
      };
      const updated = [cardData, ...prev.filter((p) => p.id !== product.id)].slice(0, 8);
      try {
        localStorage.setItem("nitroxx_recently_visited_products", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("nitroxx_recent_marketplace_searches");
    } catch {}
  };

  const clearRecentlyVisited = () => {
    setRecentlyVisited([]);
    try {
      localStorage.removeItem("nitroxx_recently_visited_products");
    } catch {}
  };

  const removeRecentSearchItem = (e, keyword) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((k) => k !== keyword);
      try {
        localStorage.setItem("nitroxx_recent_marketplace_searches", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeRecentlyVisitedItem = (e, id) => {
    e.stopPropagation();
    setRecentlyVisited((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem("nitroxx_recently_visited_products", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      saveRecentSearch(query.trim());
    }
  };

  // Build unified search list from live Firestore products + curated items
  const normalizedLiveProducts = useMemo(() => {
    const live = products.filter((p) =>
      ["published", "active", "approved"].includes(p.status || "published")
    );

    return live.map((p) => {
      const name = p.name || p.title || "Product";
      const cat = p.category || p.categoryName || "Accessories";
      const catLower = cat.toLowerCase();

      let categoryTab = "Bike Accessories";
      if (catLower.includes("helmet")) categoryTab = "Helmets";
      else if (catLower.includes("jacket") || catLower.includes("wear") || catLower.includes("pant") || catLower.includes("glove") || catLower.includes("boot")) {
        categoryTab = "Rider Wear";
      } else if (catLower.includes("tech") || catLower.includes("gadget") || catLower.includes("camera") || catLower.includes("bluetooth") || catLower.includes("intercom")) {
        categoryTab = "Tech & Gadget";
      } else if (catLower.includes("exhaust") || catLower.includes("performance") || catLower.includes("brake") || catLower.includes("air filter")) {
        categoryTab = "Performance";
      } else if (catLower.includes("luggage") || catLower.includes("bag") || catLower.includes("saddlebag") || catLower.includes("tank")) {
        categoryTab = "Luggage & Bags";
      } else if (catLower.includes("guard") || catLower.includes("crash") || catLower.includes("slider") || catLower.includes("protection")) {
        categoryTab = "Protection";
      }

      const regularPrice = Number(p.regularPrice || p.price || p.mrp || 0);
      const offerPrice = Number(p.offerPrice || p.salePrice || p.price || 0);

      return {
        id: p.id,
        name,
        category: cat,
        categoryTab,
        brand: p.brand || p.brandName || "Nitroxx",
        image: p.image || p.imageUrl || p.images?.[0] || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=450&auto=format&fit=crop&q=80",
        price: regularPrice,
        offerPrice: offerPrice || regularPrice,
        rating: p.rating || p.averageRating || 4.7,
        ratingCount: p.ratingCount || p.reviewsCount || 48,
        badge: p.isBestSeller || p.bestSeller ? "Best Seller" : p.newArrival ? "New Arrival" : p.trending ? "Trending" : null,
        isLive: true,
      };
    });
  }, [products]);

  // Combine live and curated products
  const allSearchableItems = useMemo(() => {
    const liveIds = new Set(normalizedLiveProducts.map((p) => p.id));
    const curatedFiltered = CURATED_TRENDING_PRODUCTS.filter((p) => !liveIds.has(p.id));
    return [...normalizedLiveProducts, ...curatedFiltered];
  }, [normalizedLiveProducts]);

  // Dynamic Category Tabs from categories context or fallback
  const categoryTabs = useMemo(() => {
    if (categories && categories.length > 0) {
      const names = categories.map((c) => c.label || c.name).filter(Boolean);
      return ["All", ...Array.from(new Set([...DEFAULT_CATEGORY_TABS.slice(1), ...names]))];
    }
    return DEFAULT_CATEGORY_TABS;
  }, [categories]);

  // Filter products by active tab & search query
  const displayedItems = useMemo(() => {
    let list = allSearchableItems;

    // Filter by category tab
    if (activeTab !== "All") {
      const tabLower = activeTab.toLowerCase();
      list = list.filter((item) => {
        const itemCat = String(item.category || "").toLowerCase();
        const itemTab = String(item.categoryTab || "").toLowerCase();
        return itemTab === tabLower || itemCat.includes(tabLower) || tabLower.includes(itemCat);
      });
    }

    // Filter by query (name, category, brand, bike compatibility)
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const tokens = q.split(/\s+/).filter((t) => t.length > 0);
      list = list.filter((item) => {
        const searchable = [item.name, item.category, item.brand, item.categoryTab]
          .map((v) => String(v || "").toLowerCase())
          .join(" ");
        return tokens.every((token) => searchable.includes(token));
      });
    }

    return list;
  }, [allSearchableItems, activeTab, query]);

  const handleProductClick = (item) => {
    saveRecentSearch(item.name);
    saveRecentlyVisited(item);
    navigate(`/product/${item.id}`);
  };

  const handleRecentSearchClick = (keyword) => {
    handleQueryChange(keyword);
  };

  const handleAddToCart = async (e, product) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal();
      return;
    }
    setAddingId(product.id);
    try {
      await addToCart({
        userId: user.uid,
        product,
        quantity: 1,
      });
      setToastMessage(`Added "${product.name.slice(0, 24)}..." to cart!`);
      setTimeout(() => setToastMessage(""), 2800);
    } catch {
      setToastMessage("Failed to add to cart");
      setTimeout(() => setToastMessage(""), 2800);
    } finally {
      setAddingId(null);
    }
  };

  const placeholderText = `Search for '${PLACEHOLDER_SUGGESTIONS[placeholderIndex]}'`;

  const formatPrice = (val) => {
    if (!val) return "₹0";
    return `₹${Number(val).toLocaleString("en-IN")}`;
  };

  return (
    <div className="mp-search-page">
      {/* ── STICKY TOP NAVBAR ── */}
      <header className="mp-search-sticky-nav">
        <div className="mp-search-sticky-nav__inner">
          <button
            type="button"
            className="mp-search-topnav__back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            title="Go back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Back</span>
          </button>

          <h1 className="mp-search-topnav__title">Search Marketplace</h1>

          <div className="mp-search-topnav__right-actions">
            <Link to="/cart" className="mp-search-topnav__cart-btn" aria-label="Cart" title="Cart">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className="mp-search-toast">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="mp-search-page__inner">
        {/* Search Bar */}
        <div className="mp-search-bar">
          <span className="mp-search-bar__icon">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ff1f1f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.34-4.34" />
            </svg>
          </span>

          <input
            ref={inputRef}
            type="text"
            className="mp-search-bar__input"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            autoComplete="off"
            spellCheck="false"
          />

          {query ? (
            <button
              type="button"
              className="mp-search-bar__clear-btn"
              onClick={handleClearQuery}
              aria-label="Clear search"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          ) : null}
        </div>

        {/* Category Tabs */}
        <nav className="mp-search-tabs" aria-label="Product Categories">
          <div className="mp-search-tabs__scroll">
            {categoryTabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  className={`mp-search-tab${isActive ? " mp-search-tab--active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── RECENTS SECTION (Recent Searches & Recently Visited) ── */}
        {!query && (recentSearches.length > 0 || recentlyVisited.length > 0) && (
          <section className="mp-search-recents-container">
            {/* Filter Switcher: All Recent | Recent Searches | Recently Visited */}
            <div className="mp-search-recents-switch">
              <button
                type="button"
                className={`mp-search-recents-tab${recentsFilter === "all" ? " mp-search-recents-tab--active" : ""}`}
                onClick={() => setRecentsFilter("all")}
              >
                All Recent
              </button>
              {recentSearches.length > 0 && (
                <button
                  type="button"
                  className={`mp-search-recents-tab${recentsFilter === "searches" ? " mp-search-recents-tab--active" : ""}`}
                  onClick={() => setRecentsFilter("searches")}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Recent Searches ({recentSearches.length})</span>
                </button>
              )}
              {recentlyVisited.length > 0 && (
                <button
                  type="button"
                  className={`mp-search-recents-tab${recentsFilter === "visited" ? " mp-search-recents-tab--active" : ""}`}
                  onClick={() => setRecentsFilter("visited")}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>Recently Visited ({recentlyVisited.length})</span>
                </button>
              )}
            </div>

            {/* 1. Recent Searches List */}
            {(recentsFilter === "all" || recentsFilter === "searches") && recentSearches.length > 0 && (
              <div className="mp-search-recents-block">
                <div className="mp-search-recents__header">
                  <div className="mp-search-recents__title-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff1f1f" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="mp-search-recents__title">Recent Searches</span>
                  </div>
                  <button
                    type="button"
                    className="mp-search-recents__clear-all"
                    onClick={clearRecentSearches}
                  >
                    Clear all
                  </button>
                </div>

                <div className="mp-search-recents__chips">
                  {recentSearches.map((keyword, index) => (
                    <div
                      key={index}
                      className="mp-search-recent-chip"
                      onClick={() => handleRecentSearchClick(keyword)}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="mp-search-recent-chip__text">{keyword}</span>
                      <button
                        type="button"
                        className="mp-search-recent-chip__remove"
                        onClick={(e) => removeRecentSearchItem(e, keyword)}
                        aria-label={`Remove ${keyword}`}
                        title="Remove"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Recently Visited Products Horizontal Carousel */}
            {(recentsFilter === "all" || recentsFilter === "visited") && recentlyVisited.length > 0 && (
              <div className="mp-search-visited-block">
                <div className="mp-search-visited__header">
                  <div className="mp-search-visited__title-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff1f1f" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="mp-search-visited__title">Recently Visited Products</span>
                  </div>
                  <button
                    type="button"
                    className="mp-search-visited__clear-all"
                    onClick={clearRecentlyVisited}
                  >
                    Clear all
                  </button>
                </div>

                <div className="mp-search-visited__scroll">
                  {recentlyVisited.map((item) => (
                    <div
                      key={item.id}
                      className="mp-search-visited-card"
                      onClick={() => handleProductClick(item)}
                      role="button"
                      tabIndex={0}
                    >
                      <button
                        type="button"
                        className="mp-search-visited-card__remove"
                        onClick={(e) => removeRecentlyVisitedItem(e, item.id)}
                        aria-label="Remove from visited"
                        title="Remove from history"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>

                      <div className="mp-search-visited-card__thumb-wrap">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="mp-search-visited-card__thumb"
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=450&auto=format&fit=crop&q=80";
                          }}
                        />
                        {item.brand && (
                          <span className="mp-search-visited-card__badge">{item.brand}</span>
                        )}
                      </div>

                      <div className="mp-search-visited-card__info">
                        <h4 className="mp-search-visited-card__title" title={item.name}>
                          {item.name}
                        </h4>
                        <div className="mp-search-visited-card__meta">
                          <span className="mp-search-visited-card__price">
                            {formatPrice(item.offerPrice || item.price)}
                          </span>
                          {item.price > (item.offerPrice || 0) && (
                            <span className="mp-search-visited-card__mrp">
                              {formatPrice(item.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── PRODUCTS RESULTS SECTION ── */}
        <section className="mp-search-content">
          <div className="mp-search-content__header">
            <h2 className="mp-search-content__title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff1f1f" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
              </svg>
              <span>
                {query.trim()
                  ? `Results for "${query}"`
                  : activeTab !== "All"
                  ? `${activeTab} Accessories`
                  : "Trending Products"}
              </span>
            </h2>
            <span className="mp-search-content__count">
              {displayedItems.length} {displayedItems.length === 1 ? "product" : "products"}
            </span>
          </div>

          {/* Product Grid */}
          {displayedItems.length > 0 ? (
            <div className="mp-search-grid">
              {displayedItems.map((item) => {
                const hasDiscount = item.price > 0 && item.offerPrice > 0 && item.price > item.offerPrice;
                const discountPercent = hasDiscount
                  ? Math.round(((item.price - item.offerPrice) / item.price) * 100)
                  : 0;

                return (
                  <article
                    key={item.id}
                    className="mp-product-card"
                    onClick={() => handleProductClick(item)}
                  >
                    <div className="mp-product-card__thumb-wrap">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="mp-product-card__thumb"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=450&auto=format&fit=crop&q=80";
                        }}
                      />

                      {/* Top Badges */}
                      <div className="mp-product-card__top-badges">
                        {item.badge && (
                          <span className="mp-product-card__badge-pill">{item.badge}</span>
                        )}
                        {hasDiscount && (
                          <span className="mp-product-card__discount-pill">{discountPercent}% OFF</span>
                        )}
                      </div>
                    </div>

                    <div className="mp-product-card__body">
                      <div className="mp-product-card__category-line">
                        <span className="mp-product-card__category">{item.category || "Accessories"}</span>
                        {item.brand && (
                          <span className="mp-product-card__brand">{item.brand}</span>
                        )}
                      </div>

                      <h3 className="mp-product-card__title" title={item.name}>
                        {item.name}
                      </h3>

                      {/* Rating Line */}
                      {item.rating && (
                        <div className="mp-product-card__rating-row">
                          <span className="mp-product-card__star">★</span>
                          <span className="mp-product-card__rating-val">{item.rating}</span>
                          {item.ratingCount && (
                            <span className="mp-product-card__rating-count">({item.ratingCount})</span>
                          )}
                        </div>
                      )}

                      {/* Price Row */}
                      <div className="mp-product-card__price-row">
                        <span className="mp-product-card__price">
                          {formatPrice(item.offerPrice || item.price)}
                        </span>
                        {hasDiscount && (
                          <span className="mp-product-card__mrp">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </div>

                      {/* Quick Action Button */}
                      <button
                        type="button"
                        className={`mp-product-card__add-btn${addingId === item.id ? " mp-product-card__add-btn--loading" : ""}`}
                        onClick={(e) => handleAddToCart(e, item)}
                        disabled={addingId === item.id}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                          <path d="M3 6h18" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                        <span>{addingId === item.id ? "Adding..." : "Add to Cart"}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mp-search-empty">
              <div className="mp-search-empty__icon">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ff1f1f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.34-4.34" />
                </svg>
              </div>
              <h3 className="mp-search-empty__title">No matching products found</h3>
              <p className="mp-search-empty__desc">
                We couldn't find any accessories matching "{query}". Try checking your spelling or explore popular categories below.
              </p>
              <div className="mp-search-empty__suggestions">
                {["Helmets", "Riding Jackets", "Gloves", "Exhausts", "Action Cameras", "Saddlebags", "KTM", "Royal Enfield"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="mp-search-empty__chip"
                    onClick={() => handleQueryChange(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
