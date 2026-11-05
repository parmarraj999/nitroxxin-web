import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEventsContext } from "../../../context/EventsContext";
import { useAuth } from "../../../context/AuthContext";
import { toDate, formatPrice } from "../../../utils/dataFormatters";
import "./EventSearch.css";

// Category filter tabs matching MarketplaceSearch structure in Dark Edition
const EVENT_CATEGORY_TABS = [
  "All",
  "Rides",
  "Track & Race",
  "Off-Road",
  "Workshops",
  "Meetups",
  "Free Entry",
];

// Cycling animated search placeholder suggestions
const SEARCH_PLACEHOLDER_SUGGESTIONS = [
  "Day Ride to Matheran",
  "Apex Track Day & Cornering Academy",
  "Sunday Chai & Chains Biker Meetup",
  "Bhimashankar Gravel & Offroad Trail",
  "DIY Maintenance & Chain Care Clinic",
  "Midnight Western Expressway Cruise",
  "The Halloween Social Biker Night",
  "Kari Motor Speedway Track Day",
  "Goa Coastal Monsoon Ride",
  "Royal Enfield Ladakh Expedition Prep",
];

// Cities filter list
const EVENT_CITIES = [
  "All Cities",
  "Pune",
  "Mumbai",
  "Bangalore",
  "Goa",
  "Coimbatore",
];

// Curated high-converting motorsport events for trending showcase & fallback
const CURATED_FALLBACK_EVENTS = [
  {
    id: "trending-1",
    title: "The Halloween Social — Biker Night",
    type: "Meetup",
    category: "Meetup",
    categoryTab: "Meetups",
    dateText: "Sat, 31 Oct, 4:00 PM",
    venue: "District Arena, Sector 3A",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80",
    price: 499,
    priceText: "₹499",
    badge: "Hot Meetup",
    throttledText: "19k+ are Throttled!",
    isTrending: true,
  },
  {
    id: "trending-2",
    title: "Namit Malhotra's Ramayana Ride",
    type: "Rides",
    category: "Rides",
    categoryTab: "Rides",
    dateText: "Sun, 08 Nov, 6:00 AM",
    venue: "Western Ghats Escarpment",
    city: "Mumbai",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80",
    price: 0,
    priceText: "Free",
    badge: "Featured Ride",
    throttledText: "24k+ are Throttled!",
    isTrending: true,
  },
  {
    id: "trending-3",
    title: "Sunday Chai & Chains — Monthly Biker Meetup",
    type: "Meetup",
    category: "Meetup",
    categoryTab: "Meetups",
    dateText: "Sun, 02 Aug, 7:00 AM",
    venue: "Vaishali Cafe, FC Road",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80",
    price: 0,
    priceText: "Free",
    badge: "Free Entry",
    throttledText: "16k+ are Throttled!",
    isTrending: true,
  },
  {
    id: "trending-4",
    title: "Bhimashankar Gravel & Offroad Trail",
    type: "Off-Road",
    category: "Off-Road",
    categoryTab: "Off-Road",
    dateText: "Sat, 14 Nov, 6:30 AM",
    venue: "Manchar Naka Foothills",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=600&auto=format&fit=crop&q=80",
    price: 1499,
    priceText: "₹1,499",
    badge: "Off-Road Adventure",
    throttledText: "14k+ are Throttled!",
    isTrending: true,
  },
  {
    id: "trending-5",
    title: "DIY Maintenance & Chain Care Clinic",
    type: "Workshop",
    category: "Workshop",
    categoryTab: "Workshops",
    dateText: "Sun, 22 Nov, 11:00 AM",
    venue: "Nitroxx Garage Hub, Baner",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80",
    price: 399,
    priceText: "₹399",
    badge: "Workshop",
    throttledText: "11k+ are Throttled!",
    isTrending: true,
  },
  {
    id: "trending-6",
    title: "Apex Track Day & Cornering Academy",
    type: "Track & Race",
    category: "Track & Race",
    categoryTab: "Track & Race",
    dateText: "Sat, 05 Dec, 8:00 AM",
    venue: "Kari Motor Speedway",
    city: "Coimbatore",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
    price: 3999,
    priceText: "₹3,999",
    badge: "Track Day",
    throttledText: "28k+ are Throttled!",
    isTrending: true,
  },
  {
    id: "trending-7",
    title: "Sinhagad Summit Scramble Hill Climb",
    type: "Off-Road",
    category: "Off-Road",
    categoryTab: "Off-Road",
    dateText: "Sun, 13 Dec, 6:00 AM",
    venue: "Sinhagad Fort Base",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=600&auto=format&fit=crop&q=80",
    price: 350,
    priceText: "₹350",
    badge: "Hill Climb",
    throttledText: "12k+ are Throttled!",
    isTrending: true,
  },
  {
    id: "trending-8",
    title: "Midnight Expressway Night Cruise",
    type: "Rides",
    category: "Rides",
    categoryTab: "Rides",
    dateText: "Fri, 18 Dec, 10:30 PM",
    venue: "Vashi Toll Plaza to Lonavala",
    city: "Mumbai",
    image: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=600&auto=format&fit=crop&q=80",
    price: 0,
    priceText: "Free",
    badge: "Night Ride",
    throttledText: "21k+ are Throttled!",
    isTrending: true,
  },
];

export default function EventSearch() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { events = [] } = useEventsContext();

  const initialQuery = searchParams.get("q") || searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "All";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState(initialCategory);
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const inputRef = useRef(null);

  // Auto-focus search input on page mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Cycle animated placeholder text when search query is empty
  useEffect(() => {
    if (query) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDER_SUGGESTIONS.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [query]);

  // Sync query state with URL search params
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
      const stored = localStorage.getItem("nitroxx_recent_event_searches");
      return stored
        ? JSON.parse(stored)
        : ["Day Ride to Matheran", "Track Day", "Sunday Chai & Chains", "Off-Road Trail"];
    } catch {
      return ["Day Ride to Matheran", "Track Day", "Sunday Chai & Chains", "Off-Road Trail"];
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

  const [recentsFilter, setRecentsFilter] = useState("all"); // 'all' | 'searches' | 'visited'

  const saveRecentSearch = (text) => {
    if (!text || !text.trim()) return;
    const clean = text.trim();
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((k) => k.toLowerCase() !== clean.toLowerCase())].slice(0, 10);
      try {
        localStorage.setItem("nitroxx_recent_event_searches", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const saveRecentlyVisited = (event) => {
    if (!event || !event.id) return;
    setRecentlyVisited((prev) => {
      const cardData = {
        id: event.id,
        title: event.title || event.name,
        image: event.image,
        category: event.category || event.type,
        city: event.city || "",
        venue: event.venue || event.location || "",
        dateText: event.dateText || "",
        price: event.price,
        priceText: event.priceText || (event.price === 0 ? "Free" : `₹${event.price}`),
      };
      const updated = [cardData, ...prev.filter((p) => p.id !== event.id)].slice(0, 8);
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
      const updated = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem("nitroxx_recently_visited_events", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleRecentSearchClick = (keyword) => {
    handleQueryChange(keyword);
    saveRecentSearch(keyword);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      saveRecentSearch(query.trim());
    }
  };

  // Helper for throttled text
  const getThrottledText = (event) => {
    if (event.throttledText) return event.throttledText;
    if (event.throttledCount) return `${event.throttledCount} are Throttled!`;
    if (event.throttleCount) return `${event.throttleCount} are Throttled!`;
    if (event.attendeesCount) return `${event.attendeesCount} are Throttled!`;
    const seed = String(event.id || event.title || event.name || "nx")
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const count = (seed % 18) + 2;
    return `${count}k+ are Throttled!`;
  };

  // Normalize live Firestore events and integrate with curated fallback items
  const normalizedEvents = useMemo(() => {
    const liveList = (events || []).map((ev) => {
      const title = ev.title || ev.name || "Event";
      const location = ev.venue || ev.location || ev.city || "";
      const city = ev.city || (location.includes("Pune") ? "Pune" : location.includes("Mumbai") ? "Mumbai" : "");
      const image =
        ev.banner ||
        ev.bannerImage ||
        ev.image ||
        (Array.isArray(ev.images) && ev.images[0]) ||
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80";

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

      const catLower = String(ev.category || ev.categoryName || ev.type || "").toLowerCase();
      let categoryTab = "Rides";
      let type = "Rides";

      if (catLower.includes("track") || catLower.includes("race") || catLower.includes("stunt")) {
        categoryTab = "Track & Race";
        type = "Track & Race";
      } else if (catLower.includes("offroad") || catLower.includes("gravel") || catLower.includes("dirt") || catLower.includes("trail")) {
        categoryTab = "Off-Road";
        type = "Off-Road";
      } else if (catLower.includes("workshop") || catLower.includes("clinic") || catLower.includes("maintenance") || catLower.includes("diy")) {
        categoryTab = "Workshops";
        type = "Workshop";
      } else if (catLower.includes("meetup") || catLower.includes("chai") || catLower.includes("social")) {
        categoryTab = "Meetups";
        type = "Meetup";
      } else {
        categoryTab = "Rides";
        type = "Rides";
      }

      const rawPrice = ev.price ?? 0;
      const numPrice = Number(rawPrice);
      const isFree = numPrice === 0 || String(rawPrice).toLowerCase() === "free";

      return {
        id: ev.id,
        title,
        type,
        category: ev.category || type,
        categoryTab,
        dateText: dateFormatted || "Upcoming Ride",
        venue: ev.venue || ev.location || "Venue TBA",
        city: city || "India",
        image,
        price: isFree ? 0 : numPrice,
        priceText: isFree ? "Free" : formatPrice(numPrice),
        badge: ev.badge || (isFree ? "Free Entry" : "Featured"),
        throttledText: getThrottledText(ev),
        isTrending: Boolean(ev.isTrending || ev.featured),
        description: ev.description || "",
      };
    });

    // Merge live events with curated fallbacks, deduplicating by ID
    const liveIds = new Set(liveList.map((e) => String(e.id)));
    const fallbacksToAdd = CURATED_FALLBACK_EVENTS.filter((e) => !liveIds.has(String(e.id)));

    return [...liveList, ...fallbacksToAdd];
  }, [events]);

  // Filter events by Search Query, Category Tab, and City
  const displayedEvents = useMemo(() => {
    let list = normalizedEvents;
    const cleanQuery = query.trim().toLowerCase();

    // 1. Text Search Filter
    if (cleanQuery) {
      list = list.filter((item) => {
        const titleMatch = (item.title || "").toLowerCase().includes(cleanQuery);
        const catMatch = (item.category || "").toLowerCase().includes(cleanQuery);
        const typeMatch = (item.type || "").toLowerCase().includes(cleanQuery);
        const venueMatch = (item.venue || "").toLowerCase().includes(cleanQuery);
        const cityMatch = (item.city || "").toLowerCase().includes(cleanQuery);
        const descMatch = (item.description || "").toLowerCase().includes(cleanQuery);
        return titleMatch || catMatch || typeMatch || venueMatch || cityMatch || descMatch;
      });
    }

    // 2. Category Tab Filter
    if (activeTab !== "All") {
      if (activeTab === "Free Entry") {
        list = list.filter((item) => item.price === 0 || item.priceText?.toLowerCase() === "free");
      } else {
        list = list.filter(
          (item) =>
            item.categoryTab?.toLowerCase() === activeTab.toLowerCase() ||
            item.category?.toLowerCase() === activeTab.toLowerCase() ||
            item.type?.toLowerCase() === activeTab.toLowerCase()
        );
      }
    }

    // 3. City Filter
    if (selectedCity && selectedCity !== "All Cities") {
      list = list.filter(
        (item) =>
          item.city?.toLowerCase() === selectedCity.toLowerCase() ||
          item.venue?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    return list;
  }, [normalizedEvents, query, activeTab, selectedCity]);

  const handleEventClick = (event) => {
    saveRecentSearch(event.title);
    saveRecentlyVisited(event);
    navigate(`/events/${event.id}`);
  };

  const placeholderText = query ? "" : `Search "${SEARCH_PLACEHOLDER_SUGGESTIONS[placeholderIndex]}"`;

  return (
    <div className="ep-search-page">
      {/* ── STICKY TOP NAVBAR (matching MarketplaceSearch sticky nav in Dark Edition) ── */}
      <header className="ep-search-sticky-nav">
        <div className="ep-search-sticky-nav__inner">
          <button
            type="button"
            className="ep-search-topnav__back-btn"
            onClick={() => navigate("/events")}
            aria-label="Back to Events"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Back</span>
          </button>

          <h1 className="ep-search-topnav__title">Search Events & Rides</h1>

          <div className="ep-search-topnav__right-actions">
            {/* Quick City Dropdown Selector */}
            <select
              className="ep-search-topnav__city-btn"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              aria-label="Filter by City"
            >
              {EVENT_CITIES.map((c) => (
                <option key={c} value={c} style={{ background: "#11141a", color: "#ffffff" }}>
                  📍 {c}
                </option>
              ))}
            </select>

            {/* Quick Link to My Bookings / Orders - only when authenticated */}
            {isAuthenticated && (
              <Link
                to="/profile"
                className="ep-search-topnav__cart-btn"
                title="My Account & Bookings"
                aria-label="My Account"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="ep-search-page__inner">
        {/* Search Bar with cycling placeholder and clear button */}
        <div className="ep-search-bar">
          <span className="ep-search-bar__icon">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ff1f1f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

        {/* Category Tabs (horizontal scrollable) */}
        <nav className="ep-search-tabs" aria-label="Event Categories">
          <div className="ep-search-tabs__scroll">
            {EVENT_CATEGORY_TABS.map((tab) => {
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

        {/* ── RECENTS SECTION (Recent Searches & Recently Visited Events) ── */}
        {!query && (recentSearches.length > 0 || recentlyVisited.length > 0) && (
          <section className="ep-search-recents-container">
            {/* Filter Switcher: All Recent | Recent Searches | Recently Viewed */}
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

            {/* 1. Recent Searches Chips */}
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
                      <span>{keyword}</span>
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
                      onClick={() => handleEventClick(item)}
                      role="button"
                      tabIndex={0}
                    >
                      <button
                        type="button"
                        className="ep-search-visited-card__remove"
                        onClick={(e) => removeRecentlyVisitedItem(e, item.id)}
                        aria-label="Remove from history"
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
                            e.target.src = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80";
                          }}
                        />
                        {item.category && (
                          <span className="ep-search-visited-card__badge">{item.category}</span>
                        )}
                      </div>

                      <div className="ep-search-visited-card__info">
                        <h4 className="ep-search-visited-card__title" title={item.title}>
                          {item.title}
                        </h4>
                        <div className="ep-search-visited-card__meta">
                          <span className="ep-search-visited-card__price">
                            {item.price === 0 ? "Free" : formatPrice(item.price) || item.priceText}
                          </span>
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
                  : selectedCity !== "All Cities"
                  ? `Events in ${selectedCity}`
                  : "Trending Events & Rides"}
              </span>
            </h2>

            <div className="ep-search-content__right-meta">
              <span className="ep-search-content__count">
                {displayedEvents.length} {displayedEvents.length === 1 ? "event" : "events"}
              </span>
              <Link to="/events/all" className="ep-search-content__dir-btn">
                View All Events →
              </Link>
            </div>
          </div>

          {/* Event Cards Grid */}
          {displayedEvents.length > 0 ? (
            <div className="ep-search-grid">
              {displayedEvents.map((item) => {
                const isFree = item.price === 0 || item.priceText?.toLowerCase() === "free";

                return (
                  <article
                    key={item.id}
                    className="ep-event-card"
                    onClick={() => handleEventClick(item)}
                  >
                    <div className="ep-event-card__thumb-wrap">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="ep-event-card__thumb"
                        loading="lazy"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80";
                        }}
                      />

                      {/* Top Badges */}
                      <div className="ep-event-card__top-badges">
                        <span className="ep-event-card__badge-pill">
                          {item.badge || item.type || "Event"}
                        </span>
                        <span className={`ep-event-card__price-pill${isFree ? " is-free" : ""}`}>
                          {isFree ? "Free" : formatPrice(item.price) || item.priceText || "Pass"}
                        </span>
                      </div>
                    </div>

                    <div className="ep-event-card__body">
                      <div className="ep-event-card__category-line">
                        <span className="ep-event-card__category">{item.category || item.type || "Motorsports"}</span>
                        {item.city && (
                          <span
                            className="ep-event-card__venue"
                            title={item.venue ? `${item.venue}, ${item.city}` : item.city}
                          >
                            📍 {item.city}
                          </span>
                        )}
                      </div>

                      <h3 className="ep-event-card__title" title={item.title}>
                        {item.title}
                      </h3>

                      {/* Date Row */}
                      <div className="ep-event-card__date-row">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                          <line x1="16" x2="16" y1="2" y2="6" />
                          <line x1="8" x2="8" y1="2" y2="6" />
                          <line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                        <span className="ep-event-card__date-text">{item.dateText || "Upcoming"}</span>
                      </div>

                      {/* Price & Throttled Row */}
                      <div className="ep-event-card__price-row">
                        <span className="ep-event-card__price">
                          {isFree ? "Free Entry" : formatPrice(item.price) || item.priceText}
                        </span>
                        <span className="ep-event-card__throttled">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="#fb923c" stroke="#fb923c" strokeWidth="1.5">
                            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-.61-.22-1.17-.59-1.61L12 11.5l-.91 1.39c-.37.44-.59 1-.59 1.61z" />
                            <path d="M12 2c-1.5 2.5-3 5.5-3 9 0 3.31 2.69 6 6 6 1.48 0 2.83-.54 3.88-1.43C18.66 18.15 16.5 22 12 22 6.48 22 2 17.52 2 12c0-4.5 3.5-8.5 6-10 0 2 1 3.5 2 4.5 0-1.5 1-3.5 2-4.5z" />
                          </svg>
                          <span>{item.throttledText || "18k+ Throttled"}</span>
                        </span>
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        className="ep-event-card__action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(item);
                        }}
                      >
                        <span>View Details</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="ep-search-empty">
              <img
                src="/assets/images/no-matching.png"
                alt="No matching events found"
                className="ep-search-empty__image"
                loading="lazy"
              />
              <h3 className="ep-search-empty__title">No matching events found</h3>
              <p className="ep-search-empty__desc">
                We couldn't find any events or rides matching "{query}". Try checking your spelling or explore popular categories below.
              </p>
              <div className="ep-search-empty__suggestions">
                {["Day Ride", "Track Day", "Off-Road", "Breakfast Ride", "Workshops", "Mumbai", "Pune", "Free Entry"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="ep-search-empty__chip"
                    onClick={() => {
                      if (tag === "Free Entry") {
                        setActiveTab("Free Entry");
                        handleClearQuery();
                      } else {
                        handleQueryChange(tag);
                      }
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
