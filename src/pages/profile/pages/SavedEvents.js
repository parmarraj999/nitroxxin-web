import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { removeFavoriteEvent } from "../../../services/commerceService";

// Fallback demo saved event matching Screenshot 5
const SAMPLE_SAVED_EVENTS = [
  {
    id: "sample-corner-craft",
    eventId: "corner-craft-clinic",
    title: "Corner Craft — Advanced Cornering & Throttle Control Clinic",
    price: 999,
    dateText: "31 Jul 2026",
    location: "MIDC Road, Pimpri, Pune – 411018",
    banner: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "sample-apex-hunters",
    eventId: "apex-track-day",
    title: "Apex Hunters Track Day — Buddh International Circuit",
    price: 3499,
    dateText: "15 Aug 2026",
    location: "Buddh International Circuit, Greater Noida",
    banner: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
  },
];

export default function SavedEvents() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [removedIds, setRemovedIds] = useState([]);

  const { data: bookmarks, loading } = useCollection(
    user?.uid ? `users/${user.uid}/bookmark` : null,
    { orderBy: [["createdAt", "desc"]] }
  );

  const handleRemoveBookmark = async (eventId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setRemovedIds((prev) => [...prev, eventId]);

    if (user?.uid && eventId) {
      try {
        await removeFavoriteEvent({ userId: user.uid, eventId });
        try {
          const local = JSON.parse(localStorage.getItem("nitroxx_bookmarked_events") || "[]");
          localStorage.setItem(
            "nitroxx_bookmarked_events",
            JSON.stringify(local.filter((id) => id !== eventId))
          );
        } catch {
          // ignore
        }
      } catch (err) {
        console.error("Failed to remove bookmark:", err);
      }
    }
  };

  const parsedEvents = (bookmarks || []).map((item) => {
    const eventId = item.eventId || item.id;
    const title = item.title || item.name || "Motorcycle Event";
    const dateText = item.dates || item.date || item.dateText || "Date TBA";
    const location = item.location || item.venue || "Venue TBA";
    const banner = item.banner || item.image || item.bannerImage || "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80";
    const price = item.price !== undefined ? Number(item.price) : 999;

    return {
      id: item.id,
      eventId,
      title,
      dateText,
      location,
      banner,
      price,
    };
  });

  const allEvents = parsedEvents.length > 0 ? parsedEvents : SAMPLE_SAVED_EVENTS;

  const filteredEvents = allEvents.filter((item) => {
    if (removedIds.includes(item.eventId || item.id)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="nx-saved-events-page-wrap">
      {/* Top Header matching Screenshot 5 */}
      <div className="nx-saved-events-header">
        <div className="nx-saved-events-header-left">
          <Link to="/profile" className="nx-saved-events-back-btn" title="Back to Profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <h1 className="nx-saved-events-title">Saved Events</h1>
        </div>
      </div>

      {/* Pill Search Input matching Screenshot 5 */}
      <div className="nx-saved-events-search-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          placeholder="Search saved events or locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="nx-saved-events-search-input"
        />
      </div>

      {loading && !parsedEvents.length ? (
        <div className="profile-loading-state">
          <div className="profile-spinner" />
          <p>Loading your bookmarked events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="profile-empty-state">
          <div className="profile-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3>No bookmarked events yet</h3>
          <p>Click the bookmark icon on any event to save it here for quick access.</p>
          <Link to="/events" className="profile-btn-primary">
            Browse Events
          </Link>
        </div>
      ) : (
        /* Responsive Desktop Grid (2 to 3 columns) matching Screenshot 5 */
        <div className="nx-saved-events-grid">
          {filteredEvents.map((item) => (
            <div className="nx-saved-event-card" key={item.id}>
              {/* Banner Area with Price Tag & Bookmark Ribbon matching Screenshot 5 */}
              <div className="nx-saved-event-banner-wrap">
                <img
                  src={item.banner}
                  alt={item.title}
                  className="nx-saved-event-banner-img"
                  loading="lazy"
                />

                {/* Bottom Left Price Badge matching Screenshot 5 */}
                <span className="nx-saved-event-price-tag">
                  {item.price === 0 ? "Free" : `₹${item.price.toLocaleString("en-IN")}`}
                </span>

                {/* Top Right White Bookmark Ribbon matching Screenshot 5 */}
                <button
                  type="button"
                  className="nx-saved-event-bookmark-badge"
                  onClick={(e) => handleRemoveBookmark(item.eventId || item.id, e)}
                  title="Remove bookmark"
                  aria-label="Remove bookmark"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff" stroke="#ffffff" strokeWidth="1.5">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
              </div>

              {/* Card Body matching Screenshot 5 */}
              <div className="nx-saved-event-body">
                <h3 className="nx-saved-event-title" title={item.title}>
                  <Link to={`/event/${item.eventId || item.id}`}>{item.title}</Link>
                </h3>

                {/* Date Row */}
                <div className="nx-saved-event-info-row">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{item.dateText}</span>
                </div>

                {/* Location Row */}
                <div className="nx-saved-event-info-row">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{item.location}</span>
                </div>

                {/* Dual Action Buttons matching Screenshot 5 */}
                <div className="nx-saved-event-actions-row">
                  <Link
                    to={`/event/${item.eventId || item.id}`}
                    className="nx-saved-event-book-btn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <line x1="16" y1="21" x2="16" y2="7" />
                    </svg>
                    Book Ticket
                  </Link>

                  <button
                    type="button"
                    className="nx-saved-event-remove-btn"
                    onClick={(e) => handleRemoveBookmark(item.eventId || item.id, e)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
