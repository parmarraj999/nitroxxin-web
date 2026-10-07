import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { useEventsContext } from "../../../context/EventsContext";
import { removeFavoriteEvent } from "../../../services/commerceService";
import { toDate } from "../../../utils/dataFormatters";

// Helper to extract detailed date & time information from various date formats
function extractDateInfo(item) {
  const rawDate = item.date || item.eventDate || item.startsAt || item.startDate || item.dateTime;
  let d = toDate(rawDate);

  if (!d && item.dateText) {
    const parsed = new Date(item.dateText);
    if (!isNaN(parsed.getTime())) d = parsed;
  }
  if (!d && item.dates) {
    const parsed = new Date(item.dates);
    if (!isNaN(parsed.getTime())) d = parsed;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let dayNumber = "1";
  let monthName = "Aug";
  let weekday = "Sunday";
  let relativeLabel = null;
  let isPast = false;
  let isNow = false;
  let groupKey = "group-1";
  let timestamp = 0;

  if (d && !isNaN(d.getTime())) {
    timestamp = d.getTime();
    dayNumber = String(d.getDate());
    monthName = d.toLocaleDateString("en-US", { month: "short" });
    weekday = d.toLocaleDateString("en-US", { weekday: "long" });

    const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const statusLower = String(item.status || "").toLowerCase();

    if (statusLower === "completed" || statusLower === "past" || eventDay < today) {
      isPast = true;
    } else {
      isPast = false;
    }

    if (eventDay.getTime() === today.getTime()) {
      relativeLabel = "Today";
      isNow = true;
    } else if (eventDay.getTime() === tomorrow.getTime()) {
      relativeLabel = "Tomorrow";
    }

    groupKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } else {
    // If date string contains something like "1 Aug" or "2 Aug"
    const textStr = String(item.dates || item.dateText || item.dateTimeText || "");
    const match = textStr.match(/(\d{1,2})\s+([A-Za-z]{3,9})/);
    if (match) {
      dayNumber = match[1];
      monthName = match[2];
      groupKey = `${monthName}-${dayNumber}`;
    }
    const statusLower = String(item.status || "").toLowerCase();
    if (statusLower === "completed" || statusLower === "past") {
      isPast = true;
    }
    if (item.isToday) {
      relativeLabel = "Today";
      isNow = true;
    } else if (item.isTomorrow) {
      relativeLabel = "Tomorrow";
    }
    if (item.weekday) {
      weekday = item.weekday;
    }
  }

  // Format time string
  let timeStr = item.time || item.timeRange || "";
  if (!timeStr && d && !isNaN(d.getTime())) {
    timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (item.duration) {
      timeStr += ` (${item.duration})`;
    }
  }
  if (!timeStr && item.duration) {
    timeStr = item.duration;
  }
  if (!timeStr) {
    timeStr = "3 PM — 5 PM";
  }

  return {
    dateObj: d,
    dayNumber,
    monthName,
    weekday,
    relativeLabel,
    isPast,
    isNow,
    groupKey,
    timestamp,
    timeStr,
  };
}

// Realistic sample events matching reference mockup when user has 0 saved bookmarks yet
function getMockSavedEvents() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const pastDate = new Date(today);
  pastDate.setDate(pastDate.getDate() - 7);

  return [
    {
      id: "mock-saved-1",
      eventId: "mock-saved-1",
      title: "New Member Happy Hour",
      date: new Date(today.getTime() + 15 * 60 * 60 * 1000), // Today 3 PM
      time: "3 PM — 5 PM",
      location: "Zoom",
      hostName: "Claire de Lune",
      hostAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      banner: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
      price: 0,
      spotsLeft: 12,
      category: "Community",
      isOnline: true,
      joinLink: "https://zoom.us",
      isToday: true,
      weekday: today.toLocaleDateString("en-US", { weekday: "long" }),
    },
    {
      id: "mock-saved-2",
      eventId: "mock-saved-2",
      title: "Pitching 101: How to Raise a Seed Round in 5 Steps",
      date: new Date(today.getTime() + 17 * 60 * 60 * 1000), // Today 5 PM
      time: "5 PM — 8 PM",
      location: "Zoom",
      hostName: "Claire de Lune",
      hostAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      banner: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
      price: 499,
      spotsLeft: 7,
      category: "Workshop",
      isOnline: true,
      joinLink: null,
      isToday: true,
      weekday: today.toLocaleDateString("en-US", { weekday: "long" }),
    },
    {
      id: "mock-saved-3",
      eventId: "mock-saved-3",
      title: "Workshop: How to Find Your First 10 Customers",
      date: new Date(tomorrow.getTime() + 18.5 * 60 * 60 * 1000), // Tomorrow 6:30 PM
      time: "6:30 PM — 8 PM",
      location: "Zoom",
      hostName: "Claire de Lune",
      hostAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      banner: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
      price: 0,
      spotsLeft: 24,
      category: "Workshop",
      isOnline: true,
      joinLink: null,
      isTomorrow: true,
      weekday: tomorrow.toLocaleDateString("en-US", { weekday: "long" }),
    },
    {
      id: "mock-saved-4",
      eventId: "mock-saved-4",
      title: "Nitroxx Apex Track Day: Cornering Masterclass",
      date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // In 5 days
      time: "7 AM — 1 PM",
      location: "Buddh International Circuit, Greater Noida",
      hostName: "Nitroxx Racing Academy",
      hostAvatar: null,
      banner: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80",
      price: 2499,
      spotsLeft: 8,
      category: "Track Day",
      isOnline: false,
      joinLink: null,
      weekday: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { weekday: "long" }),
    },
    {
      id: "mock-saved-5",
      eventId: "mock-saved-5",
      title: "Monsoon Ghats Expedition 2026",
      date: pastDate,
      time: "6 AM — 6 PM",
      location: "Lonavala — Lavasa Valley Circuit",
      hostName: "Western Riders Club",
      hostAvatar: null,
      banner: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
      price: 1200,
      spotsLeft: 0,
      category: "Group Ride",
      status: "completed",
      isOnline: false,
      joinLink: null,
      weekday: pastDate.toLocaleDateString("en-US", { weekday: "long" }),
    },
  ];
}

export default function SavedEvents() {
  const { user } = useAuth();
  const { events: contextEvents = [] } = useEventsContext();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming' | 'past'
  const [removedIds, setRemovedIds] = useState([]);
  const [showToast, setShowToast] = useState("");

  // Fetch bookmarks from Firestore
  const { data: savedEventsData, loading: loadingSaved } = useCollection(
    user?.uid ? `users/${user.uid}/saved-events` : null
  );

  const { data: userSingularSavedData } = useCollection(
    user?.uid ? `user/${user.uid}/saved-events` : null
  );

  const { data: bookmarks, loading: loadingBookmarks } = useCollection(
    user?.uid ? `users/${user.uid}/bookmark` : null
  );

  const loading = loadingSaved && loadingBookmarks;

  // Local storage bookmarked IDs
  const localSavedIds = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("nitroxx_bookmarked_events") || "[]");
    } catch {
      return [];
    }
  }, []);

  // Merge Firestore bookmarks, localStorage IDs, and match with context events
  const userBookmarksList = useMemo(() => {
    const map = new Map();

    const addAll = (list) => {
      (list || []).forEach((item) => {
        const key = item.eventId || item.id;
        if (key && !map.has(key)) {
          map.set(key, item);
        }
      });
    };

    addAll(savedEventsData);
    addAll(userSingularSavedData);
    addAll(bookmarks);

    // Also look up any localStorage bookmarks in contextEvents
    localSavedIds.forEach((id) => {
      if (!map.has(id)) {
        const matched = contextEvents.find((e) => e.id === id);
        if (matched) {
          map.set(id, matched);
        }
      }
    });

    return Array.from(map.values());
  }, [savedEventsData, userSingularSavedData, bookmarks, localSavedIds, contextEvents]);

  // If user has zero saved bookmarks, provide realistic demo events so UI is immediately visible
  const isPreviewMode = userBookmarksList.length === 0;

  const rawEventsList = useMemo(() => {
    if (!isPreviewMode) {
      return userBookmarksList;
    }
    return getMockSavedEvents();
  }, [isPreviewMode, userBookmarksList]);

  // Handle Remove Bookmark
  const handleRemoveBookmark = async (eventId, e) => {
    e.preventDefault();
    e.stopPropagation();

    setRemovedIds((prev) => [...prev, eventId]);
    setShowToast("Event removed from saved list");
    setTimeout(() => setShowToast(""), 3500);

    // Update localStorage
    try {
      const local = JSON.parse(localStorage.getItem("nitroxx_bookmarked_events") || "[]");
      localStorage.setItem(
        "nitroxx_bookmarked_events",
        JSON.stringify(local.filter((id) => id !== eventId))
      );
    } catch {
      // ignore
    }

    // Update Firestore if user logged in
    if (user?.uid && eventId) {
      try {
        await removeFavoriteEvent({ userId: user.uid, eventId });
      } catch (err) {
        console.error("Failed to remove saved event from Firestore:", err);
      }
    }
  };

  // Handle Add to Calendar (.ics download)
  const handleAddToCalendar = (event, e) => {
    e.preventDefault();
    e.stopPropagation();

    const title = event.title || "Nitroxx Event";
    const desc = `${title} — Organized by ${event.hostName || "Nitroxx Community"}`;
    const loc = event.location || "Online";

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Nitroxx//Saved Events//EN",
      "BEGIN:VEVENT",
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}`,
      `LOCATION:${loc}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowToast(`Calendar invite downloaded for "${title}"`);
    setTimeout(() => setShowToast(""), 3500);
  };

  // Parse and normalize events
  const parsedEvents = useMemo(() => {
    return rawEventsList
      .filter((item) => {
        const id = item.eventId || item.id;
        return !removedIds.includes(id);
      })
      .map((item) => {
        const eventId = item.eventId || item.id;
        // Check if enriched event exists in contextEvents
        const contextMatch = contextEvents.find((e) => e.id === eventId);
        const merged = contextMatch ? { ...item, ...contextMatch } : item;

        const title = merged.title || merged.name || "Motorcycle Event";
        const location = merged.location || merged.venue || "Zoom";
        const isOnline =
          merged.isOnline ||
          location.toLowerCase().includes("zoom") ||
          location.toLowerCase().includes("online") ||
          location.toLowerCase().includes("virtual");

        const banner =
          merged.banner ||
          merged.image ||
          merged.bannerImage ||
          "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80";

        const price = merged.price !== undefined ? Number(merged.price) : 0;
        const hostName = merged.hostName || merged.organizerName || merged.host || "Claire de Lune";
        const hostAvatar = merged.hostAvatar || merged.organizerAvatar || null;
        const category = merged.category || merged.categoryName || (isOnline ? "Virtual Meetup" : "Community Ride");
        const spotsLeft = merged.spotsLeft ?? (merged.capacity ? Math.max(0, Number(merged.capacity) - Number(merged.registeredCount || 0)) : null);
        const joinLink = merged.joinLink || (isOnline ? "https://zoom.us" : null);

        const dateInfo = extractDateInfo(merged);

        return {
          id: merged.id || eventId,
          eventId,
          title,
          location,
          isOnline,
          banner,
          price,
          hostName,
          hostAvatar,
          category,
          spotsLeft,
          joinLink,
          dateInfo,
        };
      });
  }, [rawEventsList, removedIds, contextEvents]);

  // Counts for tabs
  const upcomingCount = useMemo(() => {
    return parsedEvents.filter((item) => !item.dateInfo.isPast).length;
  }, [parsedEvents]);

  const pastCount = useMemo(() => {
    return parsedEvents.filter((item) => item.dateInfo.isPast).length;
  }, [parsedEvents]);

  // Filter by Tab and Search
  const filteredEvents = useMemo(() => {
    let result = parsedEvents;

    // Tab filter
    if (activeTab === "upcoming") {
      result = result.filter((item) => !item.dateInfo.isPast);
    } else {
      result = result.filter((item) => item.dateInfo.isPast);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.hostName.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [parsedEvents, activeTab, search]);

  // Group events by Date key
  const groupedEvents = useMemo(() => {
    const groupMap = new Map();
    const groups = [];

    filteredEvents.forEach((event) => {
      const key = event.dateInfo.groupKey;
      if (!groupMap.has(key)) {
        const group = {
          key,
          dayNumber: event.dateInfo.dayNumber,
          monthName: event.dateInfo.monthName,
          weekday: event.dateInfo.weekday,
          relativeLabel: event.dateInfo.relativeLabel,
          timestamp: event.dateInfo.timestamp,
          events: [],
        };
        groupMap.set(key, group);
        groups.push(group);
      }
      groupMap.get(key).events.push(event);
    });

    // Chronological sorting: upcoming asc, past desc
    if (activeTab === "upcoming") {
      groups.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    } else {
      groups.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }

    return groups;
  }, [filteredEvents, activeTab]);

  return (
    <div className="nx-saved-events-page-wrap">
      {/* Top Header Row with Back Button, Title & Search Bar */}
      <div className="nx-saved-events-header">
        <div className="nx-saved-events-header-left">
          <Link to="/profile" className="nx-saved-events-back-btn" title="Back to Profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <h1 className="nx-saved-events-title">Saved Events</h1>
        </div>

        {/* Pill Search Input */}
        <div className="nx-saved-events-search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search saved events, hosts, or venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="nx-saved-events-search-input"
          />
          {search && (
            <button
              type="button"
              className="nx-saved-search-clear-btn"
              onClick={() => setSearch("")}
              title="Clear search"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Preview Mode Notification Banner when no user bookmarks exist yet */}
      {isPreviewMode && (
        <div className="nx-saved-preview-banner">
          <div>
            ✨ <strong>Preview Mode:</strong> Displaying reference saved events layout. Bookmark any ride from the
            <Link to="/events" className="nx-saved-preview-link">Events Catalog</Link> to save real rides here!
          </div>
        </div>
      )}

      {/* Temporary Floating Toast Feedback */}
      {showToast && (
        <div
          style={{
            position: "fixed",
            bottom: "32px",
            right: "32px",
            zIndex: 9999,
            background: "#181b22",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "fadeIn 0.2s ease-in-out",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{showToast}</span>
        </div>
      )}

      {/* Tabs Row (Upcoming / Past) matching reference screenshot */}
      <div className="nx-saved-tabs-row">
        <button
          type="button"
          className={`nx-saved-tab-btn ${activeTab === "upcoming" ? "is-active" : ""}`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming
          {upcomingCount > 0 && <span className="nx-saved-tab-badge">{upcomingCount}</span>}
        </button>

        <button
          type="button"
          className={`nx-saved-tab-btn ${activeTab === "past" ? "is-active" : ""}`}
          onClick={() => setActiveTab("past")}
        >
          Past
          {pastCount > 0 && <span className="nx-saved-tab-badge">{pastCount}</span>}
        </button>
      </div>

      {/* Main Content Area */}
      {loading && !parsedEvents.length ? (
        <div className="profile-loading-state">
          <div className="profile-spinner" />
          <p>Loading your saved events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="profile-empty-state">
          <div className="profile-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3>{search ? `No ${activeTab} events matching "${search}"` : `No ${activeTab} events found`}</h3>
          <p>
            {search
              ? "Try adjusting your search keywords or clear the filter to see all events."
              : activeTab === "upcoming"
              ? "You don't have any upcoming saved events. Explore the latest rides and track days to bookmark."
              : "No past events recorded in your saved history."}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
            {search && (
              <button
                type="button"
                className="profile-btn-primary"
                onClick={() => setSearch("")}
                style={{ background: "#2563eb", cursor: "pointer" }}
              >
                Clear Search
              </button>
            )}
            <Link to="/events" className="profile-btn-primary">
              Browse Events
            </Link>
          </div>
        </div>
      ) : (
        /* Timeline Date Grouped List matching reference screenshot */
        <div className="nx-saved-timeline-list">
          {groupedEvents.map((group) => (
            <div className="nx-saved-date-group" key={group.key}>
              {/* Left Date Column matching screenshot */}
              <div className="nx-saved-date-col">
                <div className="nx-saved-date-main">
                  <span className="nx-saved-date-day">{group.dayNumber}</span>
                  <span className="nx-saved-date-month">{group.monthName}</span>
                </div>
                <div className="nx-saved-date-sub">
                  {group.relativeLabel === "Today" ? (
                    <>
                      <span className="nx-saved-date-today">Today, </span>
                      <span className="nx-saved-date-weekday">{group.weekday}</span>
                    </>
                  ) : group.relativeLabel === "Tomorrow" ? (
                    <>
                      <span className="nx-saved-date-tomorrow">Tomorrow, </span>
                      <span className="nx-saved-date-weekday">{group.weekday}</span>
                    </>
                  ) : (
                    <span className="nx-saved-date-weekday">{group.weekday || "Scheduled"}</span>
                  )}
                </div>
              </div>

              {/* Right Big Event Cards Column */}
              <div className="nx-saved-cards-col">
                {group.events.map((event) => {
                  const isZoomOrVirtual = event.isOnline || event.location.toLowerCase().includes("zoom");

                  return (
                    <div className="nx-saved-event-card" key={event.id}>
                      {/* Left Info Area */}
                      <div className="nx-saved-card-left">
                        <div className="nx-saved-card-top">
                          {/* Live/Now Badge or Category Tag */}
                          {event.dateInfo.isNow && activeTab === "upcoming" ? (
                            <span className="nx-badge-now">
                              <span className="nx-badge-dot" /> NOW
                            </span>
                          ) : activeTab === "past" ? (
                            <span className="nx-badge-completed">Completed</span>
                          ) : (
                            <span className="nx-badge-category">
                              {event.category || "Community Event"}
                            </span>
                          )}

                          {/* Event Title */}
                          <h3 className="nx-saved-card-title">
                            <Link to={`/event/${event.eventId || event.id}`}>{event.title}</Link>
                          </h3>

                          {/* Meta Rows (Time, Location, Host) matching screenshot */}
                          <div className="nx-saved-meta-list">
                            {/* Time Row */}
                            <div className="nx-saved-meta-item">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              <span>{event.dateInfo.timeStr}</span>
                            </div>

                            {/* Location / Platform Row */}
                            <div className="nx-saved-meta-item">
                              {isZoomOrVirtual ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="23 7 16 12 23 17 23 7" />
                                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                              )}
                              <span>{event.location}</span>
                            </div>

                            {/* Host Row matching screenshot */}
                            <div className="nx-saved-meta-item">
                              <div className="nx-saved-host-avatar">
                                {event.hostAvatar ? (
                                  <img src={event.hostAvatar} alt={event.hostName} />
                                ) : (
                                  <span>{event.hostName.charAt(0)}</span>
                                )}
                              </div>
                              <span className="nx-saved-host-name">{event.hostName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Row with Relatable UI & Join/Register Action Button */}
                        <div className="nx-saved-card-bottom">
                          {/* Relatable UI in place of attendee avatars */}
                          <div className="nx-saved-relatable-ui">
                            {/* Ticket Price & Spot Tag */}
                            <div className="nx-relatable-ticket-tag" title="Ticket Availability">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <line x1="16" y1="21" x2="16" y2="7" />
                              </svg>
                              <span className="nx-relatable-price">
                                {event.price === 0 ? "Free RSVP" : `₹${event.price.toLocaleString("en-IN")}`}
                              </span>
                              {event.spotsLeft !== null && event.spotsLeft !== undefined && (
                                <span className="nx-relatable-spots">
                                  • {event.spotsLeft > 0 ? `${event.spotsLeft} spots left` : "Filling Fast"}
                                </span>
                              )}
                            </div>

                            {/* Quick Saved/Remove Action Button */}
                            <button
                              type="button"
                              className="nx-relatable-saved-btn"
                              onClick={(e) => handleRemoveBookmark(event.eventId || event.id, e)}
                              title="Click to remove from saved events"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                              </svg>
                              <span>Saved</span>
                            </button>

                            {/* Add to Calendar Button */}
                            <button
                              type="button"
                              className="nx-relatable-cal-btn"
                              onClick={(e) => handleAddToCalendar(event, e)}
                              title="Add to Calendar (.ics download)"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                            </button>
                          </div>

                          {/* Action Button: Join Zoom / Register / View Details */}
                          <div className="nx-saved-action-area">
                            {activeTab === "past" ? (
                              <Link
                                to={`/event/${event.eventId || event.id}`}
                                className="nx-saved-past-btn"
                              >
                                View Details
                              </Link>
                            ) : event.joinLink || isZoomOrVirtual ? (
                              <a
                                href={event.joinLink || "https://zoom.us"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="nx-saved-join-btn"
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="23 7 16 12 23 17 23 7" />
                                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                </svg>
                                Join Zoom
                              </a>
                            ) : (
                              <Link
                                to={`/event/${event.eventId || event.id}`}
                                className="nx-saved-register-btn"
                              >
                                Register
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Banner Image Box matching screenshot */}
                      <div className="nx-saved-card-banner-box">
                        <Link to={`/event/${event.eventId || event.id}`} title={event.title}>
                          <img
                            src={event.banner}
                            alt={event.title}
                            className="nx-saved-card-banner-img"
                            loading="lazy"
                          />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
