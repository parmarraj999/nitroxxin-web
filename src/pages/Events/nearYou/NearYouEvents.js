import React, { useMemo, useState, useEffect, useRef } from "react";
import "./NearYouEvents.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEventsContext } from "../../../context/EventsContext";
import { toDate } from "../../../utils/dataFormatters";
import { EVENT_CATEGORY_CONFIG } from "../eventCategoryConfig";
import { useDocument } from "../../../hooks/useFirestore";
import { useAuth } from "../../../context/AuthContext";
import { useAuthModal } from "../../../components/AuthModal/useAuthModal";
import { COLLECTIONS, db } from "../../../services/firebase";
import { saveFavoriteEvent, removeFavoriteEvent } from "../../../services/commerceService";
import { EventCard } from "../Events";
import LocationModal from "../../../components/layout/bottomNav/LocationModal";

const isVisibleEvent = (event) => String(event.status || "").toLowerCase() === "published";

const eventSortTime = (event) => {
  const date = toDate(event.date || event.eventDate || event.startsAt || event.startDate || event.createdAt);
  return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
};

function PinIcon({ color = "currentColor", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function SearchIcon({ color = "currentColor", size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SlidersIcon({ color = "currentColor", size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={size} height={size}>
      <line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="6" r="2" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="15" cy="12" r="2" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="9" cy="18" r="2" fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

export default function NearYouEvents() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { events, eventsLoading, categories } = useEventsContext();
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/events");
    }
  };

  // Layout Categories from Firestore
  const { data: eventsLayoutDoc } = useDocument("page_layouts", "events_layout");
  const rawCategories = eventsLayoutDoc?.categories || eventsLayoutDoc?.data?.categories;

  const displayedCategories = useMemo(() => {
    if (rawCategories && Array.isArray(rawCategories) && rawCategories.length > 0) {
      return rawCategories.map((cat, idx) => {
        let slug = "";
        if (cat.redirectUrl && cat.redirectUrl.includes("category=")) {
          slug = cat.redirectUrl.split("category=")[1].split("&")[0];
        } else if (cat.slug) {
          slug = cat.slug;
        } else if (cat.title || cat.label) {
          slug = (cat.title || cat.label).toLowerCase().replace(/\s+/g, "_");
        } else {
          slug = `cat-${idx}`;
        }
        return {
          id: slug,
          label: cat.title || cat.label || "Category",
        };
      });
    }

    if (categories && categories.length > 0) {
      return categories;
    }

    return EVENT_CATEGORY_CONFIG.map((cfg) => ({
      id: cfg.slug,
      label: cfg.category,
    }));
  }, [rawCategories, categories]);

  // Read URL params
  const paramSearch = searchParams.get("search") || searchParams.get("q") || "";
  const paramCategory = searchParams.get("category") || "All";
  const paramCity = searchParams.get("city") || searchParams.get("location") || "";
  const paramDate = searchParams.get("date") || "All";
  const paramPrice = searchParams.get("price") || "All";
  const paramSort = searchParams.get("sort") || "DateSoonest";

  // States
  const [searchInput, setSearchInput] = useState(paramSearch);
  const [query, setQuery] = useState(paramSearch);
  const [activeCategory, setActiveCategory] = useState(paramCategory);
  const [selectedCity, setSelectedCity] = useState(
    () => paramCity || localStorage.getItem("selectedCity") || "Bhopal"
  );
  const [filterDate, setFilterDate] = useState(paramDate);
  const [filterPrice, setFilterPrice] = useState(paramPrice);
  const [sortBy, setSortBy] = useState(paramSort);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Sync state if URL changes externally
  useEffect(() => {
    setQuery(paramSearch);
    setSearchInput(paramSearch);
    setActiveCategory(paramCategory);
    if (paramCity) setSelectedCity(paramCity);
    setFilterDate(paramDate);
    setFilterPrice(paramPrice);
    setSortBy(paramSort);
  }, [paramSearch, paramCategory, paramCity, paramDate, paramPrice, paramSort]);

  // City change listener
  useEffect(() => {
    const handleLocationChange = () => {
      const city = localStorage.getItem("selectedCity");
      if (city) setSelectedCity(city);
    };
    window.addEventListener("locationChanged", handleLocationChange);
    window.addEventListener("storage", handleLocationChange);
    return () => {
      window.removeEventListener("locationChanged", handleLocationChange);
      window.removeEventListener("storage", handleLocationChange);
    };
  }, []);

  const updateUrl = (overrides = {}) => {
    const nextQ = overrides.q !== undefined ? overrides.q : query;
    const nextCat = overrides.category !== undefined ? overrides.category : activeCategory;
    const nextCity = overrides.city !== undefined ? overrides.city : selectedCity;
    const nextDate = overrides.date !== undefined ? overrides.date : filterDate;
    const nextPrice = overrides.price !== undefined ? overrides.price : filterPrice;
    const nextSort = overrides.sort !== undefined ? overrides.sort : sortBy;

    const params = new URLSearchParams();
    if (nextQ && nextQ.trim()) params.set("search", nextQ.trim());
    if (nextCat && nextCat !== "All") params.set("category", nextCat);
    if (nextCity && nextCity.trim()) params.set("city", nextCity.trim());
    if (nextDate && nextDate !== "All") params.set("date", nextDate);
    if (nextPrice && nextPrice !== "All") params.set("price", nextPrice);
    if (nextSort && nextSort !== "DateSoonest") params.set("sort", nextSort);

    setSearchParams(params, { replace: true });
  };

  const handleSelectCity = (city) => {
    setSelectedCity(city);
    localStorage.setItem("selectedCity", city);
    window.dispatchEvent(new Event("locationChanged"));
    setIsLocationModalOpen(false);
    updateUrl({ city });
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setQuery(searchInput);
    updateUrl({ q: searchInput });
  };

  const handleSearchChange = (val) => {
    setSearchInput(val);
    setQuery(val);
    updateUrl({ q: val });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setQuery("");
    updateUrl({ q: "" });
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const handleCategorySelect = (catId) => {
    const nextCat = activeCategory === catId ? "All" : catId;
    setActiveCategory(nextCat);
    updateUrl({ category: nextCat });
  };

  const handleDateSelect = (dateOpt) => {
    const nextDate = filterDate === dateOpt ? "All" : dateOpt;
    setFilterDate(nextDate);
    updateUrl({ date: nextDate });
  };

  const handlePriceSelect = (priceOpt) => {
    const nextPrice = filterPrice === priceOpt ? "All" : priceOpt;
    setFilterPrice(nextPrice);
    updateUrl({ price: nextPrice });
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setQuery("");
    setActiveCategory("All");
    setFilterDate("All");
    setFilterPrice("All");
    setSortBy("DateSoonest");
    setSearchParams(selectedCity ? { city: selectedCity } : {}, { replace: true });
  };

  // Real-time Bookmarks synchronization
  const [bookmarkedEventIds, setBookmarkedEventIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("nitroxx_bookmarked_events") || "[]"));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (!user?.uid) return;
    try {
      const unsub = db()
        .collection(COLLECTIONS.users || "users")
        .doc(user.uid)
        .collection("bookmark")
        .onSnapshot(
          (snap) => {
            const ids = new Set();
            snap.forEach((doc) => {
              ids.add(doc.id);
              if (doc.data()?.eventId) ids.add(doc.data().eventId);
            });
            setBookmarkedEventIds(ids);
          },
          (err) => console.warn("Bookmark sync error:", err)
        );
      return () => unsub();
    } catch {
      // ignore
    }
  }, [user?.uid]);

  const handleToggleBookmark = async (event, clickEvent) => {
    if (clickEvent) {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
    }
    if (!event?.id) return;
    if (!user) {
      openLogin();
      return;
    }

    const isCurrentlyBookmarked = bookmarkedEventIds.has(event.id);
    const nextIds = new Set(bookmarkedEventIds);

    if (isCurrentlyBookmarked) {
      nextIds.delete(event.id);
    } else {
      nextIds.add(event.id);
    }
    setBookmarkedEventIds(nextIds);

    try {
      localStorage.setItem("nitroxx_bookmarked_events", JSON.stringify(Array.from(nextIds)));
    } catch {
      // ignore
    }

    try {
      if (!isCurrentlyBookmarked) {
        await saveFavoriteEvent({ userId: user.uid, event });
      } else {
        await removeFavoriteEvent({ userId: user.uid, eventId: event.id });
      }
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
      setBookmarkedEventIds(bookmarkedEventIds);
    }
  };

  // Base live events
  const liveEvents = useMemo(() => {
    return (events || [])
      .filter(isVisibleEvent)
      .sort((a, b) => eventSortTime(a) - eventSortTime(b));
  }, [events]);

  // Filtered local events
  const filteredEvents = useMemo(() => {
    const term = query.trim().toLowerCase();
    const cityLower = selectedCity ? selectedCity.trim().toLowerCase() : "";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = liveEvents.filter((event) => {
      const price = Number(event.price || event.ticketPrice || event.startingPrice || 0);
      const startsAt = toDate(event.date || event.eventDate || event.startsAt || event.startDate);

      // 1. Location match
      if (cityLower) {
        const matchesCity =
          String(event.location || "").toLowerCase().includes(cityLower) ||
          String(event.city || "").toLowerCase().includes(cityLower) ||
          String(event.venue || "").toLowerCase().includes(cityLower) ||
          String(event.address || "").toLowerCase().includes(cityLower);
        if (!matchesCity) return false;
      }

      // 2. Search query match
      if (term) {
        const matchesSearch = [
          event.name,
          event.title,
          event.category,
          event.categoryName,
          event.location,
          event.city,
          event.venue,
          event.description,
          event.organizerName,
        ].some((val) => String(val || "").toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      // 3. Category match
      if (activeCategory && activeCategory !== "All") {
        const catLower = activeCategory.toLowerCase();
        const catObj = displayedCategories.find((c) => c.id === activeCategory);
        const catLabelLower = (catObj?.label || "").toLowerCase();

        const matchesCat =
          String(event.category || "").toLowerCase() === catLower ||
          String(event.categoryId || "").toLowerCase() === catLower ||
          String(event.categorySlug || "").toLowerCase() === catLower ||
          String(event.categoryName || "").toLowerCase() === catLower ||
          (catLabelLower && String(event.category || "").toLowerCase() === catLabelLower);

        if (!matchesCat) return false;
      }

      // 4. Quick Date filter
      if (filterDate === "Today") {
        if (!startsAt || startsAt.toDateString() !== today.toDateString()) return false;
      } else if (filterDate === "Upcoming") {
        if (startsAt && startsAt < today) return false;
      } else if (filterDate === "Tomorrow") {
        if (!startsAt || startsAt.toDateString() !== tomorrow.toDateString()) return false;
      } else if (filterDate === "Weekend") {
        if (!startsAt) return false;
        const day = startsAt.getDay();
        if (day !== 0 && day !== 6) return false;
      } else if (filterDate === "NextWeek") {
        if (!startsAt) return false;
        const next7 = new Date(today);
        next7.setDate(today.getDate() + 7);
        if (startsAt < today || startsAt > next7) return false;
      }

      // 5. Price filter
      if (filterPrice === "Free") {
        if (price !== 0) return false;
      } else if (filterPrice === "Under500") {
        if (price > 500) return false;
      } else if (filterPrice === "Under1000") {
        if (price > 1000) return false;
      } else if (filterPrice === "Paid") {
        if (price === 0) return false;
      }

      return true;
    });

    // 6. Sort
    result.sort((a, b) => {
      const timeA = eventSortTime(a);
      const timeB = eventSortTime(b);
      const priceA = Number(a.price || a.ticketPrice || a.startingPrice || 0);
      const priceB = Number(b.price || b.ticketPrice || b.startingPrice || 0);

      if (sortBy === "DateSoonest") return timeA - timeB;
      if (sortBy === "PriceLowHigh") return priceA - priceB;
      if (sortBy === "PriceHighLow") return priceB - priceA;
      return 0;
    });

    return result;
  }, [liveEvents, selectedCity, query, activeCategory, displayedCategories, filterDate, filterPrice, sortBy]);

  const activeCategoryObj = displayedCategories.find((c) => c.id === activeCategory);
  const isAllActive = activeCategory === "All" && filterDate === "All" && filterPrice === "All";
  const activeFiltersCount =
    (activeCategory !== "All" ? 1 : 0) +
    (filterDate !== "All" ? 1 : 0) +
    (filterPrice !== "All" ? 1 : 0) +
    (sortBy !== "DateSoonest" ? 1 : 0);

  return (
    <div className="ny-page">
      {/* Top Navigation Bar with Back button in left and Profile button in right */}
      <header className="ep-top-nav">
        <div className="ep-top-nav__inner">
          <div className="ep-top-nav__left">
            <button
              type="button"
              className="ep-top-nav__back-btn"
              onClick={handleBack}
              aria-label="Go back"
              title="Go back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span>Back</span>
            </button>
          </div>

          <div className="ep-top-nav__right">
            {!user && (
              <button
                type="button"
                className="ep-top-nav__login-btn"
                onClick={openLogin}
              >
                Log In
              </button>
            )}
            <Link
              to="/profile"
              className="ep-top-nav__profile-btn"
              aria-label="Profile"
              title={user?.displayName || "Profile"}
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="ep-top-nav__avatar" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-circle-user-icon lucide-circle-user"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="10" r="3" />
                  <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                </svg>
              )}
            </Link>
          </div>
        </div>
      </header>

      <div className="ny-container">

        {/* Hero Crimson Banner */}
        <div className="ny-hero-card">
          <div className="ny-hero-card__body">
            <span className="ny-hero-card__badge">NEARBY DISCOVERY</span>
            <h1 className="ny-hero-card__title">
              Events Near You {selectedCity && <span className="ny-city-highlight">in {selectedCity}</span>}
            </h1>
            <p className="ny-hero-card__subtitle">
              {filteredEvents.length > 0
                ? `There are ${filteredEvents.length} events happening near ${selectedCity || "your area"}.`
                : `Discover weekend breakfast rides, track days, meetups and exhibitions.`}
            </p>
          </div>

          <div className="ny-hero-card__loc-action">
            <button
              type="button"
              className="ny-change-city-pill"
              onClick={() => setIsLocationModalOpen(true)}
            >
              <PinIcon size={18} color="#ffffff" />
              <span>{selectedCity || "Select City"}</span>
              <span className="ny-change-tag">Change</span>
            </button>
          </div>
        </div>

        {/* Search Bar Row */}
        <div className="ny-search-bar-row">
          <form className="ny-search-form" onSubmit={handleSearchSubmit}>
            <span className="ny-search-icon">
              <SearchIcon color="#9ca3af" />
            </span>
            <input
              ref={searchInputRef}
              className="ny-search-input"
              type="text"
              placeholder={`Search events in ${selectedCity || "your city"}...`}
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                className="ny-search-clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </form>
        </div>

        {/* Single Unified Mixed Filter Tabs (UI Copied from Event Page) */}
        <div className="ep-filters ny-filters">
          <button
            type="button"
            className={`ep-filter-btn${isFilterDrawerOpen || activeFiltersCount > 0 ? " ep-filter-btn--active" : ""}`}
            onClick={() => setIsFilterDrawerOpen(true)}
          >
            <SlidersIcon />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="ny-filter-badge">{activeFiltersCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`ep-filter-btn${isAllActive ? " ep-filter-btn--active" : ""}`}
            onClick={handleResetFilters}
          >
            All
          </button>

          <button
            type="button"
            className={`ep-filter-btn${filterDate === "Today" ? " ep-filter-btn--active" : ""}`}
            onClick={() => handleDateSelect("Today")}
          >
            Today
          </button>

          <button
            type="button"
            className={`ep-filter-btn${filterDate === "Upcoming" ? " ep-filter-btn--active" : ""}`}
            onClick={() => handleDateSelect("Upcoming")}
          >
            Upcoming
          </button>

          <button
            type="button"
            className={`ep-filter-btn${filterPrice === "Free" ? " ep-filter-btn--active" : ""}`}
            onClick={() => handlePriceSelect("Free")}
          >
            Free
          </button>

          <button
            type="button"
            className={`ep-filter-btn${filterPrice === "Paid" ? " ep-filter-btn--active" : ""}`}
            onClick={() => handlePriceSelect("Paid")}
          >
            Paid
          </button>

          {/* Categories Mixed In */}
          {displayedCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`ep-filter-btn${activeCategory === cat.id ? " ep-filter-btn--active" : ""}`}
              onClick={() => handleCategorySelect(cat.id)}
            >
              {cat.label}
            </button>
          ))}

          {/* Sort Dropdown styled as ep-filter-btn */}
          <div className="ep-filter-btn ny-sort-pill">
            <label htmlFor="ny-sort-select" className="ny-sort-label">Sort:</label>
            <select
              id="ny-sort-select"
              className="ny-sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                updateUrl({ sort: e.target.value });
              }}
            >
              <option value="DateSoonest">Soonest Date</option>
              <option value="PriceLowHigh">Price: Low to High</option>
              <option value="PriceHighLow">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary (Copied from Event Page) */}
        {(query || activeCategory !== "All" || filterPrice !== "All" || filterDate !== "All") && (
          <div className="ep-active-tags">
            {query && (
              <span className="ep-tag">
                Search: "{query}"
                <button type="button" className="ep-tag__close" onClick={handleClearSearch}>×</button>
              </span>
            )}
            {activeCategory !== "All" && (
              <span className="ep-tag">
                Category: {activeCategoryObj?.label || activeCategory}
                <button type="button" className="ep-tag__close" onClick={() => handleCategorySelect("All")}>×</button>
              </span>
            )}
            {filterDate !== "All" && (
              <span className="ep-tag">
                Date: {filterDate === "Weekend" ? "This Weekend" : filterDate === "NextWeek" ? "Next 7 Days" : filterDate}
                <button type="button" className="ep-tag__close" onClick={() => handleDateSelect("All")}>×</button>
              </span>
            )}
            {filterPrice !== "All" && (
              <span className="ep-tag">
                Price: {filterPrice === "Under500" ? "Under ₹500" : filterPrice === "Under1000" ? "Under ₹1000" : filterPrice}
                <button type="button" className="ep-tag__close" onClick={() => handlePriceSelect("All")}>×</button>
              </span>
            )}
            <button
              type="button"
              className="ep-clear-all-btn"
              onClick={handleResetFilters}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Results Header */}
        <div className="ny-results-header">
          <h2 className="ny-results-title">
            Events {selectedCity ? `in ${selectedCity}` : ""}
          </h2>
          <span className="ny-results-count">
            {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"} found
          </span>
        </div>

        {/* Event Cards Grid */}
        {eventsLoading ? (
          <div className="ny-loading">
            <div className="ny-spinner" />
            <p>Locating events near you...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="ny-grid ep-events-grid">
            {filteredEvents.map((event) => (
              <EventCard
                key={`ny-${event.id}`}
                event={event}
                isBookmarked={bookmarkedEventIds.has(event.id)}
                onToggleBookmark={handleToggleBookmark}
              />
            ))}
          </div>
        ) : (
          <div className="ny-empty-card">
            <PinIcon size={48} color="#ff3344" />
            <h3>No events found in {selectedCity || "this area"}</h3>
            <p>
              We couldn't find matching events in {selectedCity || "your city"}. Try exploring other locations or view all events nationwide.
            </p>
            <div className="ny-empty-actions">
              <button
                type="button"
                className="ny-empty-btn primary"
                onClick={() => setIsLocationModalOpen(true)}
              >
                Change Location
              </button>
              <Link to="/events/all" className="ny-empty-btn secondary">
                Explore All Events
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filter Drawer (Copied from Event Page) */}
      {isFilterDrawerOpen && (
        <div className="ep-drawer-backdrop" onClick={() => setIsFilterDrawerOpen(false)}>
          <div className="ep-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ep-drawer__header">
              <h3>Filters & Sort</h3>
              <button className="ep-drawer__close-btn" onClick={() => setIsFilterDrawerOpen(false)}>×</button>
            </div>

            <div className="ep-drawer__content">
              {/* Sort Section */}
              <div className="ep-drawer__section">
                <h4>Sort By</h4>
                <div className="ep-drawer__options-grid">
                  <button
                    className={`ep-drawer__option-btn${sortBy === "DateSoonest" ? " active" : ""}`}
                    onClick={() => {
                      setSortBy("DateSoonest");
                      updateUrl({ sort: "DateSoonest" });
                    }}
                  >
                    Soonest Date
                  </button>
                  <button
                    className={`ep-drawer__option-btn${sortBy === "PriceLowHigh" ? " active" : ""}`}
                    onClick={() => {
                      setSortBy("PriceLowHigh");
                      updateUrl({ sort: "PriceLowHigh" });
                    }}
                  >
                    Price: Low to High
                  </button>
                  <button
                    className={`ep-drawer__option-btn${sortBy === "PriceHighLow" ? " active" : ""}`}
                    onClick={() => {
                      setSortBy("PriceHighLow");
                      updateUrl({ sort: "PriceHighLow" });
                    }}
                  >
                    Price: High to Low
                  </button>
                </div>
              </div>

              {/* Date Section */}
              <div className="ep-drawer__section">
                <h4>Date</h4>
                <div className="ep-drawer__options-grid">
                  {["All", "Today", "Tomorrow", "Weekend", "NextWeek"].map((d) => (
                    <button
                      key={d}
                      className={`ep-drawer__option-btn${filterDate === d ? " active" : ""}`}
                      onClick={() => handleDateSelect(d)}
                    >
                      {d === "All" ? "All Dates" : d === "Weekend" ? "This Weekend" : d === "NextWeek" ? "Next 7 Days" : d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Section */}
              <div className="ep-drawer__section">
                <h4>Price</h4>
                <div className="ep-drawer__options-grid">
                  {[
                    { id: "All", label: "All Prices" },
                    { id: "Free", label: "Free" },
                    { id: "Under500", label: "Under ₹500" },
                    { id: "Under1000", label: "Under ₹1000" },
                    { id: "Paid", label: "Paid" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      className={`ep-drawer__option-btn${filterPrice === p.id ? " active" : ""}`}
                      onClick={() => handlePriceSelect(p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories Section */}
              {displayedCategories && displayedCategories.length > 0 && (
                <div className="ep-drawer__section">
                  <h4>Category</h4>
                  <div className="ep-drawer__options-grid">
                    <button
                      className={`ep-drawer__option-btn${activeCategory === "All" ? " active" : ""}`}
                      onClick={() => handleCategorySelect("All")}
                    >
                      All Categories
                    </button>
                    {displayedCategories.map((c) => (
                      <button
                        key={c.id}
                        className={`ep-drawer__option-btn${activeCategory === c.id ? " active" : ""}`}
                        onClick={() => handleCategorySelect(c.id)}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="ep-drawer__footer">
              <button
                className="ep-drawer__reset-btn"
                onClick={handleResetFilters}
              >
                Reset All
              </button>
              <button
                className="ep-drawer__apply-btn"
                onClick={() => setIsFilterDrawerOpen(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectCity={handleSelectCity}
        currentCity={selectedCity}
        onAutoDetect={() => {}}
        isDetecting={false}
      />
    </div>
  );
}
