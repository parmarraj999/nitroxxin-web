import React, { useMemo, useState, useEffect, useRef } from "react";
import "./UpcomingEvents.css";
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

const isVisibleEvent = (event) => String(event.status || "").toLowerCase() === "published";

const eventSortTime = (event) => {
  const date = toDate(event.date || event.eventDate || event.startsAt || event.startDate || event.createdAt);
  return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
};

function SearchIcon({ color = "currentColor", size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="2" />
      <path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon({ color = "currentColor", size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
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

export default function UpcomingEvents() {
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

  // Layout Categories
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

    if (categories && categories.length > 0) return categories;

    return EVENT_CATEGORY_CONFIG.map((cfg) => ({
      id: cfg.slug,
      label: cfg.category,
    }));
  }, [rawCategories, categories]);

  // Read URL params
  const paramSearch = searchParams.get("search") || searchParams.get("q") || "";
  const paramCategory = searchParams.get("category") || "All";
  const paramDate = searchParams.get("date") || "All";
  const paramPrice = searchParams.get("price") || "All";
  const paramSort = searchParams.get("sort") || "DateSoonest";

  // States
  const [searchInput, setSearchInput] = useState(paramSearch);
  const [query, setQuery] = useState(paramSearch);
  const [activeCategory, setActiveCategory] = useState(paramCategory);
  const [filterDate, setFilterDate] = useState(paramDate);
  const [filterPrice, setFilterPrice] = useState(paramPrice);
  const [sortBy, setSortBy] = useState(paramSort);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const searchInputRef = useRef(null);

  // Sync state if URL changes externally
  useEffect(() => {
    setQuery(paramSearch);
    setSearchInput(paramSearch);
    setActiveCategory(paramCategory);
    setFilterDate(paramDate);
    setFilterPrice(paramPrice);
    setSortBy(paramSort);
  }, [paramSearch, paramCategory, paramDate, paramPrice, paramSort]);

  const updateUrl = (overrides = {}) => {
    const nextQ = overrides.q !== undefined ? overrides.q : query;
    const nextCat = overrides.category !== undefined ? overrides.category : activeCategory;
    const nextDate = overrides.date !== undefined ? overrides.date : filterDate;
    const nextPrice = overrides.price !== undefined ? overrides.price : filterPrice;
    const nextSort = overrides.sort !== undefined ? overrides.sort : sortBy;

    const params = new URLSearchParams();
    if (nextQ && nextQ.trim()) params.set("search", nextQ.trim());
    if (nextCat && nextCat !== "All") params.set("category", nextCat);
    if (nextDate && nextDate !== "All") params.set("date", nextDate);
    if (nextPrice && nextPrice !== "All") params.set("price", nextPrice);
    if (nextSort && nextSort !== "DateSoonest") params.set("sort", nextSort);

    setSearchParams(params, { replace: true });
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
    setSearchParams({}, { replace: true });
  };

  // Check if "All" is selected across filters
  const isAllActive = activeCategory === "All" && filterPrice === "All" && filterDate === "All";

  // Active filter count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeCategory !== "All") count++;
    if (filterPrice !== "All") count++;
    if (filterDate !== "All") count++;
    return count;
  }, [activeCategory, filterPrice, filterDate]);

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

  // Base upcoming events (date >= today)
  const baseUpcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = liveEvents.filter((event) => {
      const startsAt = toDate(event.date || event.eventDate || event.startsAt || event.startDate);
      return !startsAt || startsAt.getTime() >= today.getTime();
    });

    return upcoming.length > 0 ? upcoming : liveEvents;
  }, [liveEvents]);

  // Filtered upcoming events
  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const term = query.trim().toLowerCase();

    const result = baseUpcomingEvents.filter((event) => {
      const startsAt = toDate(event.date || event.eventDate || event.startsAt || event.startDate);
      const price = Number(event.price || event.ticketPrice || event.startingPrice || 0);

      // 1. Search Query
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

      // 2. Category
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

      // 3. Date Timeline filter
      if (filterDate === "Today") {
        if (!startsAt || startsAt.toDateString() !== today.toDateString()) return false;
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

      // 4. Price filter
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

    // Sort
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
  }, [baseUpcomingEvents, query, activeCategory, displayedCategories, filterDate, filterPrice, sortBy]);

  const activeCategoryObj = displayedCategories.find((c) => c.id === activeCategory);

  return (
    <div className="up-page">
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

      <div className="up-container">

        {/* Hero Banner */}
        <div className="up-hero">
          <h1 className="up-hero__title">Upcoming Motorcycle Events</h1>
          <p className="up-hero__subtitle">
            Stay ahead with latest upcoming motorcycle rides, track clinics, weekend tours & rallies happening across India.
          </p>
        </div>

        {/* Live Search Bar */}
        <div className="up-search-bar-row">
          <form className="up-search-form" onSubmit={handleSearchSubmit}>
            <span className="up-search-icon">
              <SearchIcon color="#9ca3af" />
            </span>
            <input
              ref={searchInputRef}
              className="up-search-input"
              type="text"
              placeholder="Search upcoming rides, track days, organizers..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                className="up-search-clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </form>
        </div>

        {/* Single Unified Mixed Filter Tabs (UI Copied from Event / Near You Page) */}
        <div className="ep-filters up-filters">
          <button
            type="button"
            className={`ep-filter-btn${isFilterDrawerOpen || activeFiltersCount > 0 ? " ep-filter-btn--active" : ""}`}
            onClick={() => setIsFilterDrawerOpen(true)}
          >
            <SlidersIcon />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="up-filter-badge">{activeFiltersCount}</span>
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
            className={`ep-filter-btn${filterDate === "Tomorrow" ? " ep-filter-btn--active" : ""}`}
            onClick={() => handleDateSelect("Tomorrow")}
          >
            Tomorrow
          </button>

          <button
            type="button"
            className={`ep-filter-btn${filterDate === "Weekend" ? " ep-filter-btn--active" : ""}`}
            onClick={() => handleDateSelect("Weekend")}
          >
            This Weekend
          </button>

          <button
            type="button"
            className={`ep-filter-btn${filterDate === "NextWeek" ? " ep-filter-btn--active" : ""}`}
            onClick={() => handleDateSelect("NextWeek")}
          >
            Next 7 Days
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
          <div className="ep-filter-btn up-sort-pill">
            <label htmlFor="up-sort-select" className="up-sort-label">Sort:</label>
            <select
              id="up-sort-select"
              className="up-sort-select"
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
        <div className="up-results-header">
          <h2 className="up-results-title">Upcoming Schedule</h2>
          <span className="up-results-count">
            {filteredEvents.length} {filteredEvents.length === 1 ? "event" : "events"} listed
          </span>
        </div>

        {/* Events Grid */}
        {eventsLoading ? (
          <div className="up-loading">
            <div className="up-spinner" />
            <p>Loading upcoming events...</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="up-grid ep-events-grid">
            {filteredEvents.map((event) => (
              <EventCard
                key={`up-${event.id}`}
                event={event}
                isBookmarked={bookmarkedEventIds.has(event.id)}
                onToggleBookmark={handleToggleBookmark}
              />
            ))}
          </div>
        ) : (
          <div className="up-empty-card">
            <CalendarIcon size={48} color="#50d735" />
            <h3>No upcoming events found</h3>
            <p>
              We couldn't find events matching your selected filters. Try choosing a different date range or category.
            </p>
            <div className="up-empty-actions">
              <button
                type="button"
                className="up-empty-btn primary"
                onClick={handleResetFilters}
              >
                Reset Filters
              </button>
              <Link to="/events" className="up-empty-btn secondary">
                Back to Events Hub
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filter Drawer (Copied from Event / Near You Page) */}
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
    </div>
  );
}
