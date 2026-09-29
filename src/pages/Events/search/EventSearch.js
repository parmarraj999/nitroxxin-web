import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEventsContext } from "../../../context/EventsContext";
import { toDate } from "../../../utils/dataFormatters";
import "./EventSearch.css";

// Nitroxx Event Categories
const CATEGORY_TABS = ["All", "Rides", "Meetups", "Workshops", "Offroad", "Tours", "Venues"];

const PLACEHOLDER_SUGGESTIONS = [
  "Day Ride to Matheran",
  "Sunday Chai & Chains",
  "Bhimashankar Offroad Ride",
  "Midnight Expressway Ride",
  "DIY Maintenance Workshop",
  "Leh Ladakh Expedition",
  "Sinhagad Summit Scramble",
  "FC Road, Pune",
];

// Curated Nitroxx motorcycling & adventure events for trending showcase
const CURATED_TRENDING_ITEMS = [
  {
    id: "trending-1",
    title: "Dirt Diaries — Bhimashankar Gravel & Offroad Ride",
    type: "Offroad",
    categoryTab: "Offroad",
    dateText: "Sat, 25 Jul, 6:00 AM",
    venue: "Manchar Naka, Pune–Nashik Highway",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&auto=format&fit=crop&q=80",
    priceText: "₹1499 onwards",
    throttledText: "18k+ Throttled",
  },
  {
    id: "trending-2",
    title: "Sunday Chai & Chains — Monthly Biker Meetup at FC Road",
    type: "Meetup",
    categoryTab: "Meetups",
    dateText: "Sun, 02 Aug, 7:00 AM",
    venue: "Vaishali Restaurant, FC Road, Pune",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=80",
    priceText: "Free",
    throttledText: "24k+ Throttled",
  },
  {
    id: "trending-3",
    title: "Day Ride to Matheran — Chase the Western Ghats",
    type: "Rides",
    categoryTab: "Rides",
    dateText: "Sun, 09 Aug, 6:00 AM",
    venue: "Balewadi Sports Complex, Pune",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&auto=format&fit=crop&q=80",
    priceText: "₹299 onwards",
    throttledText: "15k+ Throttled",
  },
  {
    id: "trending-4",
    title: "Mumbai–Pune Midnight Expressway Night Ride",
    type: "Rides",
    categoryTab: "Rides",
    dateText: "Fri, 14 Aug, 11:30 PM",
    venue: "Vashi Toll Plaza to Chandani Chowk",
    image: "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=400&auto=format&fit=crop&q=80",
    priceText: "Free",
    throttledText: "12k+ Throttled",
  },
  {
    id: "trending-5",
    title: "Know Your Bike — DIY Motorcycle Maintenance Workshop",
    type: "Workshop",
    categoryTab: "Workshops",
    dateText: "Sat, 22 Aug, 10:00 AM",
    venue: "MotoTech Garage, Baner, Pune",
    image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop&q=80",
    priceText: "₹499 onwards",
    throttledText: "8k+ Throttled",
  },
  {
    id: "trending-6",
    title: "Rooftop Call — Leh Ladakh Motorcycle Expedition 2026",
    type: "Tours",
    categoryTab: "Tours",
    dateText: "Thu, 10 Sep – Sun, 20 Sep",
    venue: "Manali to Leh & Khardung La",
    image: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=400&auto=format&fit=crop&q=80",
    priceText: "₹24,999 onwards",
    throttledText: "32k+ Throttled",
  },
  {
    id: "trending-7",
    title: "Sinhagad Summit Scramble — Hill Climb Challenge",
    type: "Offroad",
    categoryTab: "Offroad",
    dateText: "Sun, 27 Sep, 6:30 AM",
    venue: "Sinhagad Fort Base, Pune",
    image: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=400&auto=format&fit=crop&q=80",
    priceText: "₹350 onwards",
    throttledText: "10k+ Throttled",
  },
  {
    id: "trending-8",
    title: "Vaishali Cafe & Biker Pitstop Lounge",
    type: "Venue",
    categoryTab: "Venues",
    dateText: "Open Daily 6:30 AM – 11:00 PM",
    venue: "FC Road, Deccan Gymkhana, Pune",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=80",
    priceText: "Biker Pitstop",
    throttledText: "Popular Hub",
  },
];

export default function EventSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { events = [] } = useEventsContext();

  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("All");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [city, setCity] = useState(() => localStorage.getItem("selectedCity") || "Pune");

  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleLocationChange = () => {
      const stored = localStorage.getItem("selectedCity");
      if (stored) setCity(stored);
    };
    window.addEventListener("locationChanged", handleLocationChange);
    return () => window.removeEventListener("locationChanged", handleLocationChange);
  }, []);

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

  // Format real Firestore events into unified search item format
  const normalizedLiveEvents = useMemo(() => {
    return events.map((ev) => {
      const title = ev.title || ev.name || "Event";
      const location = ev.venue || ev.location || ev.city || "";
      const image = ev.bannerImage || ev.banner || ev.image || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&auto=format&fit=crop&q=80";

      let dateFormatted = "";
      if (ev.dateTimeText && typeof ev.dateTimeText === "string" && !ev.dateTimeText.includes("T00:00")) {
        dateFormatted = ev.dateTimeText;
      } else {
        const rawDate = ev.date || ev.eventDate || ev.startsAt || ev.startDate;
        if (rawDate) {
          const d = toDate(rawDate);
          if (d && !Number.isNaN(d.getTime())) {
            const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
            dateFormatted = new Intl.DateTimeFormat("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
              ...(hasTime ? { hour: "numeric", minute: "2-digit" } : {}),
            }).format(d);
          }
        }
      }
      if (!dateFormatted && ev.dateText) {
        dateFormatted = ev.dateText;
      }

      // Map to Nitroxx event category tabs
      const catLower = String(ev.category || ev.categoryName || ev.title || "").toLowerCase();
      let categoryTab = "Rides";
      let type = "Ride";
      if (catLower.includes("meetup") || catLower.includes("chai") || catLower.includes("gathering") || catLower.includes("club")) {
        categoryTab = "Meetups";
        type = "Meetup";
      } else if (catLower.includes("workshop") || catLower.includes("clinic") || catLower.includes("maintenance") || catLower.includes("diy")) {
        categoryTab = "Workshops";
        type = "Workshop";
      } else if (catLower.includes("offroad") || catLower.includes("gravel") || catLower.includes("dirt") || catLower.includes("trail") || catLower.includes("mountain")) {
        categoryTab = "Offroad";
        type = "Offroad";
      } else if (catLower.includes("tour") || catLower.includes("expedition") || catLower.includes("ladakh") || catLower.includes("trip")) {
        categoryTab = "Tours";
        type = "Tour";
      } else if (catLower.includes("venue") || catLower.includes("cafe") || catLower.includes("pitstop") || catLower.includes("lounge")) {
        categoryTab = "Venues";
        type = "Venue";
      } else if (catLower.includes("night")) {
        categoryTab = "Rides";
        type = "Night Ride";
      } else {
        categoryTab = "Rides";
        type = "Ride";
      }

      return {
        id: ev.id,
        title,
        type,
        categoryTab,
        dateText: dateFormatted,
        venue: location,
        image,
        priceText: ev.priceText || (ev.price === 0 ? "Free" : ev.price ? `₹${ev.price}` : "Free"),
        throttledText: ev.throttledText || "16k+ Throttled",
        isLive: true,
      };
    });
  }, [events]);

  // Combine live events + curated Nitroxx items
  const allSearchableItems = useMemo(() => {
    return [...normalizedLiveEvents, ...CURATED_TRENDING_ITEMS];
  }, [normalizedLiveEvents]);

  // Filter items based on query and active category tab
  const displayedItems = useMemo(() => {
    let list = allSearchableItems;

    // Filter by category tab
    if (activeTab !== "All") {
      list = list.filter((item) => {
        return (
          item.categoryTab === activeTab ||
          String(item.type).toLowerCase() === activeTab.toLowerCase() ||
          (activeTab === "Rides" && (item.type === "Ride" || item.type === "Night Ride" || item.type === "Day Ride"))
        );
      });
    }

    // Filter by query
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(q);
        const venueMatch = String(item.venue || "").toLowerCase().includes(q);
        const typeMatch = String(item.type || "").toLowerCase().includes(q);
        return titleMatch || venueMatch || typeMatch;
      });
    }

    return list;
  }, [allSearchableItems, activeTab, query]);

  const handleItemClick = (item) => {
    saveRecentSearch(item.title);
    saveRecentlyVisited(item);
    if (item.isLive && item.id && !String(item.id).startsWith("trending-")) {
      navigate(`/event/${item.id}`);
    } else {
      navigate(`/events?search=${encodeURIComponent(item.title)}`);
    }
  };

  const handleRecentSearchClick = (keyword) => {
    handleQueryChange(keyword);
  };

  const placeholderText = `Search for '${PLACEHOLDER_SUGGESTIONS[placeholderIndex]}'`;

  return (
    <div className="ep-search-page">
      {/* Sticky Top Nav Bar ONLY (Back button, Title, and Side Location button) */}
      <header className="ep-search-sticky-nav">
        <div className="ep-search-sticky-nav__inner">
          <button
            type="button"
            className="ep-search-topnav__back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            title="Go back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Back</span>
          </button>

          <h1 className="ep-search-topnav__title">Search Events</h1>

          <div className="ep-search-topnav__city-badge" title={`Current City: ${city}`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff1f1f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{city}</span>
          </div>
        </div>
      </header>

      {/* Main Page Content (Normal Document Flow - Scrolls underneath sticky top nav) */}
      <div className="ep-search-page__inner">
        {/* Search Bar (NOT sticky - scrolls with content) */}
        <div className="ep-search-bar">
          <span className="ep-search-bar__icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff1f1f" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.34-4.34" />
            </svg>
          </span>

          <input
            ref={inputRef}
            type="text"
            className="ep-search-bar__input"
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
              className="ep-search-bar__clear-btn"
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

        {/* Nitroxx Category Tabs (NOT sticky - scrolls with content) */}
        <nav className="ep-search-tabs" aria-label="Event Categories">
          <div className="ep-search-tabs__scroll">
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  className={`ep-search-tab${isActive ? " ep-search-tab--active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Recents Options Section (Recent Searches & Recently Visited Events) */}
        {!query && (recentSearches.length > 0 || recentlyVisited.length > 0) && (
          <section className="ep-search-recents-container">
            {/* Filter Switcher: All Recent | Recent Searches | Recently Visited */}
            <div className="ep-search-recents-switch">
              <button
                type="button"
                className={`ep-search-recents-tab${recentsFilter === "all" ? " ep-search-recents-tab--active" : ""}`}
                onClick={() => setRecentsFilter("all")}
              >
                All Recent
              </button>
              {recentSearches.length > 0 && (
                <button
                  type="button"
                  className={`ep-search-recents-tab${recentsFilter === "searches" ? " ep-search-recents-tab--active" : ""}`}
                  onClick={() => setRecentsFilter("searches")}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Recent Searches ({recentSearches.length})</span>
                </button>
              )}
              {recentlyVisited.length > 0 && (
                <button
                  type="button"
                  className={`ep-search-recents-tab${recentsFilter === "visited" ? " ep-search-recents-tab--active" : ""}`}
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

            {/* 1. Recent Searches Option */}
            {(recentsFilter === "all" || recentsFilter === "searches") && recentSearches.length > 0 && (
              <div className="ep-search-recents-block">
                <div className="ep-search-recents__header">
                  <div className="ep-search-recents__title-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff1f1f" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="ep-search-recents__title">Recent Searches</span>
                  </div>
                  <button
                    type="button"
                    className="ep-search-recents__clear-all"
                    onClick={clearRecentSearches}
                  >
                    Clear all
                  </button>
                </div>

                <div className="ep-search-recents__chips">
                  {recentSearches.map((keyword, index) => (
                    <div
                      key={index}
                      className="ep-search-recent-chip"
                      onClick={() => handleRecentSearchClick(keyword)}
                      role="button"
                      tabIndex={0}
                    >
                      <span className="ep-search-recent-chip__text">{keyword}</span>
                      <button
                        type="button"
                        className="ep-search-recent-chip__remove"
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

            {/* 2. Recently Visited Option */}
            {(recentsFilter === "all" || recentsFilter === "visited") && recentlyVisited.length > 0 && (
              <div className="ep-search-visited-block">
                <div className="ep-search-visited__header">
                  <div className="ep-search-visited__title-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff1f1f" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span className="ep-search-visited__title">Recently Visited Events</span>
                  </div>
                  <button
                    type="button"
                    className="ep-search-visited__clear-all"
                    onClick={clearRecentlyVisited}
                  >
                    Clear all
                  </button>
                </div>

                <div className="ep-search-visited__scroll">
                  {recentlyVisited.map((item) => (
                    <div
                      key={item.id}
                      className="ep-search-visited-card"
                      onClick={() => handleItemClick(item)}
                      role="button"
                      tabIndex={0}
                    >
                      <button
                        type="button"
                        className="ep-search-visited-card__remove"
                        onClick={(e) => removeRecentlyVisitedItem(e, item.id)}
                        aria-label="Remove from visited"
                        title="Remove from history"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>

                      <div className="ep-search-visited-card__thumb-wrap">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="ep-search-visited-card__thumb"
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&auto=format&fit=crop&q=80";
                          }}
                        />
                        {item.type && (
                          <span className="ep-search-visited-card__badge">{item.type}</span>
                        )}
                      </div>

                      <div className="ep-search-visited-card__info">
                        <h4 className="ep-search-visited-card__title" title={item.title}>
                          {item.title}
                        </h4>
                        <div className="ep-search-visited-card__meta">
                          {item.priceText && (
                            <span className="ep-search-visited-card__price">{item.priceText}</span>
                          )}
                          {item.dateText && (
                            <span className="ep-search-visited-card__date">{item.dateText}</span>
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

        {/* Section Heading */}
        <section className="ep-search-content">
          <div className="ep-search-content__header">
            <h2 className="ep-search-content__title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff1f1f" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
              </svg>
              <span>
                {query.trim()
                  ? `Results for "${query}"`
                  : `Trending in ${city || "Pune"}`}
              </span>
            </h2>
            {query.trim() && (
              <span className="ep-search-content__count">
                {displayedItems.length} {displayedItems.length === 1 ? "event" : "events"}
              </span>
            )}
          </div>

          {/* Nitroxx 2-Column Event Grid */}
          {displayedItems.length > 0 ? (
            <div className="ep-search-grid">
              {displayedItems.map((item) => (
                <article
                  key={item.id}
                  className="ep-search-card"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="ep-search-card__thumb-wrap">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="ep-search-card__thumb"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=400&auto=format&fit=crop&q=80";
                      }}
                    />
                  </div>

                  <div className="ep-search-card__body">
                    <h3 className="ep-search-card__title" title={item.title}>
                      {item.title}
                    </h3>
                    <div className="ep-search-card__meta-line">
                      {item.type && (
                        <span className="ep-search-card__type">
                          {item.type}
                        </span>
                      )}
                      {item.priceText && (
                        <span className="ep-search-card__price">
                          • {item.priceText}
                        </span>
                      )}
                    </div>
                    {item.dateText ? (
                      <span className="ep-search-card__date" title={item.dateText}>
                        {item.dateText}
                      </span>
                    ) : item.venue ? (
                      <span className="ep-search-card__date" title={item.venue}>
                        {item.venue}
                      </span>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="ep-search-empty">
              <div className="ep-search-empty__icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff1f1f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.34-4.34" />
                </svg>
              </div>
              <h3 className="ep-search-empty__title">No bike events found</h3>
              <p className="ep-search-empty__desc">
                We couldn't find any events matching "{query}". Try checking your spelling or explore popular ride categories below.
              </p>
              <div className="ep-search-empty__suggestions">
                {["Day Rides", "Night Rides", "Meetups", "Workshops", "Offroad", "Pune"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="ep-search-empty__chip"
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
