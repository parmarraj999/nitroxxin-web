import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useEventsContext } from "../../context/EventsContext";
import { toDate } from "../../utils/dataFormatters";
import "./EventSearchModal.css";

// Filter options tailored for Nitroxx motorcycling & adventure events
const EVENT_FILTER_OPTIONS = [
  { id: "All", label: "All" },
  { id: "Rides", label: "Rides" },
  { id: "Track & Race", label: "Track & Race" },
  { id: "Off-Road", label: "Off-Road" },
  { id: "Workshops", label: "Workshops" },
  { id: "Meetups", label: "Meetups" },
  { id: "Free Entry", label: "Free Entry" },
];

const SEARCH_PLACEHOLDER_SUGGESTIONS = [
  "Namit Malhotra's Ramayana",
  "The Halloween Social",
  "Day Ride to Matheran",
  "Sunday Chai & Chains",
  "Bhimashankar Offroad Ride",
  "DIY Maintenance Workshop",
  "Midnight Expressway Ride",
  "Kari Motor Speedway Track Day",
];

// Curated fallback events matching dark theme and 16:9 banner card aesthetic
const CURATED_FALLBACK_EVENTS = [
  {
    id: "trending-1",
    title: "The Halloween Social — Biker Night",
    type: "Meetup",
    categoryTab: "Meetups",
    dateText: "Sat, 31 Oct, 4:00 PM",
    venue: "District Arena, Sector 3A",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80",
    priceText: "₹499",
    throttledText: "19k+ are Throttled!",
  },
  {
    id: "trending-2",
    title: "Namit Malhotra's Ramayana Ride",
    type: "Rides",
    categoryTab: "Rides",
    dateText: "Sun, 08 Nov, 6:00 AM",
    venue: "Western Ghats Escarpment",
    city: "Mumbai",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80",
    priceText: "Free",
    throttledText: "24k+ are Throttled!",
  },
  {
    id: "trending-3",
    title: "Sunday Chai & Chains — Monthly Biker Meetup",
    type: "Meetup",
    categoryTab: "Meetups",
    dateText: "Sun, 02 Aug, 7:00 AM",
    venue: "Vaishali Cafe, FC Road",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80",
    priceText: "Free",
    throttledText: "16k+ are Throttled!",
  },
  {
    id: "trending-4",
    title: "Bhimashankar Gravel & Offroad Trail",
    type: "Off-Road",
    categoryTab: "Off-Road",
    dateText: "Sat, 14 Nov, 6:30 AM",
    venue: "Manchar Naka Foothills",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=600&auto=format&fit=crop&q=80",
    priceText: "₹1,499",
    throttledText: "14k+ are Throttled!",
  },
  {
    id: "trending-5",
    title: "DIY Maintenance & Chain Care Clinic",
    type: "Workshop",
    categoryTab: "Workshops",
    dateText: "Sun, 22 Nov, 11:00 AM",
    venue: "Nitroxx Garage Hub, Baner",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80",
    priceText: "₹399",
    throttledText: "11k+ are Throttled!",
  },
  {
    id: "trending-6",
    title: "Apex Track Day & Cornering Academy",
    type: "Track & Race",
    categoryTab: "Track & Race",
    dateText: "Sat, 05 Dec, 8:00 AM",
    venue: "Kari Motor Speedway",
    city: "Coimbatore",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
    priceText: "₹3,999",
    throttledText: "28k+ are Throttled!",
  },
  {
    id: "trending-7",
    title: "Sinhagad Summit Scramble Hill Climb",
    type: "Off-Road",
    categoryTab: "Off-Road",
    dateText: "Sun, 13 Dec, 6:00 AM",
    venue: "Sinhagad Fort Base",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=600&auto=format&fit=crop&q=80",
    priceText: "₹350",
    throttledText: "12k+ are Throttled!",
  },
  {
    id: "trending-8",
    title: "Midnight Expressway Night Cruise",
    type: "Rides",
    categoryTab: "Rides",
    dateText: "Fri, 18 Dec, 10:30 PM",
    venue: "Vashi Toll Plaza to Lonavala",
    city: "Mumbai",
    image: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=600&auto=format&fit=crop&q=80",
    priceText: "Free",
    throttledText: "21k+ are Throttled!",
  },
];

function FlameIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#f97316" stroke="#f97316" strokeWidth="1.5">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-.61-.22-1.17-.59-1.61L12 11.5l-.91 1.39c-.37.44-.59 1-.59 1.61z" />
      <path d="M12 2c-1.5 2.5-3 5.5-3 9 0 3.31 2.69 6 6 6 1.48 0 2.83-.54 3.88-1.43C18.66 18.15 16.5 22 12 22 6.48 22 2 17.52 2 12c0-4.5 3.5-8.5 6-10 0 2 1 3.5 2 4.5 0-1.5 1-3.5 2-4.5z" />
    </svg>
  );
}

export default function EventSearchModal({
  isOpen,
  onClose,
  initialQuery = "",
  initialCategory = "All",
}) {
  const navigate = useNavigate();
  const { events = [] } = useEventsContext();

  const [query, setQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState(initialCategory);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored = localStorage.getItem("nitroxx_recent_event_searches");
      return stored ? JSON.parse(stored) : ["Day Ride to Matheran", "Track Day", "Sunday Chai & Chains"];
    } catch {
      return ["Day Ride to Matheran", "Track Day", "Sunday Chai & Chains"];
    }
  });

  const inputRef = useRef(null);

  // Sync initial query when opened
  useEffect(() => {
    if (isOpen) {
      if (initialQuery) setQuery(initialQuery);
      if (initialCategory) setActiveFilter(initialCategory);

      // Lock body scroll
      document.body.style.overflow = "hidden";

      // Focus input with slight delay for modal mount transition
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen, initialQuery, initialCategory]);

  // Rotate animated placeholder when input is empty
  useEffect(() => {
    if (!isOpen || query) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDER_SUGGESTIONS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, query]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Save recent search
  const saveRecentSearch = (text) => {
    if (!text || !text.trim()) return;
    const clean = text.trim();
    setRecentSearches((prev) => {
      const updated = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem("nitroxx_recent_event_searches", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("nitroxx_recent_event_searches");
    } catch {}
  };

  const handleRemoveRecentTerm = (e, termToRemove) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((t) => t !== termToRemove);
      try {
        localStorage.setItem("nitroxx_recent_event_searches", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleRecentTermClick = (term) => {
    setQuery(term);
    saveRecentSearch(term);
    if (inputRef.current) {
      inputRef.current.focus();
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

  const getPriceDisplay = (event) => {
    if (event.priceText) return event.priceText;
    if (event.price === 0) return "Free";
    if (event.price) return `₹${event.price}`;
    return "Free";
  };

  const getLocationDisplay = (event) => {
    return event.venue || event.location || event.city || event.dateText || "India";
  };

  // Normalize live Firestore events
  const normalizedLiveEvents = useMemo(() => {
    if (!events || !events.length) return [];

    return events.map((ev) => {
      const title = ev.title || ev.name || "Event";
      const location = ev.venue || ev.location || ev.city || "";
      const image = ev.banner || ev.bannerImage || ev.image || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80";

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
      let type = "Ride";

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
        dateText: dateFormatted || "Upcoming",
        venue: location,
        city: ev.city || location,
        image,
        price,
        priceText,
        isLive: true,
      };
    });
  }, [events]);

  // Combine live events and curated items
  const allEventsPool = useMemo(() => {
    const liveIds = new Set(normalizedLiveEvents.map((e) => e.id));
    const curatedFiltered = CURATED_FALLBACK_EVENTS.filter((c) => !liveIds.has(c.id));
    return [...normalizedLiveEvents, ...curatedFiltered];
  }, [normalizedLiveEvents]);

  // Filtered events based on query and activeFilter
  const filteredEvents = useMemo(() => {
    let list = allEventsPool;

    // Filter by active pill
    if (activeFilter !== "All") {
      list = list.filter((item) => {
        if (activeFilter === "Free Entry") {
          return item.price === 0 || String(item.priceText || "").toLowerCase().includes("free");
        }
        return (
          item.categoryTab === activeFilter ||
          String(item.type).toLowerCase() === activeFilter.toLowerCase()
        );
      });
    }

    // Filter by search query
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
  }, [allEventsPool, activeFilter, query]);

  const handleSelectEvent = (event) => {
    saveRecentSearch(event.title);
    onClose();
    if (event.isLive && event.id && !String(event.id).startsWith("trending-")) {
      navigate(`/event/${event.id}`);
    } else {
      navigate(`/events/all?search=${encodeURIComponent(event.title)}`);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      onClose();
      const catParam = activeFilter !== "All" ? `&category=${encodeURIComponent(activeFilter)}` : "";
      navigate(`/events/all?search=${encodeURIComponent(query.trim())}${catParam}`);
    }
  };

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const isQueryEmpty = !query.trim();

  // Render modal directly into document.body using Portal for guaranteed center positioning
  return createPortal(
    <div className="nx-search-popup__backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="nx-search-popup__card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button at top right */}
        <button
          type="button"
          className="nx-search-popup__close-btn"
          onClick={onClose}
          aria-label="Close search"
          title="Close (Esc)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* ── Fixed Header Container (Input Bar + Filter Pills) ── */}
        <div className="nx-search-popup__header">
          {/* ── Search Input Bar (Dark Glassmorphic) ── */}
          <form className="nx-search-popup__search-bar" onSubmit={handleSearchSubmit}>
            <div className="nx-search-popup__input-wrap">
              <svg
                className="nx-search-popup__search-icon"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                className="nx-search-popup__input"
                placeholder={`Search for '${SEARCH_PLACEHOLDER_SUGGESTIONS[placeholderIndex]}'`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                spellCheck="false"
              />
              {query && (
                <button
                  type="button"
                  className="nx-search-popup__clear-btn"
                  onClick={() => {
                    setQuery("");
                    if (inputRef.current) inputRef.current.focus();
                  }}
                  aria-label="Clear query"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </form>

          {/* ── Filter Pills Row (Dark Theme) ── */}
          <div className="nx-search-popup__filters-row">
            {EVENT_FILTER_OPTIONS.map((opt) => {
              const isActive = activeFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`nx-search-popup__filter-pill ${isActive ? "is-active" : ""}`}
                  onClick={() => setActiveFilter(opt.id)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="nx-search-popup__body">
          {/* When search input is empty and filter is 'All': Show ONLY Recent Searches & Suggestions (Do NOT show events) */}
          {isQueryEmpty && activeFilter === "All" ? (
            <div className="nx-search-popup__recent-block">
              <div className="nx-search-popup__recent-header">
                <span className="nx-search-popup__section-title">Recent Searches</span>
                {recentSearches.length > 0 && (
                  <button
                    type="button"
                    className="nx-search-popup__clear-all-link"
                    onClick={handleClearRecentSearches}
                  >
                    Clear All
                  </button>
                )}
              </div>

              {recentSearches.length > 0 ? (
                <div className="nx-search-popup__recent-chips">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      className="nx-search-popup__recent-chip"
                      onClick={() => handleRecentTermClick(term)}
                    >
                      <svg
                        className="nx-search-popup__clock-icon"
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span className="nx-search-popup__recent-chip-text">{term}</span>
                      <button
                        type="button"
                        className="nx-search-popup__chip-remove"
                        onClick={(e) => handleRemoveRecentTerm(e, term)}
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#64748b", fontSize: "13.5px", margin: "4px 0 12px 0" }}>
                  No recent searches yet. Search for rallies, tracks, or explore popular topics below.
                </p>
              )}

              {/* Popular Search Suggestions to quickly tap */}
              <div style={{ marginTop: "16px" }}>
                <span className="nx-search-popup__section-title" style={{ fontSize: "14px", color: "#94a3b8" }}>
                  Trending Searches
                </span>
                <div className="nx-search-popup__recent-chips" style={{ marginTop: "8px" }}>
                  {SEARCH_PLACEHOLDER_SUGGESTIONS.slice(0, 5).map((sugg) => (
                    <div
                      key={sugg}
                      className="nx-search-popup__recent-chip"
                      onClick={() => handleRecentTermClick(sugg)}
                      style={{ background: "rgba(99, 102, 241, 0.08)", borderColor: "rgba(99, 102, 241, 0.25)" }}
                    >
                      <span className="nx-search-popup__recent-chip-text" style={{ color: "#c7d2fe" }}>
                        🔍 {sugg}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* When user has typed in search input OR clicked a specific category filter, show filtered events */
            <>
              <div className="nx-search-popup__grid-header">
                <h3 className="nx-search-popup__section-title">
                  {query.trim() ? (
                    <>Results for "{query}" ({filteredEvents.length})</>
                  ) : (
                    <>Category: {activeFilter} ({filteredEvents.length})</>
                  )}
                </h3>
              </div>

              {/* ── 2-Column Grid of Filtered Events ── */}
              {filteredEvents.length > 0 ? (
                <div className="nx-search-popup__grid">
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className="nx-search-popup__event-card"
                      onClick={() => handleSelectEvent(event)}
                    >
                      {/* 16:9 Image Container matching ep-event-card */}
                      <div className="nx-search-popup__card-image-wrap">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="nx-search-popup__card-image"
                          loading="lazy"
                        />
                        {event.type && (
                          <span className="nx-search-popup__card-badge">
                            {event.type}
                          </span>
                        )}
                      </div>

                      {/* Info Block matching ep-event-card */}
                      <div className="nx-search-popup__card-info">
                        <div className="nx-search-popup__card-title-row">
                          <h4 className="nx-search-popup__card-title" title={event.title}>
                            {event.title}
                          </h4>
                          <span className="nx-search-popup__card-price">
                            {getPriceDisplay(event)}
                          </span>
                        </div>

                        <div className="nx-search-popup__card-location">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="nx-search-popup__loc-pin">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span className="nx-search-popup__loc-text">{getLocationDisplay(event)}</span>
                          {event.dateText && <span className="nx-search-popup__dot-sep">•</span>}
                          {event.dateText && <span className="nx-search-popup__date-text">{event.dateText}</span>}
                        </div>

                        <div className="nx-search-popup__card-throttled">
                          <FlameIcon />
                          <span>{getThrottledText(event)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="nx-search-popup__empty">
                  <div className="nx-search-popup__empty-icon">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <line x1="8" y1="11" x2="14" y2="11" />
                    </svg>
                  </div>
                  <h4>No events found for "{query || activeFilter}"</h4>
                  <p>Try searching with another keyword or explore categories like Rides or Track Days.</p>
                  <button
                    type="button"
                    className="nx-search-popup__empty-reset-btn"
                    onClick={() => {
                      setQuery("");
                      setActiveFilter("All");
                      if (inputRef.current) inputRef.current.focus();
                    }}
                  >
                    Reset Search
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
