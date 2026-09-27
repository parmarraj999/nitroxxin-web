import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";

// Sample initial joined events if Firestore collection is fresh
const SAMPLE_JOINED_EVENTS = [
  {
    id: "sample-dirt-diaries",
    eventId: "event-dirt-diaries",
    title: "Dirt Diaries — Bhimashankar Gravel & Offroad Expedition",
    dateTimeText: "Thu, 30 Jul, 5:00 AM",
    location: "Manchar Naka, Pune–Nashik Highway",
    ticketsCount: 1,
    banner: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
    badge: "Gravel / Offroad Rides",
    status: "Upcoming",
    price: "₹1,499",
    bookingId: "NX-EVT-89210",
    riderName: "Alex Mercer",
  },
  {
    id: "sample-mumbai-night-ride",
    eventId: "event-mumbai-night",
    title: "Mumbai Midnight Coastal Ride & Breakfast",
    dateTimeText: "Mon, 20 Jul, 11:00 PM",
    location: "Marine Drive Promenade to Bandra Fort, Mumbai",
    ticketsCount: 2,
    banner: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80",
    badge: "Night Rides",
    status: "Upcoming",
    price: "₹800",
    bookingId: "NX-EVT-77412",
    riderName: "Alex Mercer",
  },
  {
    id: "sample-monsoon-trail",
    eventId: "event-monsoon-trail",
    title: "Lonavala Ghats Monsoon Circuit",
    dateTimeText: "Sat, 14 Jun, 6:00 AM",
    location: "Old Mumbai-Pune Highway, Tiger Point",
    ticketsCount: 1,
    banner: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80",
    badge: "Mountain Tours",
    status: "Completed",
    price: "₹1,200",
    bookingId: "NX-EVT-65490",
    riderName: "Alex Mercer",
  },
];

export default function JoinedEvents() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);

  const { data: bookingsData, loading: loadingBookings } = useCollection(COLLECTIONS.bookings, {
    where: user?.uid ? [["userId", "==", user.uid]] : [["userId", "==", "NO_USER"]],
    orderBy: [["createdAt", "desc"]],
  });

  const { data: joinedEventsData, loading: loadingJoined } = useCollection(
    user?.uid ? `users/${user.uid}/joined-event` : null,
    { orderBy: [["createdAt", "desc"]] }
  );

  const displayEvents = useMemo(() => {
    const map = new Map();

    (joinedEventsData || []).forEach((item) => {
      const id = item.bookingId || item.eventId || item.id;
      if (id) {
        map.set(id, {
          ...item,
          eventSnapshot: item.eventSnapshot || item.data || item,
        });
      }
    });

    (bookingsData || []).forEach((item) => {
      const id = item.bookingId || item.eventId || item.id;
      if (id && !map.has(id)) {
        map.set(id, {
          ...item,
          eventSnapshot: item.eventSnapshot || item.data || item,
        });
      }
    });

    const list = Array.from(map.values());
    if (list.length > 0) return list;

    // Fallback to sample events if user has no joined events yet
    return SAMPLE_JOINED_EVENTS;
  }, [joinedEventsData, bookingsData]);

  const filteredEvents = useMemo(() => {
    let result = displayEvents;

    if (activeTab === "upcoming") {
      result = result.filter((item) => (item.status || "Upcoming").toLowerCase() !== "completed");
    } else if (activeTab === "completed") {
      result = result.filter((item) => (item.status || "").toLowerCase() === "completed");
    }

    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter((item) => {
      const event = item.eventSnapshot || item;
      const title = String(item.title || event.title || event.name || "").toLowerCase();
      const location = String(item.location || event.location || event.venue || "").toLowerCase();
      const badge = String(item.badge || event.category || "").toLowerCase();
      return title.includes(q) || location.includes(q) || badge.includes(q);
    });
  }, [displayEvents, searchQuery, activeTab]);

  const loading = loadingBookings && loadingJoined;

  return (
    <div className="nx-joined-page-wrap">
      {/* Top Header Row with Title & Quick Info */}
      <div className="nx-joined-header-row">
        <div className="nx-joined-header-left">
          <h1 className="nx-joined-title">Joined Events</h1>
          <span className="nx-joined-badge-count">{displayEvents.length} Events</span>
        </div>

        {/* Tab Pills */}
        <div className="nx-joined-tabs">
          <button
            type="button"
            className={`nx-joined-tab-btn ${activeTab === "all" ? "is-active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Rides
          </button>
          <button
            type="button"
            className={`nx-joined-tab-btn ${activeTab === "upcoming" ? "is-active" : ""}`}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming
          </button>
          <button
            type="button"
            className={`nx-joined-tab-btn ${activeTab === "completed" ? "is-active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            Past Rides
          </button>
        </div>
      </div>

      {/* Full-width Search Bar */}
      <div className="nx-joined-search-container">
        <div className="nx-joined-search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            placeholder="Search joined rides, routes, city, or trail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="nx-joined-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="nx-joined-search-clear"
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Event Cards Grid */}
      {loading ? (
        <div className="profile-loading-state">
          <div className="profile-spinner" />
          <p>Loading your joined events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="profile-empty-state">
          <h3>No events match your search</h3>
          <p>Try searching for a different city or check out exciting upcoming rides.</p>
          <Link to="/events" className="profile-btn-primary">
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="nx-joined-cards-grid">
          {filteredEvents.map((item) => {
            const event = item.eventSnapshot || item;
            const title = item.title || event.title || event.name || "Motorcycle Event";
            const date =
              item.dates ||
              item.dateText ||
              item.dateTimeText ||
              event.dateTimeText ||
              event.dateText ||
              event.dates ||
              "Date TBA";
            const location = item.location || event.location || event.venue || "Location TBA";
            const banner =
              item.banner ||
              item.bannerImage ||
              item.image ||
              event.banner ||
              event.bannerImage ||
              event.image ||
              "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1000&q=80";

            const ticketsCount =
              item.totalTickets ||
              item.ticketsCount ||
              (item.attendees ? item.attendees.length : null) ||
              1;

            const category = item.badge || event.category || "Official Ride";
            const isCompleted = (item.status || "").toLowerCase() === "completed";

            return (
              <div className="nx-joined-event-card" key={item.id || item.bookingId}>
                {/* 16:9 Banner Image Wrapper with Overlays */}
                <div className="nx-joined-banner-wrap">
                  <img src={banner} alt={title} className="nx-joined-banner-img" />
                  <div className="nx-joined-banner-gradient" />
                  
                  {/* Category Pill Tag */}
                  <span className="nx-joined-card-category-tag">{category}</span>

                  {/* Status Indicator */}
                  <span className={`nx-joined-status-pill ${isCompleted ? "status-past" : "status-active"}`}>
                    <span className="nx-joined-status-indicator" />
                    {isCompleted ? "Completed" : "Confirmed"}
                  </span>
                </div>

                {/* Card Content Body */}
                <div className="nx-joined-card-body">
                  <div className="nx-joined-details-row">
                    <div className="nx-joined-info-col">
                      <h3 className="nx-joined-event-title" title={title}>
                        {item.eventId ? (
                          <Link to={`/event/${item.eventId}`}>{title}</Link>
                        ) : (
                          title
                        )}
                      </h3>
                      
                      <div className="nx-joined-meta-row">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span className="nx-joined-date-text">{date}</span>
                      </div>

                      <div className="nx-joined-meta-row">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span className="nx-joined-location-text">{location}</span>
                      </div>
                    </div>

                    {/* Orange Tickets Count Badge */}
                    <div className="nx-joined-tickets-col">
                      <span className="nx-joined-tickets-label">Tickets</span>
                      <strong className="nx-joined-tickets-count">{ticketsCount}</strong>
                    </div>
                  </div>

                  {/* Card Bottom Actions Bar */}
                  <div className="nx-joined-actions-bar">
                    <button
                      type="button"
                      className="nx-joined-btn-ticket"
                      onClick={() =>
                        setSelectedTicket({
                          ...item,
                          title,
                          date,
                          location,
                          banner,
                          ticketsCount,
                          category,
                        })
                      }
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" />
                        <path d="M16 3v4" />
                        <path d="M8 3v4" />
                        <rect x="7" y="11" width="10" height="4" />
                      </svg>
                      View Ticket Pass
                    </button>

                    {item.eventId ? (
                      <Link to={`/event/${item.eventId}`} className="nx-joined-btn-outline">
                        Event Details →
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="nx-joined-btn-outline"
                        onClick={() =>
                          setSelectedTicket({
                            ...item,
                            title,
                            date,
                            location,
                            banner,
                            ticketsCount,
                            category,
                          })
                        }
                      >
                        Ride Info
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Pass Modal */}
      {selectedTicket && (
        <div className="profile-modal-backdrop" onClick={() => setSelectedTicket(null)}>
          <div className="profile-modal nx-ticket-pass-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Rider Entry Pass</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setSelectedTicket(null)}
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
                    <span>{selectedTicket.date}</span>
                  </div>
                  <div className="nx-ticket-pass-cell">
                    <label>Venue / Location</label>
                    <span>{selectedTicket.location}</span>
                  </div>
                  <div className="nx-ticket-pass-cell">
                    <label>Rider / Guest</label>
                    <span>{user?.displayName || selectedTicket.riderName || "Nitroxx Rider"}</span>
                  </div>
                  <div className="nx-ticket-pass-cell">
                    <label>Pass / Booking ID</label>
                    <span className="nx-ticket-pass-id">{selectedTicket.bookingId || selectedTicket.id || "NX-PASS-2025"}</span>
                  </div>
                </div>

                {/* QR Code and Pass Verification */}
                <div className="nx-ticket-qr-section">
                  <div className="nx-ticket-qr-box">
                    <svg width="88" height="88" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5">
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
                    <strong>Pass Verified • {selectedTicket.ticketsCount} Riders</strong>
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
