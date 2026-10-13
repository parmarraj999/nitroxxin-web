import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEventsContext } from "../../../context/EventsContext";
import { toDate } from "../../../utils/dataFormatters";
import LocationModal from "../../../components/layout/bottomNav/LocationModal";
import "./EventSearch.css";

// Nitroxx Event Categories Tabs (Matching Marketplace category tabs layout)
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
  "Track Day Kari Motor Speedway",
];

// Curated Nitroxx motorcycling & adventure events for trending showcase & fallback
const CURATED_TRENDING_ITEMS = [
  {
    id: "trending-1",
    title: "Dirt Diaries — Bhimashankar Gravel & Offroad Ride",
    type: "Offroad",
    categoryTab: "Offroad",
    dateText: "Sat, 25 Jul, 6:00 AM",
    venue: "Manchar Naka, Pune–Nashik Highway",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=450&auto=format&fit=crop&q=80",
    priceText: "₹1,499 onwards",
    throttledText: "18k+ Throttled",
    badge: "Trending",
  },
  {
    id: "trending-2",
    title: "Sunday Chai & Chains — Monthly Biker Meetup at FC Road",
    type: "Meetup",
    categoryTab: "Meetups",
    dateText: "Sun, 02 Aug, 7:00 AM",
    venue: "Vaishali Restaurant, FC Road, Pune",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=450&auto=format&fit=crop&q=80",
    priceText: "Free",
    throttledText: "24k+ Throttled",
    badge: "Free Entry",
  },
  {
    id: "trending-3",
    title: "Day Ride to Matheran — Chase the Western Ghats",
    type: "Rides",
    categoryTab: "Rides",
    dateText: "Sun, 09 Aug, 6:00 AM",
    venue: "Balewadi Sports Complex, Pune",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=450&auto=format&fit=crop&q=80",
    priceText: "₹299 onwards",
    throttledText: "15k+ Throttled",
    badge: "Top Rated",
  },
  {
    id: "trending-4",
    title: "Mumbai–Pune Midnight Expressway Night Ride",
    type: "Rides",
    categoryTab: "Rides",
    dateText: "Fri, 14 Aug, 10:30 PM",
    venue: "Vashi Toll Plaza to Lonavala",
    city: "Mumbai",
    image: "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=450&auto=format&fit=crop&q=80",
    priceText: "Free",
    throttledText: "31k+ Throttled",
    badge: "Night Ride",
  },
  {
    id: "trending-5",
    title: "DIY Motorcycle Maintenance & Chain Care Clinic",
    type: "Workshops",
    categoryTab: "Workshops",
    dateText: "Sun, 23 Aug, 11:00 AM",
    venue: "Nitroxx Garage Hub, Baner, Pune",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=450&auto=format&fit=crop&q=80",
    priceText: "₹499 onwards",
    throttledText: "9k+ Throttled",
    badge: "Hands-on",
  },
  {
    id: "trending-6",
    title: "Rooftop Call — Leh Ladakh Motorcycle Expedition 2026",
    type: "Tours",
    categoryTab: "Tours",
    dateText: "Thu, 10 Sep – Sun, 20 Sep",
    venue: "Manali to Leh & Khardung La",
    city: "Manali",
    image: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=450&auto=format&fit=crop&q=80",
    priceText: "₹24,999 onwards",
    throttledText: "32k+ Throttled",
    badge: "Bucket List",
  },
  {
    id: "trending-7",
    title: "Sinhagad Summit Scramble — Hill Climb Challenge",
    type: "Offroad",
    categoryTab: "Offroad",
    dateText: "Sun, 27 Sep, 6:30 AM",
    venue: "Sinhagad Fort Base, Pune",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=450&auto=format&fit=crop&q=80",
    priceText: "₹350 onwards",
    throttledText: "10k+ Throttled",
    badge: "Hill Climb",
  },
  {
    id: "trending-8",
    title: "Vaishali Cafe & Biker Pitstop Lounge",
    type: "Venues",
    categoryTab: "Venues",
    dateText: "Open Daily 6:30 AM – 11:00 PM",
    venue: "FC Road, Deccan Gymkhana, Pune",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=450&auto=format&fit=crop&q=80",
    priceText: "Free Entry",
    throttledText: "Popular Hub",
    badge: "Pitstop",
  },
];

export default function EventSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { events = [] } = useEventsContext();

  const initialQuery = searchParams.get("q") || searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "All";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState(initialCategory);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [city, setCity] = useState(() => localStorage.getItem("selectedCity") || "Pune");
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

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

  // Recent searches and recently visited state
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored = localStorage.getItem("nitroxx_recent_event_searches");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [recentlyVisited, setRecentlyVisited] = useState(() => {
    try {
      const stored = localStorage.getItem("nitroxx_recently_visited_events");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [recentsFilter, setRecentsFilter] = useState("all");

  const saveRecentSearch = (text) => {
    if (!text || !text.trim()) return;
    const clean = text.trim();
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 10);
      try {
        localStorage.setItem("nitroxx_recent_event_searches", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const saveRecentlyVisited = (item) => {
    if (!item || !item.id) return;
    setRecentlyVisited((prev) => {
      const updated = [item, ...prev.filter((ev) => ev.id !== item.id)].slice(0, 8);
      try {
        localStorage.setItem("nitroxx_recently_visited_events", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("nitroxx_recent_event_searches");
    } catch {}
  };

  const clearRecentlyVisited = () => {
    setRecentlyVisited([]);
    try {
      localStorage.removeItem("nitroxx_recently_visited_events");
    } catch {}
  };

  const removeRecentSearchItem = (e, keyword) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((k) => k !== keyword);
      try {
        localStorage.setItem("nitroxx_recent_event_searches", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeRecentlyVisitedItem = (e, id) => {
    e.stopPropagation();
    setRecentlyVisited((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem("nitroxx_recently_visited_events", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // When Enter is pressed in search input -> saves search & navigates to all events directory
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      saveRecentSearch(query.trim());
      const catParam = activeTab !== "All" ? `&category=${encodeURIComponent(activeTab)}` : "";
      navigate(`/events/all?search=${encodeURIComponent(query.trim())}${catParam}`);
    }
  };

  // Format real Firestore events into unified search item format
  const normalizedLiveEvents = useMemo(() => {
    return events.map((ev) => {
      const title = ev.title || ev.name || "Event";
      const location = ev.venue || ev.location || ev.city || "";
      const image = ev.bannerImage || ev.banner || ev.image || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=450&auto=format&fit=crop&q=80";

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

      const price = Number(ev.price || ev.ticketPrice || ev.startingPrice || 0);
      const priceText = ev.priceText || (price === 0 ? "Free" : `₹${price.toLocaleString("en-IN")}`);

      return {
        id: ev.id,
        title,
        type,
        categoryTab,
        dateText: dateFormatted,
        venue: location,
        city: ev.city || location,
        image,
        priceText,
        throttledText: ev.throttledText || "16k+ Throttled",
        badge: ev.status === "featured" ? "Featured" : type,
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
        const cityMatch = String(item.city || "").toLowerCase().includes(q);
        return titleMatch || venueMatch || typeMatch || cityMatch;
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
      navigate(`/events/all?search=${encodeURIComponent(item.title)}`);
    }
  };

  const handleRecentSearchClick = (keyword) => {
    handleQueryChange(keyword);
    saveRecentSearch(keyword);
    const catParam = activeTab !== "All" ? `&category=${encodeURIComponent(activeTab)}` : "";
    navigate(`/events/all?search=${encodeURIComponent(keyword)}${catParam}`);
  };

  const handleSelectCity = (newCity) => {
    setCity(newCity);
    localStorage.setItem("selectedCity", newCity);
    window.dispatchEvent(new Event("locationChanged"));
    setIsLocationModalOpen(false);
  };

  const placeholderText = `Search for '${PLACEHOLDER_SUGGESTIONS[placeholderIndex]}'`;

  return (
    <div className="ep-search-page">
      {/* ── STICKY TOP NAVBAR (matching Marketplace Search sticky nav) ── */}
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

          <div className="ep-search-topnav__right-actions">
            <button
              type="button"
              className="ep-search-topnav__city-btn"
              onClick={() => setIsLocationModalOpen(true)}
              title="Change City"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff1f1f" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{city}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT (matching Marketplace Search layout in dark theme) ── */}
      <div className="ep-search-page__inner">
        {/* Search Bar */}
        <div className="ep-search-bar">
          <span className="ep-search-bar__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff1f1f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

        {/* Category Tabs */}
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

        {/* ── RECENTS SECTION (Recent Searches & Recently Visited) ── */}
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

            {/* 1. Recent Searches Block */}
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

            {/* 2. Recently Visited Events Horizontal Carousel */}
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
                            e.target.src = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=450&auto=format&fit=crop&q=80";
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

        {/* ── EVENTS RESULTS SECTION ── */}
        <section className="ep-search-content">
          <div className="ep-search-content__header">
            <h2 className="ep-search-content__title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff1f1f" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
              </svg>
              <span>
                {query.trim()
                  ? `Results for "${query}"`
                  : activeTab !== "All"
                  ? `${activeTab} Events`
                  : `Trending Events in ${city || "Pune"}`}
              </span>
            </h2>

            <div className="ep-search-content__right-meta">
              <span className="ep-search-content__count">
                {displayedItems.length} {displayedItems.length === 1 ? "event" : "events"}
              </span>
              <Link
                to={`/events/all?search=${encodeURIComponent(query.trim())}${activeTab !== "All" ? `&category=${encodeURIComponent(activeTab)}` : ""}`}
                className="ep-search-content__dir-btn"
                title="Open in All Events directory"
              >
                <span>Directory View</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Event Cards Grid (matching MarketplaceSearch 4-column card grid in dark theme) */}
          {displayedItems.length > 0 ? (
            <div className="ep-search-grid">
              {displayedItems.map((item) => (
                <article
                  key={item.id}
                  className="ep-event-card"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="ep-event-card__thumb-wrap">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="ep-event-card__thumb"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=450&auto=format&fit=crop&q=80";
                      }}
                    />

                    {/* Top Badges */}
                    <div className="ep-event-card__top-badges">
                      {item.badge && (
                        <span className="ep-event-card__badge-pill">{item.badge}</span>
                      )}
                      {item.priceText && (
                        <span className={`ep-event-card__price-pill ${item.priceText === "Free" ? "is-free" : ""}`}>
                          {item.priceText}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ep-event-card__body">
                    {/* Category & Venue Line */}
                    <div className="ep-event-card__category-line">
                      <span className="ep-event-card__category">{item.categoryTab || "Rides"}</span>
                      {item.venue && (
                        <span className="ep-event-card__venue" title={item.venue}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span>{item.venue}</span>
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="ep-event-card__title" title={item.title}>
                      {item.title}
                    </h3>

                    {/* Date Row */}
                    {item.dateText && (
                      <div className="ep-event-card__date-row">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                        <span className="ep-event-card__date-text">{item.dateText}</span>
                      </div>
                    )}

                    {/* Price & Throttled Row */}
                    <div className="ep-event-card__price-row">
                      <span className="ep-event-card__price">{item.priceText || "Free"}</span>
                      {item.throttledText && (
                        <div className="ep-event-card__throttled">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#ff8a00">
                            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
                          </svg>
                          <span>{item.throttledText}</span>
                        </div>
                      )}
                    </div>

                    {/* Quick Action Button */}
                    <button
                      type="button"
                      className="ep-event-card__action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(item);
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                      <span>Explore Event</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="ep-search-empty">
              <div className="ep-search-empty__icon">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ff1f1f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.34-4.34" />
                </svg>
              </div>
              <h3 className="ep-search-empty__title">No bike events found</h3>
              <p className="ep-search-empty__desc">
                We couldn't find any events matching "{query}". Try checking your spelling or explore popular ride categories below.
              </p>
              <div className="ep-search-empty__suggestions">
                {["Day Rides", "Night Rides", "Meetups", "Workshops", "Offroad", "Leh Ladakh", "Pune"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="ep-search-empty__chip"
                    onClick={() => {
                      handleQueryChange(tag);
                      saveRecentSearch(tag);
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Location Modal */}
      {isLocationModalOpen && (
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onSelectCity={handleSelectCity}
          currentCity={city}
        />
      )}
    </div>
  );
}
