import React, { useMemo, useState, useEffect, useRef } from "react";
import "./AllEvents.css";
import { Link, useSearchParams } from "react-router-dom";
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

const POPULAR_SEARCH_TAGS = [
  "Track Day",
  "Night Rides",
  "Breakfast Ride",
  "Workshops",
  "Free Entry",
  "Adventure Tour",
  "Offroad",
];

function SearchIcon({ color = "currentColor", size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SlidersIcon({ color = "currentColor", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="6" r="2" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="15" cy="12" r="2" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="9" cy="18" r="2" fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function PinIcon({ color = "currentColor", size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export default function AllEvents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { events, eventsLoading, categories } = useEventsContext();
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  // Layout Categories from Firestore (fallback to config)
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
          image: cat.imageUrl || cat.image || "",
        };
      });
    }

    if (categories && categories.length > 0) {
      return categories;
    }

    return EVENT_CATEGORY_CONFIG.map((cfg) => ({
      id: cfg.slug,
      label: cfg.category,
      image: "",
    }));
  }, [rawCategories, categories]);

  // Read URL query parameters
  const paramSearch = searchParams.get("search") || searchParams.get("q") || "";
  const paramCategory = searchParams.get("category") || searchParams.get("cat") || "All";
  const paramCity = searchParams.get("city") || searchParams.get("location") || "";
  const paramDate = searchParams.get("date") || "All";
  const paramPrice = searchParams.get("price") || "All";
  const paramSort = searchParams.get("sort") || "DateSoonest";

  // Filter States
  const [searchInput, setSearchInput] = useState(paramSearch);
  const [query, setQuery] = useState(paramSearch);
  const [activeCategory, setActiveCategory] = useState(paramCategory);
  const [selectedCity, setSelectedCity] = useState(() => paramCity || localStorage.getItem("selectedCity") || "");
  const [filterDate, setFilterDate] = useState(paramDate);
  const [filterPrice, setFilterPrice] = useState(paramPrice);
  const [sortBy, setSortBy] = useState(paramSort);

  // Modals & Drawers
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Sync state if URL changes externally
  useEffect(() => {
    setQuery(paramSearch);
    setSearchInput(paramSearch);
    setActiveCategory(paramCategory);
    if (paramCity) {
      setSelectedCity(paramCity);
    }
    setFilterDate(paramDate);
    setFilterPrice(paramPrice);
    setSortBy(paramSort);
  }, [paramSearch, paramCategory, paramCity, paramDate, paramPrice, paramSort]);

  // Update URL Query Parameters
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

  // Search Submit / Real-time handler
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
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Category select handler
  const handleCategorySelect = (catId) => {
    const nextCat = activeCategory === catId ? "All" : catId;
    setActiveCategory(nextCat);
    updateUrl({ category: nextCat });
  };

  // City select handler
  const handleSelectCity = (city) => {
    setSelectedCity(city);
    localStorage.setItem("selectedCity", city);
    window.dispatchEvent(new Event("locationChanged"));
    setIsLocationModalOpen(false);
    updateUrl({ city });
  };

  const handleClearCity = () => {
    setSelectedCity("");
    localStorage.removeItem("selectedCity");
    window.dispatchEvent(new Event("locationChanged"));
    updateUrl({ city: "" });
  };

  // Date select handler
  const handleDateSelect = (dateOpt) => {
    const nextDate = filterDate === dateOpt ? "All" : dateOpt;
    setFilterDate(nextDate);
    updateUrl({ date: nextDate });
  };

  // Price select handler
  const handlePriceSelect = (priceOpt) => {
    const nextPrice = filterPrice === priceOpt ? "All" : priceOpt;
    setFilterPrice(nextPrice);
    updateUrl({ price: nextPrice });
  };

  // Sort select handler
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    updateUrl({ sort: newSort });
  };

  // Clear all filters
  const handleResetAll = () => {
    setSearchInput("");
    setQuery("");
    setActiveCategory("All");
    setFilterDate("All");
    setFilterPrice("All");
    setSortBy("DateSoonest");
    setSelectedCity("");
    localStorage.removeItem("selectedCity");
    window.dispatchEvent(new Event("locationChanged"));
    setSearchParams({}, { replace: true });
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

  // Main Filtering Engine across Search Queries, Category Queries, and Location Queries
  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const term = query.trim().toLowerCase();

    const result = liveEvents.filter((event) => {
      const startsAt = toDate(event.date || event.eventDate || event.startsAt || event.startDate);
      const price = Number(event.price || event.ticketPrice || event.startingPrice || 0);

      // 1. Search Query Match
      if (term) {
        const matchesSearch = [
          event.name,
          event.title,
          event.category,
          event.categoryName,
          event.location,
          event.city,
          event.venue,
          event.address,
          event.organizerName,
          event.hostName,
          event.description,
          event.subtitle,
        ].some((val) => String(val || "").toLowerCase().includes(term));

        if (!matchesSearch) return false;
      }

      // 2. Location / City Query Match
      if (selectedCity && selectedCity.trim()) {
        const cityLower = selectedCity.trim().toLowerCase();
        const matchesCity =
          String(event.location || "").toLowerCase().includes(cityLower) ||
          String(event.city || "").toLowerCase().includes(cityLower) ||
          String(event.venue || "").toLowerCase().includes(cityLower) ||
          String(event.address || "").toLowerCase().includes(cityLower);

        if (!matchesCity) return false;
      }

      // 3. Category Query Match
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

      // 4. Date Query Filter
      if (filterDate === "Today") {
        if (!startsAt || startsAt.toDateString() !== today.toDateString()) return false;
      } else if (filterDate === "Tomorrow") {
        if (!startsAt || startsAt.toDateString() !== tomorrow.toDateString()) return false;
      } else if (filterDate === "Weekend") {
        if (!startsAt) return false;
        const day = startsAt.getDay();
        if (day !== 0 && day !== 6) return false; // Sunday or Saturday
      } else if (filterDate === "NextWeek") {
        if (!startsAt) return false;
        const next7 = new Date(today);
        next7.setDate(today.getDate() + 7);
        if (startsAt < today || startsAt > next7) return false;
      }

      // 5. Price Query Filter
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

      if (sortBy === "DateSoonest") {
        return timeA - timeB;
      } else if (sortBy === "PriceLowHigh") {
        return priceA - priceB;
      } else if (sortBy === "PriceHighLow") {
        return priceB - priceA;
      } else if (sortBy === "NameAZ") {
        const nameA = String(a.name || a.title || "");
        const nameB = String(b.name || b.title || "");
        return nameA.localeCompare(nameB);
      }
      return 0;
    });

    return result;
  }, [liveEvents, query, selectedCity, activeCategory, displayedCategories, filterDate, filterPrice, sortBy]);

  // Active filters count
  const activeFiltersCount =
    (query ? 1 : 0) +
    (selectedCity ? 1 : 0) +
    (activeCategory !== "All" ? 1 : 0) +
    (filterDate !== "All" ? 1 : 0) +
    (filterPrice !== "All" ? 1 : 0);

  const activeCategoryObj = displayedCategories.find((c) => c.id === activeCategory);
  const activeCategoryLabel = activeCategoryObj ? activeCategoryObj.label : activeCategory;

  return (
    <div className="allev-page">
      {/* Background ambient accents */}
      <div className="allev-ambient-glow allev-ambient-glow--top" />
      <div className="allev-ambient-glow allev-ambient-glow--bottom" />

      <div className="allev-container">
        {/* Navigation Breadcrumb */}
        <nav className="allev-breadcrumb">
          <Link to="/" className="allev-breadcrumb__link">Home</Link>
          <span className="allev-breadcrumb__sep">/</span>
          <Link to="/events" className="allev-breadcrumb__link">Events</Link>
          <span className="allev-breadcrumb__sep">/</span>
          <span className="allev-breadcrumb__current">All Events</span>
        </nav>

        {/* Hero Header */}
        <header className="allev-header">
          <div className="allev-header__main">
            <span className="allev-header__tag">EXPLORE DIRECTORY</span>
            <h1 className="allev-header__title">All Motorcycle Events</h1>
            <p className="allev-header__subtitle">
              Browse, search, and discover motorcycle rallies, track days, weekend rides, and clinics across India.
            </p>
          </div>

          {/* Quick Location Badge & Selector */}
          <div className="allev-header__location-box">
            <div className="allev-header__location-info">
              <span className="allev-header__location-label">Filtering Location</span>
              <span className="allev-header__location-val">
                <PinIcon color="#50d735" size={16} />
                {selectedCity || "All Locations"}
              </span>
            </div>
            <button
              type="button"
              className="allev-header__location-btn"
              onClick={() => setIsLocationModalOpen(true)}
            >
              {selectedCity ? "Change" : "Select City"}
            </button>
          </div>
        </header>

        {/* Working Search Bar Component */}
        <div className="allev-search-section">
          <form className="allev-search-bar" onSubmit={handleSearchSubmit}>
            <span className="allev-search-bar__icon">
              <SearchIcon color="#7c3aed" size={22} />
            </span>
            <input
              ref={searchInputRef}
              type="search"
              className="allev-search-bar__input"
              placeholder="Search by event name, city, venue, organizer, ride type..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                className="allev-search-bar__clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
            <button type="submit" className="allev-search-bar__submit">
              Search
            </button>
          </form>

          {/* Popular Search Suggestions */}
          <div className="allev-search-tags">
            <span className="allev-search-tags__label">Popular:</span>
            {POPULAR_SEARCH_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`allev-search-tag-btn${query.toLowerCase() === tag.toLowerCase() ? " active" : ""}`}
                onClick={() => handleSearchChange(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Category Carousel Pills */}
        <div className="allev-categories-bar">
          <div className="allev-categories-scroll">
            <button
              type="button"
              className={`allev-cat-pill${activeCategory === "All" ? " allev-cat-pill--active" : ""}`}
              onClick={() => handleCategorySelect("All")}
            >
              All Categories
            </button>
            {displayedCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`allev-cat-pill${activeCategory === cat.id ? " allev-cat-pill--active" : ""}`}
                onClick={() => handleCategorySelect(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls Bar (Date, Price, Advanced Filters, Sort) */}
        <div className="allev-controls-row">
          <div className="allev-quick-pills">
            <button
              type="button"
              className={`allev-control-btn allev-control-btn--filter${activeFiltersCount > 0 ? " has-badge" : ""}`}
              onClick={() => setIsFilterDrawerOpen(true)}
            >
              <SlidersIcon size={16} />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="allev-badge-count">{activeFiltersCount}</span>
              )}
            </button>

            {/* Quick Date Pills */}
            <button
              type="button"
              className={`allev-pill-btn${filterDate === "Today" ? " active" : ""}`}
              onClick={() => handleDateSelect("Today")}
            >
              Today
            </button>
            <button
              type="button"
              className={`allev-pill-btn${filterDate === "Tomorrow" ? " active" : ""}`}
              onClick={() => handleDateSelect("Tomorrow")}
            >
              Tomorrow
            </button>
            <button
              type="button"
              className={`allev-pill-btn${filterDate === "Weekend" ? " active" : ""}`}
              onClick={() => handleDateSelect("Weekend")}
            >
              This Weekend
            </button>

            {/* Quick Price Pills */}
            <button
              type="button"
              className={`allev-pill-btn${filterPrice === "Free" ? " active" : ""}`}
              onClick={() => handlePriceSelect("Free")}
            >
              Free Entry
            </button>
            <button
              type="button"
              className={`allev-pill-btn${filterPrice === "Paid" ? " active" : ""}`}
              onClick={() => handlePriceSelect("Paid")}
            >
              Paid
            </button>
          </div>

          {/* Sort By Dropdown */}
          <div className="allev-sort-wrap">
            <span className="allev-sort-label">Sort By:</span>
            <select
              className="allev-sort-select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="DateSoonest">Date: Soonest First</option>
              <option value="PriceLowHigh">Price: Low to High</option>
              <option value="PriceHighLow">Price: High to Low</option>
              <option value="NameAZ">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Active Applied Filters Chips */}
        {activeFiltersCount > 0 && (
          <div className="allev-active-chips-bar">
            <span className="allev-chips-title">Active Filters:</span>

            {query && (
              <span className="allev-filter-chip">
                Search: "{query}"
                <button type="button" onClick={handleClearSearch}>×</button>
              </span>
            )}

            {selectedCity && (
              <span className="allev-filter-chip">
                City: {selectedCity}
                <button type="button" onClick={handleClearCity}>×</button>
              </span>
            )}

            {activeCategory !== "All" && (
              <span className="allev-filter-chip">
                Category: {activeCategoryLabel}
                <button type="button" onClick={() => handleCategorySelect("All")}>×</button>
              </span>
            )}

            {filterDate !== "All" && (
              <span className="allev-filter-chip">
                Date: {filterDate === "Weekend" ? "This Weekend" : filterDate === "NextWeek" ? "Next 7 Days" : filterDate}
                <button type="button" onClick={() => handleDateSelect("All")}>×</button>
              </span>
            )}

            {filterPrice !== "All" && (
              <span className="allev-filter-chip">
                Price: {filterPrice === "Under500" ? "Under ₹500" : filterPrice === "Under1000" ? "Under ₹1000" : filterPrice}
                <button type="button" onClick={() => handlePriceSelect("All")}>×</button>
              </span>
            )}

            <button
              type="button"
              className="allev-reset-all-btn"
              onClick={handleResetAll}
            >
              Reset All
            </button>
          </div>
        )}

        {/* Results Counter Bar */}
        <div className="allev-results-meta">
          <span className="allev-results-count">
            Showing <strong>{filteredEvents.length}</strong> {filteredEvents.length === 1 ? "event" : "events"}
            {selectedCity ? ` in ${selectedCity}` : ""}
            {activeCategory !== "All" ? ` under ${activeCategoryLabel}` : ""}
          </span>
        </div>

        {/* Events Grid Content */}
        {eventsLoading ? (
          <div className="allev-loading-state">
            <div className="allev-spinner" />
            <p>Loading events from database...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="allev-events-grid">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isBookmarked={bookmarkedEventIds.has(event.id)}
                onToggleBookmark={handleToggleBookmark}
              />
            ))}
          </div>
        ) : (
          <div className="allev-empty-state">
            <div className="allev-empty-icon">
              <SearchIcon size={48} color="#9ca3af" />
            </div>
            <h3 className="allev-empty-title">No events found matching your criteria</h3>
            <p className="allev-empty-desc">
              We couldn't find any events matching
              {query ? ` search "${query}"` : ""}
              {selectedCity ? ` in ${selectedCity}` : ""}
              {activeCategory !== "All" ? ` in category "${activeCategoryLabel}"` : ""}
              {filterDate !== "All" ? ` on ${filterDate}` : ""}.
            </p>
            <div className="allev-empty-actions">
              <button
                type="button"
                className="allev-empty-btn allev-empty-btn--primary"
                onClick={handleResetAll}
              >
                Clear All Filters
              </button>
              <Link to="/events" className="allev-empty-btn allev-empty-btn--secondary">
                Back to Events Hub
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="allev-drawer-backdrop" onClick={() => setIsFilterDrawerOpen(false)}>
          <div className="allev-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="allev-drawer__header">
              <h3>Filter & Sort Events</h3>
              <button
                type="button"
                className="allev-drawer__close"
                onClick={() => setIsFilterDrawerOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="allev-drawer__body">
              {/* Category Filter */}
              <div className="allev-drawer__section">
                <h4>Category</h4>
                <div className="allev-drawer__options-grid">
                  <button
                    type="button"
                    className={`allev-drawer__opt-btn${activeCategory === "All" ? " active" : ""}`}
                    onClick={() => handleCategorySelect("All")}
                  >
                    All Categories
                  </button>
                  {displayedCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`allev-drawer__opt-btn${activeCategory === cat.id ? " active" : ""}`}
                      onClick={() => handleCategorySelect(cat.id)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Filter */}
              <div className="allev-drawer__section">
                <h4>Date</h4>
                <div className="allev-drawer__options-grid">
                  {["All", "Today", "Tomorrow", "Weekend", "NextWeek"].map((dateOpt) => (
                    <button
                      key={dateOpt}
                      type="button"
                      className={`allev-drawer__opt-btn${filterDate === dateOpt ? " active" : ""}`}
                      onClick={() => handleDateSelect(dateOpt)}
                    >
                      {dateOpt === "All"
                        ? "Any Date"
                        : dateOpt === "Weekend"
                        ? "This Weekend"
                        : dateOpt === "NextWeek"
                        ? "Next 7 Days"
                        : dateOpt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="allev-drawer__section">
                <h4>Price</h4>
                <div className="allev-drawer__options-grid">
                  {["All", "Free", "Under500", "Under1000", "Paid"].map((priceOpt) => (
                    <button
                      key={priceOpt}
                      type="button"
                      className={`allev-drawer__opt-btn${filterPrice === priceOpt ? " active" : ""}`}
                      onClick={() => handlePriceSelect(priceOpt)}
                    >
                      {priceOpt === "All"
                        ? "Any Price"
                        : priceOpt === "Free"
                        ? "Free Entry"
                        : priceOpt === "Under500"
                        ? "Under ₹500"
                        : priceOpt === "Under1000"
                        ? "Under ₹1000"
                        : "Paid Entry"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location in Drawer */}
              <div className="allev-drawer__section">
                <h4>Location / City</h4>
                <div className="allev-drawer__location-box">
                  <span>Current: <strong>{selectedCity || "All Locations"}</strong></span>
                  <button
                    type="button"
                    className="allev-drawer__loc-btn"
                    onClick={() => {
                      setIsFilterDrawerOpen(false);
                      setIsLocationModalOpen(true);
                    }}
                  >
                    Select City
                  </button>
                </div>
              </div>
            </div>

            <div className="allev-drawer__footer">
              <button
                type="button"
                className="allev-drawer__reset-btn"
                onClick={handleResetAll}
              >
                Reset All
              </button>
              <button
                type="button"
                className="allev-drawer__apply-btn"
                onClick={() => setIsFilterDrawerOpen(false)}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
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
