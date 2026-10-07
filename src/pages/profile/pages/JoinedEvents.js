import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { useEventsContext } from "../../../context/EventsContext";
import { COLLECTIONS } from "../../../services/firebase";
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
    timeStr = "7:00 AM — 11:30 AM";
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

// Realistic sample joined events when user has 0 registrations yet
function getMockJoinedEvents() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const pastDate = new Date(today);
  pastDate.setDate(pastDate.getDate() - 10);

  return [
    {
      id: "mock-joined-1",
      eventId: "mock-joined-1",
      bookingId: "NX-PASS-9082",
      title: "Nitroxx Season Kickoff: Morning Breakfast Ride",
      date: new Date(today.getTime() + 7 * 60 * 60 * 1000), // Today 7 AM
      time: "7:00 AM — 11:30 AM",
      location: "Expressway Hub — Sunny's Tollgate Cafe",
      hostName: "Nitroxx Chapter Lead",
      hostAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      banner: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
      price: 650,
      ticketsCount: 2,
      category: "Breakfast Ride",
      status: "confirmed",
      isToday: true,
      weekday: today.toLocaleDateString("en-US", { weekday: "long" }),
    },
    {
      id: "mock-joined-2",
      eventId: "mock-joined-2",
      bookingId: "NX-PASS-6419",
      title: "Apex Track Clinic: Level 2 Cornering & Trail Braking",
      date: new Date(today.getTime() + 15 * 60 * 60 * 1000), // Today 3 PM
      time: "3:00 PM — 6:00 PM",
      location: "Buddh International Circuit (BIC), Pit Garage 4",
      hostName: "Claire de Lune",
      hostAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      banner: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80",
      price: 3499,
      ticketsCount: 1,
      category: "Track Clinic",
      status: "confirmed",
      isToday: true,
      weekday: today.toLocaleDateString("en-US", { weekday: "long" }),
    },
    {
      id: "mock-joined-3",
      eventId: "mock-joined-3",
      bookingId: "NX-PASS-4712",
      title: "Virtual Route Masterclass: GPS Trails & Offroad Navigation",
      date: new Date(tomorrow.getTime() + 18 * 60 * 60 * 1000), // Tomorrow 6 PM
      time: "6:00 PM — 7:30 PM",
      location: "Zoom",
      hostName: "Claire de Lune",
      hostAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      banner: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
      price: 0,
      ticketsCount: 1,
      category: "Workshop",
      isOnline: true,
      joinLink: "https://zoom.us",
      isTomorrow: true,
      weekday: tomorrow.toLocaleDateString("en-US", { weekday: "long" }),
    },
    {
      id: "mock-joined-4",
      eventId: "mock-joined-4",
      bookingId: "NX-PASS-2104",
      title: "Western Ghats Monsoon Odyssey 2026",
      date: pastDate,
      time: "5:30 AM — 7:00 PM",
      location: "Tamhini Ghat to Mahabaleshwar",
      hostName: "Western Riders Club",
      hostAvatar: null,
      banner: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
      price: 1800,
      ticketsCount: 1,
      category: "Adventure Tour",
      status: "completed",
      isOnline: false,
      joinLink: null,
      weekday: pastDate.toLocaleDateString("en-US", { weekday: "long" }),
    },
  ];
}

export default function JoinedEvents() {
  const { user } = useAuth();
  const { events: contextEvents = [] } = useEventsContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("upcoming"); // 'upcoming' | 'past'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showToast, setShowToast] = useState("");

  const { data: bookingsData, loading: loadingBookings } = useCollection(COLLECTIONS.bookings, {
    where: user?.uid ? [["userId", "==", user.uid]] : [["userId", "==", "NO_USER"]],
    limit: 50,
  });

  const { data: singleBookingData } = useCollection("booking", {
    where: user?.uid ? [["userId", "==", user.uid]] : [["userId", "==", "NO_USER"]],
    limit: 50,
  });

  const { data: savedEventsData, loading: loadingSaved } = useCollection(
    user?.uid ? `users/${user.uid}/saved-events` : null
  );

  const { data: userSingularSavedData } = useCollection(
    user?.uid ? `user/${user.uid}/saved-events` : null
  );

  const { data: myEventsData } = useCollection(
    user?.uid ? `users/${user.uid}/my-events` : null
  );

  const { data: joinedEventsData, loading: loadingJoined } = useCollection(
    user?.uid ? `users/${user.uid}/joined-event` : null
  );

  const loading = (loadingBookings || loadingJoined) && user?.uid;

  // Deduplicate and merge user bookings/joined events
  const userJoinedList = useMemo(() => {
    const map = new Map();

    const addEvents = (list) => {
      (list || []).forEach((item) => {
        const id = item.bookingId || item.eventId || item.id;
        if (id && !map.has(id)) {
          map.set(id, {
            ...item,
            eventSnapshot: item.eventSnapshot || item.data || item,
          });
        }
      });
    };

    addEvents(joinedEventsData);
    addEvents(bookingsData);
    addEvents(singleBookingData);
    addEvents(myEventsData);
    addEvents(savedEventsData);
    addEvents(userSingularSavedData);

    return Array.from(map.values());
  }, [joinedEventsData, bookingsData, singleBookingData, myEventsData, savedEventsData, userSingularSavedData]);

  // Preview mode toggle if user hasn't registered for any events yet
  const isPreviewMode = userJoinedList.length === 0;

  const rawEventsList = useMemo(() => {
    if (!isPreviewMode) {
      return userJoinedList;
    }
    return getMockJoinedEvents();
  }, [isPreviewMode, userJoinedList]);

  // Handle Add to Calendar (.ics download)
  const handleAddToCalendar = (event, e) => {
    e.preventDefault();
    e.stopPropagation();

    const title = event.title || "Nitroxx Ride";
    const desc = `${title} — Booking Pass: ${event.bookingId || "Verified"}\nOrganized by ${event.hostName || "Nitroxx Community"}`;
    const loc = event.location || "Venue TBA";

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Nitroxx//Joined Events//EN",
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
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}_Pass.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setShowToast(`Calendar invite downloaded for "${title}"`);
    setTimeout(() => setShowToast(""), 3500);
  };

  // Parse and normalize events
  const parsedEvents = useMemo(() => {
    return rawEventsList.map((item) => {
      const eventId = item.eventId || item.id;
      const contextMatch = contextEvents.find((e) => e.id === eventId);
      const event = item.eventSnapshot || item;
      const merged = contextMatch ? { ...event, ...contextMatch, ...item } : { ...event, ...item };

      const title = merged.title || merged.name || "Motorcycle Event";
      const location = merged.location || merged.venue || "Location TBA";
      const isOnline =
        merged.isOnline ||
        location.toLowerCase().includes("zoom") ||
        location.toLowerCase().includes("online") ||
        location.toLowerCase().includes("virtual");

      const banner =
        merged.banner ||
        merged.image ||
        merged.bannerImage ||
        "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80";

      const ticketsCount =
        merged.totalTickets ||
        merged.ticketsCount ||
        (merged.attendees ? merged.attendees.length : null) ||
        1;

      const bookingId = merged.bookingId || merged.id || "NX-PASS-2026";
      const hostName = merged.hostName || merged.organizerName || merged.host || "Nitroxx Community";
      const hostAvatar = merged.hostAvatar || merged.organizerAvatar || null;
      const category = merged.category || merged.badge || (isOnline ? "Virtual Meetup" : "Official Ride");
      const joinLink = merged.joinLink || (isOnline ? "https://zoom.us" : null);

      const dateInfo = extractDateInfo(merged);

      return {
        id: merged.id || bookingId,
        eventId,
        bookingId,
        title,
        location,
        isOnline,
        banner,
        ticketsCount,
        hostName,
        hostAvatar,
        category,
        joinLink,
        dateInfo,
        rawItem: merged,
      };
    });
  }, [rawEventsList, contextEvents]);

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

    if (activeTab === "upcoming") {
      result = result.filter((item) => !item.dateInfo.isPast);
    } else {
      result = result.filter((item) => item.dateInfo.isPast);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          item.location.toLowerCase().includes(q) ||
          item.bookingId.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [parsedEvents, activeTab, searchQuery]);

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
          <h1 className="nx-saved-events-title">Joined Events</h1>
        </div>

        {/* Pill Search Input */}
        <div className="nx-saved-events-search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search joined rides, pass ID, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="nx-saved-events-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="nx-saved-search-clear-btn"
              onClick={() => setSearchQuery("")}
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

      {/* Preview Mode Notification Banner when no user registrations exist yet */}
      {isPreviewMode && (
        <div className="nx-saved-preview-banner">
          <div>
            ✨ <strong>Preview Mode:</strong> Showing your confirmed entry passes. Book any ride from the{" "}
            <Link to="/events" className="nx-saved-preview-link">Events Catalog</Link> to see real tickets here!
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
          Upcoming Rides
          {upcomingCount > 0 && <span className="nx-saved-tab-badge">{upcomingCount}</span>}
        </button>

        <button
          type="button"
          className={`nx-saved-tab-btn ${activeTab === "past" ? "is-active" : ""}`}
          onClick={() => setActiveTab("past")}
        >
          Past Rides
          {pastCount > 0 && <span className="nx-saved-tab-badge">{pastCount}</span>}
        </button>
      </div>

      {/* Main Content Area */}
      {loading && !parsedEvents.length ? (
        <div className="profile-loading-state">
          <div className="profile-spinner" />
          <p>Loading your joined rides and passes...</p>
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
          <h3>{searchQuery ? `No ${activeTab} rides matching "${searchQuery}"` : `No ${activeTab} rides registered`}</h3>
          <p>
            {searchQuery
              ? "Try adjusting your search keywords to find your booked tickets."
              : activeTab === "upcoming"
              ? "You haven't joined any upcoming rides yet. Explore exciting weekend rallies and track clinics."
              : "No completed ride history found."}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
            {searchQuery && (
              <button
                type="button"
                className="profile-btn-primary"
                onClick={() => setSearchQuery("")}
                style={{ background: "#2563eb", cursor: "pointer" }}
              >
                Clear Search
              </button>
            )}
            <Link to="/events" className="profile-btn-primary">
              Explore Events
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
                          {/* Live/Now Badge or Confirmed Entry Tag */}
                          {event.dateInfo.isNow && activeTab === "upcoming" ? (
                            <span className="nx-badge-now">
                              <span className="nx-badge-dot" /> NOW
                            </span>
                          ) : activeTab === "past" ? (
                            <span className="nx-badge-completed">Completed</span>
                          ) : (
                            <span className="nx-badge-category">
                              🛡️ Confirmed Entry
                            </span>
                          )}

                          {/* Event Title */}
                          <h3 className="nx-saved-card-title">
                            {event.eventId ? (
                              <Link to={`/event/${event.eventId}`}>{event.title}</Link>
                            ) : (
                              event.title
                            )}
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

                        {/* Bottom Row with Relatable UI & Action Buttons */}
                        <div className="nx-saved-card-bottom">
                          {/* Relatable UI for Joined Events */}
                          <div className="nx-saved-relatable-ui">
                            {/* Pass & Tickets Badge */}
                            <div
                              className="nx-relatable-ticket-tag"
                              title="Click to view full entry pass"
                              style={{ cursor: "pointer" }}
                              onClick={() => setSelectedTicket(event)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" />
                                <path d="M16 3v4" />
                                <path d="M8 3v4" />
                                <rect x="7" y="11" width="10" height="4" />
                              </svg>
                              <span className="nx-relatable-price">{event.bookingId}</span>
                              <span className="nx-relatable-spots">
                                • {event.ticketsCount} {event.ticketsCount === 1 ? "Rider" : "Riders"}
                              </span>
                            </div>

                            {/* View Digital Ticket Pass Button */}
                            <button
                              type="button"
                              className="nx-relatable-saved-btn"
                              style={{ color: "#38bdf8", background: "rgba(56, 189, 248, 0.08)", borderColor: "rgba(56, 189, 248, 0.25)" }}
                              onClick={() => setSelectedTicket(event)}
                              title="Open verified entry QR code"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                              </svg>
                              <span>View Pass</span>
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

                          {/* Action Button: Join Zoom / View Pass / Event Details */}
                          <div className="nx-saved-action-area">
                            {activeTab === "past" ? (
                              <button
                                type="button"
                                className="nx-saved-past-btn"
                                onClick={() => setSelectedTicket(event)}
                              >
                                View Recap
                              </button>
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
                              <button
                                type="button"
                                className="nx-saved-join-btn"
                                onClick={() => setSelectedTicket(event)}
                              >
                                View Ticket
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Banner Image Box matching screenshot */}
                      <div className="nx-saved-card-banner-box">
                        <Link to={event.eventId ? `/event/${event.eventId}` : "#"} title={event.title}>
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

      {/* Ticket Pass Modal */}
      {selectedTicket && (
        <div className="profile-modal-backdrop" onClick={() => setSelectedTicket(null)}>
          <div className="profile-modal nx-ticket-pass-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header" style={{ padding: "16px 20px" }}>
              <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#ffffff" }}>Rider Entry Pass</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setSelectedTicket(null)}
                style={{ background: "none", border: "none", color: "#ffffff", fontSize: "22px", cursor: "pointer" }}
              >
                &times;
              </button>
            </div>

            <div className="nx-ticket-pass-body">
              {/* Event Header Banner */}
              <div className="nx-ticket-pass-banner">
                <img src={selectedTicket.banner} alt={selectedTicket.title} />
                <div className="nx-ticket-pass-badge">{selectedTicket.category || "Ride Pass"}</div>
              </div>

              <div className="nx-ticket-pass-content">
                <h4 className="nx-ticket-pass-title">{selectedTicket.title}</h4>

                <div className="nx-ticket-pass-grid">
                  <div className="nx-ticket-pass-cell">
                    <label>Date & Time</label>
                    <span>{selectedTicket.dateInfo.timeStr}</span>
                  </div>
                  <div className="nx-ticket-pass-cell">
                    <label>Venue / Location</label>
                    <span>{selectedTicket.location}</span>
                  </div>
                  <div className="nx-ticket-pass-cell">
                    <label>Rider / Guest</label>
                    <span>{user?.displayName || "Nitroxx Rider"}</span>
                  </div>
                  <div className="nx-ticket-pass-cell">
                    <label>Pass / Booking ID</label>
                    <span className="nx-ticket-pass-id">{selectedTicket.bookingId}</span>
                  </div>
                </div>

                {/* QR Code and Pass Verification */}
                <div className="nx-ticket-qr-section">
                  <div className="nx-ticket-qr-box">
                    <svg width="84" height="84" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                      <rect x="15" y="15" width="2" height="2" fill="#f97316" />
                      <rect x="18" y="18" width="2" height="2" fill="#f97316" />
                      <rect x="14" y="18" width="2" height="2" fill="#f97316" />
                      <rect x="18" y="14" width="2" height="2" fill="#f97316" />
                      <rect x="6" y="6" width="1" height="1" fill="#f97316" />
                      <rect x="17" y="6" width="1" height="1" fill="#f97316" />
                      <rect x="6" y="17" width="1" height="1" fill="#f97316" />
                    </svg>
                  </div>
                  <div className="nx-ticket-qr-meta">
                    <strong>Pass Verified • {selectedTicket.ticketsCount} {selectedTicket.ticketsCount === 1 ? "Rider" : "Riders"}</strong>
                    <p>Show this digital QR pass at the briefing checkpoint on arrival.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
