import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useEventsContext } from "../../context/EventsContext";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../AuthModal/useAuthModal";
import { toDate } from "../../utils/dataFormatters";
import "./EventSearchModal.css";

// ── POPULAR EVENT SEARCHES (Curated top trending motorcycle events) ──
const POPULAR_EVENT_SEARCHES = [
  "Kari Motor Speedway Track Day",
  "The Halloween Social Biker Night",
  "Day Ride to Matheran",
  "Sunday Chai & Chains Meetup",
  "Bhimashankar Offroad Trail",
  "DIY Maintenance & Chain Care Clinic",
  "Midnight Expressway Cruise",
  "Apex Cornering Academy",
  "Western Ghats Monsoon Tour",
  "Free Entry Meetups",
];

// ── CURATED FALLBACK EVENTS (Motorcycle & Adventure events matching 1:1 card style) ──
const FALLBACK_POPUP_EVENTS = [
  {
    id: "pop-ev-1",
    title: "Apex Track Day & Cornering Academy",
    organizer: "Nitroxx Racing",
    category: "Track & Race",
    price: 3999,
    priceText: "₹3,999",
    dateText: "Sat, 05 Dec, 8:00 AM",
    venue: "Kari Motor Speedway",
    city: "Coimbatore",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "pop-ev-2",
    title: "The Halloween Social — Biker Night",
    organizer: "Nitroxx Moto",
    category: "Meetups",
    price: 499,
    priceText: "₹499",
    dateText: "Sat, 31 Oct, 4:00 PM",
    venue: "District Arena, Sector 3A",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "pop-ev-3",
    title: "Namit Malhotra's Ramayana Ride",
    organizer: "Nitroxx Touring",
    category: "Rides",
    price: 0,
    priceText: "Free",
    dateText: "Sun, 08 Nov, 6:00 AM",
    venue: "Western Ghats Escarpment",
    city: "Mumbai",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "pop-ev-4",
    title: "Sunday Chai & Chains — Monthly Biker Meetup",
    organizer: "Nitroxx Pune Club",
    category: "Meetups",
    price: 0,
    priceText: "Free",
    dateText: "Sun, 02 Aug, 7:00 AM",
    venue: "Vaishali Cafe, FC Road",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "pop-ev-5",
    title: "Bhimashankar Gravel & Offroad Trail",
    organizer: "Mud Thrashers",
    category: "Off-Road",
    price: 1499,
    priceText: "₹1,499",
    dateText: "Sat, 14 Nov, 6:30 AM",
    venue: "Manchar Naka Foothills",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "pop-ev-6",
    title: "DIY Maintenance & Chain Care Clinic",
    organizer: "Nitroxx Garage",
    category: "Workshops",
    price: 399,
    priceText: "₹399",
    dateText: "Sun, 22 Nov, 11:00 AM",
    venue: "Nitroxx Garage Hub, Baner",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "pop-ev-7",
    title: "Midnight Expressway Night Cruise",
    organizer: "Night Riders Mumbai",
    category: "Rides",
    price: 0,
    priceText: "Free",
    dateText: "Fri, 18 Dec, 10:30 PM",
    venue: "Vashi Toll Plaza to Lonavala",
    city: "Mumbai",
    image: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "pop-ev-8",
    title: "Sinhagad Summit Scramble Hill Climb",
    organizer: "Sahyadri Riders",
    category: "Off-Road",
    price: 350,
    priceText: "₹350",
    dateText: "Sun, 13 Dec, 6:00 AM",
    venue: "Sinhagad Fort Base",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "pop-ev-9",
    title: "Monsoon Mist Ride to Lavasa Hills",
    organizer: "Nitroxx Moto",
    category: "Rides",
    price: 0,
    priceText: "Free",
    dateText: "Sun, 20 Dec, 6:00 AM",
    venue: "Chandani Chowk to Lavasa",
    city: "Pune",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "pop-ev-10",
    title: "Pro Braking & Trail Braking Masterclass",
    organizer: "Nitroxx Academy",
    category: "Workshops",
    price: 1899,
    priceText: "₹1,899",
    dateText: "Sat, 26 Dec, 9:00 AM",
    venue: "Aruani Grid Circuit",
    city: "Bangalore",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "pop-ev-11",
    title: "Rann of Kutch Winter Expedition",
    organizer: "Nomad Bikers",
    category: "Rides",
    price: 18499,
    priceText: "₹18,499",
    dateText: "10-15 Jan 2027",
    venue: "White Desert",
    city: "Bhuj",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "pop-ev-12",
    title: "Throttle Thursday Bikers Coffee Meet",
    organizer: "Nitroxx Club",
    category: "Meetups",
    price: 0,
    priceText: "Free",
    dateText: "Thu, 07 Jan, 8:00 PM",
    venue: "Starbucks, Bandra",
    city: "Mumbai",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop&q=80",
  },
];

export default function EventSearchModal({
  isOpen,
  onClose,
  searchQuery: propQuery,
  initialQuery = "",
  onSearchChange,
  onSearchSubmit,
  inputRef,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { events = [] } = useEventsContext();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  const [localQuery, setLocalQuery] = useState(propQuery !== undefined ? propQuery : initialQuery);
  const [wishlist, setWishlist] = useState(() => {
    try {
      const stored = localStorage.getItem("nitroxx_event_wishlist");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });
  const [addedEvents, setAddedEvents] = useState({});
  const popupRef = useRef(null);
  const internalInputRef = useRef(null);

  // Sync propQuery or initialQuery
  useEffect(() => {
    if (propQuery !== undefined) {
      setLocalQuery(propQuery);
    } else if (initialQuery) {
      setLocalQuery(initialQuery);
    }
  }, [propQuery, initialQuery]);

  const activeQuery = propQuery !== undefined ? propQuery : localQuery;

  // Recent searches state persisted to localStorage
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored = localStorage.getItem("nitroxx_recent_event_searches");
      return stored
        ? JSON.parse(stored)
        : ["Track Day", "Day Ride to Matheran", "Sunday Chai & Chains"];
    } catch {
      return ["Track Day", "Day Ride to Matheran", "Sunday Chai & Chains"];
    }
  });

  // Save recent search term
  const saveRecentSearch = (text) => {
    if (!text || !text.trim()) return;
    const clean = text.trim();
    setRecentSearches((prev) => {
      const updated = [
        clean,
        ...prev.filter((k) => k.toLowerCase() !== clean.toLowerCase()),
      ].slice(0, 8);
      try {
        localStorage.setItem("nitroxx_recent_event_searches", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Auto-save user's typed search query after typing pause
  useEffect(() => {
    const trimmed = (activeQuery || "").trim();
    if (trimmed.length < 2) return;

    const timer = setTimeout(() => {
      saveRecentSearch(trimmed);
    }, 900);

    return () => clearTimeout(timer);
  }, [activeQuery]);

  const removeRecentSearch = (e, textToRemove) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((k) => k.toLowerCase() !== textToRemove.toLowerCase());
      try {
        localStorage.setItem("nitroxx_recent_event_searches", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllRecentSearches = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem("nitroxx_recent_event_searches");
    } catch {}
  };

  const handleQueryChange = (val) => {
    setLocalQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (popupRef.current && popupRef.current.contains(e.target)) {
        return;
      }
      if (inputRef?.current && inputRef.current.contains(e.target)) {
        return;
      }
      if (e.target.closest && e.target.closest(".navbar-search-bar")) {
        return;
      }
      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    // Prevent background scrolling on mobile when open
    const prevOverflow = document.body.style.overflow;
    if (window.innerWidth <= 840) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, inputRef]);

  // Focus internal mobile search input when opened on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth <= 840) {
      const timer = setTimeout(() => {
        if (internalInputRef.current) {
          internalInputRef.current.focus();
        }
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Normalize live Firestore events
  const normalizedEvents = useMemo(() => {
    const live = (events || []).filter((e) => {
      const st = String(e.status || "published").toLowerCase();
      return st === "published" || st === "active" || st === "approved";
    });

    const mapped = live.map((e) => {
      const title = e.title || e.name || "Motorcycle Event";
      const organizer =
        e.organizer || e.host || e.vendorName || e.clubName || e.brand || "Nitroxx Moto";
      const category = e.category || e.categoryName || e.type || "Rides";
      const price = Number(e.price ?? e.ticketPrice ?? e.startingPrice ?? 0);
      const priceText =
        e.priceText || (price === 0 ? "Free" : `₹${price.toLocaleString("en-IN")}`);
      const image =
        e.banner ||
        e.bannerImage ||
        e.image ||
        e.media?.galleryImages?.[0] ||
        FALLBACK_POPUP_EVENTS[0].image;

      let dateText = e.dateTimeText || e.dateText || "";
      if (!dateText && e.date) {
        const d = toDate(e.date);
        if (d && !Number.isNaN(d.getTime())) {
          dateText = new Intl.DateTimeFormat("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
          }).format(d);
        }
      }

      return {
        id: e.id,
        title,
        name: title,
        organizer,
        category,
        price,
        priceText,
        dateText: dateText || "Upcoming",
        venue: e.venue || e.location || "",
        city: e.city || "",
        image,
        isLive: true,
      };
    });

    const liveIds = new Set(mapped.map((m) => m.id));
    const fallbackFiltered = FALLBACK_POPUP_EVENTS.filter((f) => !liveIds.has(f.id));
    return [...mapped, ...fallbackFiltered];
  }, [events]);

  // Filter events based on activeQuery (strictly max 20 events)
  const filteredEvents = useMemo(() => {
    const q = (activeQuery || "").trim().toLowerCase();
    let list = normalizedEvents;

    if (q) {
      const words = q.split(/\s+/).filter(Boolean);
      list = list.filter((item) => {
        const text = [
          item.title,
          item.name,
          item.organizer,
          item.category,
          item.venue,
          item.city,
          item.dateText,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return words.every((w) => text.includes(w));
      });
    }

    return list.slice(0, 20);
  }, [normalizedEvents, activeQuery]);

  // Navigate to full events search or page
  const handleGoToEvents = (queryToUse) => {
    const term = (queryToUse !== undefined ? queryToUse : activeQuery).trim();
    if (term) {
      saveRecentSearch(term);
    }
    if (onSearchSubmit) {
      onSearchSubmit(term);
    } else {
      if (term) {
        navigate(`/events/all?search=${encodeURIComponent(term)}`);
      } else {
        navigate("/events/all");
      }
      onClose();
    }
  };

  const handleSelectEvent = (event) => {
    saveRecentSearch(event.title || event.name);
    onClose();
    if (event.isLive && event.id && !String(event.id).startsWith("pop-ev-")) {
      navigate(`/event/${event.id}`);
    } else {
      navigate(`/events/all?search=${encodeURIComponent(event.title || event.name)}`);
    }
  };

  const toggleWishlist = (e, eventId) => {
    e.stopPropagation();
    setWishlist((prev) => {
      const updated = { ...prev, [eventId]: !prev[eventId] };
      try {
        localStorage.setItem("nitroxx_event_wishlist", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleQuickAction = (e, event) => {
    e.stopPropagation();
    setAddedEvents((prev) => ({ ...prev, [event.id]: true }));
    saveRecentSearch(event.title || event.name);
    setTimeout(() => {
      setAddedEvents((prev) => ({ ...prev, [event.id]: false }));
    }, 1800);
  };

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const hasQuery = Boolean(activeQuery && activeQuery.trim());

  // Determine if Navbar is visible on this route
  const isNavbarVisible =
    !location.pathname.startsWith("/events/search") &&
    !location.pathname.startsWith("/event/") &&
    !location.pathname.includes("/accessories") &&
    !location.pathname.includes("/shop") &&
    !location.pathname.includes("/events/upcoming") &&
    !location.pathname.includes("/events/near-you") &&
    !location.pathname.includes("/profile") &&
    !location.pathname.includes("/product") &&
    !location.pathname.includes("/cart");

  return createPortal(
    <>
      {/* ── Fixed Backdrop (Dark theme glassmorphism) ── */}
      <div
        className={`esp-backdrop ${!isNavbarVisible ? "is-standalone" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Main Popup Modal: 90vw width, 86vh height, Dark Theme ── */}
      <div
        className={`esp-popup-container ${hasQuery ? "has-query" : "is-empty-query"} ${
          !isNavbarVisible ? "is-standalone" : ""
        }`}
        ref={popupRef}
        role="dialog"
        aria-modal="true"
      >
        {/* Mobile Top Header (Screens <= 840px) or Standalone Desktop Header */}
        <div className="esp-topbar">
          <button
            type="button"
            className="esp-topbar__back-btn"
            onClick={onClose}
            aria-label="Close search"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
          </button>

          <div className="esp-topbar__input-wrap">
            <span
              className="esp-topbar__search-icon"
              onClick={() => handleGoToEvents(activeQuery)}
              title="Search in Events"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.34-4.34" />
              </svg>
            </span>
            <input
              ref={internalInputRef}
              type="text"
              className="esp-topbar__input"
              value={activeQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleGoToEvents(activeQuery);
              }}
              placeholder="Search events, rides, meetups..."
              autoFocus
            />
            {activeQuery && (
              <button
                type="button"
                className="esp-topbar__clear-btn"
                onClick={() => handleQueryChange("")}
                aria-label="Clear query"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            className="esp-topbar__close-btn"
            onClick={onClose}
            aria-label="Close search"
          >
            ✕
          </button>
        </div>

        {/* Desktop Close Button (Floating top-right) */}
        <button
          type="button"
          className="esp-desktop-close-btn"
          onClick={onClose}
          aria-label="Close search"
          title="Close (Esc)"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Desktop & Mobile Responsive Body */}
        <div className="esp-body">
          {/* ════ LEFT COLUMN: RECENT & POPULAR SEARCHES (310px width) ════ */}
          <div className="esp-left-col">
            {/* 1. RECENT SEARCHES */}
            <div className="esp-section">
              <div className="esp-section__header esp-section__header--flex">
                <span className="esp-section__title">RECENT SEARCHES</span>
                {recentSearches.length > 0 && (
                  <button
                    type="button"
                    className="esp-clear-all-link"
                    onClick={clearAllRecentSearches}
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="esp-recent-chips">
                {recentSearches.length > 0 ? (
                  recentSearches.map((chip, idx) => (
                    <div key={idx} className="esp-chip-wrap">
                      <button
                        type="button"
                        className="esp-chip"
                        onClick={() => {
                          handleQueryChange(chip);
                          saveRecentSearch(chip);
                        }}
                      >
                        <span>{chip}</span>
                      </button>
                      <button
                        type="button"
                        className="esp-chip-delete"
                        onClick={(e) => removeRecentSearch(e, chip)}
                        title="Remove"
                        aria-label="Remove search term"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <span className="esp-empty-recents">No recent searches yet</span>
                )}
              </div>
            </div>

            {/* 2. POPULAR SEARCHES */}
            <div className="esp-section esp-section--popular">
              <div className="esp-section__header">
                <span className="esp-section__title">POPULAR SEARCHES</span>
              </div>
              <div className="esp-popular-list">
                {POPULAR_EVENT_SEARCHES.map((queryText, idx) => (
                  <div
                    key={idx}
                    className="esp-popular-row"
                    onClick={() => {
                      handleQueryChange(queryText);
                      saveRecentSearch(queryText);
                    }}
                  >
                    <div className="esp-popular-row__left">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="esp-popular-row__icon"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.34-4.34" />
                      </svg>
                      <span className="esp-popular-row__text">{queryText}</span>
                    </div>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="esp-popular-row__arrow"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile-only shortcut banner to browse all events */}
            <div className="esp-mobile-browse-card">
              <div className="esp-mobile-browse-info">
                <span className="esp-mobile-browse-badge">NITROXX EXPERIENCES</span>
                <h4 className="esp-mobile-browse-title">Explore All Live Events & Rides</h4>
              </div>
              <button
                type="button"
                className="esp-mobile-browse-btn"
                onClick={() => handleGoToEvents("")}
              >
                Browse All →
              </button>
            </div>
          </div>

          {/* ════ RIGHT COLUMN: 4-COLUMN EVENT GRID (MAX 20 EVENTS) ════ */}
          <div className="esp-right-col">
            <div className="esp-right-header">
              <span className="esp-section__title">
                {hasQuery
                  ? `SEARCH RESULTS (${filteredEvents.length})`
                  : "RECOMMENDED EVENTS"}
              </span>

              {/* View all in Events button */}
              <button
                type="button"
                className="esp-see-all-btn"
                onClick={() => handleGoToEvents(activeQuery)}
                title="View all in Events"
              >
                <span>View all in Events</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>

            {filteredEvents.length > 0 ? (
              <div className="esp-event-grid">
                {filteredEvents.map((event) => {
                  const isWishlisted = Boolean(wishlist[event.id]);
                  const isAdded = Boolean(addedEvents[event.id]);

                  return (
                    <div
                      key={event.id}
                      className="esp-event-card"
                      onClick={() => handleSelectEvent(event)}
                    >
                      {/* Event Image Box: Square 1:1, centered cover image */}
                      <div className="esp-event-card__img-box">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="esp-event-card__img"
                          loading="lazy"
                        />

                        {/* Heart Wishlist Icon (Top-right) */}
                        <button
                          type="button"
                          className={`esp-event-card__heart${
                            isWishlisted ? " is-active" : ""
                          }`}
                          onClick={(e) => toggleWishlist(e, event.id)}
                          aria-label="Save Event"
                          title="Bookmark Event"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill={isWishlisted ? "#ff1f1f" : "none"}
                            stroke={isWishlisted ? "#ff1f1f" : "#ffffff"}
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                          </svg>
                        </button>

                        {/* Quick Action (+) Button in bottom-right */}
                        <button
                          type="button"
                          className={`esp-event-card__add-btn${
                            isAdded ? " is-added" : ""
                          }`}
                          onClick={(e) => handleQuickAction(e, event)}
                          aria-label="Quick Action"
                          title="Save or RSVP"
                        >
                          {isAdded ? (
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#111111"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 5v14" />
                              <path d="M5 12h14" />
                            </svg>
                          )}
                        </button>
                      </div>

                      {/* Event Info below image */}
                      <div className="esp-event-card__info">
                        <span
                          className="esp-event-card__brand"
                          title={event.organizer || event.category}
                        >
                          {event.organizer || event.category}
                        </span>

                        <h4 className="esp-event-card__name" title={event.title}>
                          {event.title}
                        </h4>

                        <div className="esp-event-card__price-row">
                          <span
                            className={`esp-event-card__price ${
                              event.price === 0 ? "is-free" : ""
                            }`}
                          >
                            {event.priceText || (event.price === 0 ? "Free" : `₹${event.price}`)}
                          </span>

                          {event.dateText && (
                            <span className="esp-event-card__date" title={event.dateText}>
                              {event.dateText.split(",")[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="esp-no-results">
                <div className="esp-no-results__icon">
                  <svg
                    width="42"
                    height="42"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#71717a"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3 className="esp-no-results__title">
                  No events found matching "{activeQuery}"
                </h3>
                <p className="esp-no-results__desc">
                  Try searching with different keywords like 'Track Day', 'Night Ride', or 'Pune'.
                </p>
                <button
                  type="button"
                  className="esp-no-results__btn"
                  onClick={() => handleGoToEvents("")}
                >
                  Explore All Events →
                </button>
              </div>
            )}

            {/* Prompt when 20 events reached */}
            {filteredEvents.length >= 20 && (
              <div className="esp-right-footer">
                <span>Showing top 20 event matches.</span>
                <button
                  type="button"
                  className="esp-footer-link"
                  onClick={() => handleGoToEvents(activeQuery)}
                >
                  Click here or press Enter to view all in Events →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
