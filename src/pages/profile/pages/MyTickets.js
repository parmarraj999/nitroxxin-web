import React, { useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";

// Sample initial tickets matching Screenshot 5 if user has no booked events yet
const SAMPLE_TICKETS = [
  {
    id: "sample-ticket-1",
    brand: "NitroXx",
    subBrand: "Tickets",
    title: "IT COMES WITH IT MIC MCCLURE",
    venue: "Gateway of India, Colaba",
    date: "08/12",
    time: "02:00 PM",
    tickets: "x2",
    type: "qr",
    theme: "holographic",
  },
  {
    id: "sample-ticket-2",
    brand: "DICE & KODAK",
    subBrand: "THE POWER OF THE MOMENT",
    title: "DICE & KODAK",
    venue: "O2 ACADEMY, BRISTOL",
    date: "03.07.24",
    time: "19.00 GMT",
    tickets: "ADMISSION X1",
    type: "barcode",
    theme: "amber",
  },
];

export default function MyTickets() {
  const { user } = useAuth();

  const { data: bookingsData, loading: loadingBookings } = useCollection(COLLECTIONS.bookings, {
    where: user?.uid ? [["userId", "==", user.uid]] : [["userId", "==", "NO_USER"]],
    orderBy: [["createdAt", "desc"]],
  });

  const { data: joinedEventsData, loading: loadingJoined } = useCollection(
    user?.uid ? `users/${user.uid}/joined-event` : null,
    { orderBy: [["createdAt", "desc"]] }
  );

  const tickets = useMemo(() => {
    const map = new Map();

    (joinedEventsData || []).forEach((item, idx) => {
      const id = item.bookingId || item.eventId || item.id;
      if (id) {
        map.set(id, {
          ...item,
          theme: idx % 2 === 0 ? "holographic" : "amber",
          type: idx % 2 === 0 ? "qr" : "barcode",
        });
      }
    });

    (bookingsData || []).forEach((item, idx) => {
      const id = item.bookingId || item.eventId || item.id;
      if (id && !map.has(id)) {
        map.set(id, {
          ...item,
          theme: idx % 2 === 0 ? "holographic" : "amber",
          type: idx % 2 === 0 ? "qr" : "barcode",
        });
      }
    });

    const list = Array.from(map.values());
    if (list.length > 0) return list;
    return SAMPLE_TICKETS;
  }, [joinedEventsData, bookingsData]);

  const loading = loadingBookings && loadingJoined;

  return (
    <div className="nx-tickets-page-wrap">
      {/* Top Header matching Screenshot 5 */}
      <div className="nx-tickets-header">
        <h1 className="nx-tickets-title">My Tickets</h1>
      </div>

      {loading ? (
        <div className="profile-loading-state">
          <div className="profile-spinner" />
          <p>Loading your tickets...</p>
        </div>
      ) : (
        <div className="nx-tickets-container">
          {tickets.map((t, idx) => {
            const event = t.eventSnapshot || t;
            const theme = t.theme || (idx % 2 === 0 ? "holographic" : "amber");
            const isHolo = theme === "holographic";

            const title = t.title || event.title || event.name || "IT COMES WITH IT MIC MCCLURE";
            const venue = t.venue || t.location || event.location || event.venue || "Gateway of India, Colaba";
            const date = t.date || t.dates || event.dateText || "08/12";
            const time = t.time || event.timeText || "02:00 PM";
            const count = t.tickets || (t.totalTickets ? `x${t.totalTickets}` : "x1");

            return (
              <div className={`nx-stamp-ticket ${isHolo ? "theme-holo" : "theme-amber"}`} key={t.id || idx}>
                {/* Top Scalloped Perforations */}
                <div className="nx-stamp-perfs perfs-top" />

                {/* Left & Right Notch Cutouts for Divider */}
                <div className="nx-stamp-notch notch-left" />
                <div className="nx-stamp-notch notch-right" />

                {/* Upper Ticket Section */}
                <div className="nx-stamp-upper">
                  <div className="nx-stamp-brand-header">
                    <span className="nx-stamp-brand-name">
                      {isHolo ? "NitroXx" : (t.brand || "DICE & KODAK")}
                    </span>
                    <span className="nx-stamp-brand-sub">
                      {isHolo ? "Tickets" : (t.subBrand || "THE POWER OF THE MOMENT")}
                    </span>
                  </div>

                  <h2 className="nx-stamp-event-title">{title}</h2>
                  <p className="nx-stamp-event-venue">{venue}</p>

                  <div className="nx-stamp-meta-grid">
                    <div>
                      <span className="nx-stamp-meta-lbl">Date</span>
                      <strong className="nx-stamp-meta-val">{date}</strong>
                    </div>
                    <div>
                      <span className="nx-stamp-meta-lbl">Time</span>
                      <strong className="nx-stamp-meta-val">{time}</strong>
                    </div>
                    <div>
                      <span className="nx-stamp-meta-lbl">Tickets</span>
                      <strong className="nx-stamp-meta-val">{count}</strong>
                    </div>
                  </div>
                </div>

                {/* Perforated Dashed Line Divider */}
                <div className="nx-stamp-dashed-divider" />

                {/* Lower Ticket Section: QR Code or Barcode */}
                <div className="nx-stamp-lower">
                  {isHolo ? (
                    <div className="nx-stamp-qr-wrap">
                      <span className="nx-stamp-qr-vertical-text">
                        SCAN THIS QR WHEN ENTER
                      </span>
                      <div className="nx-stamp-qr-code">
                        <svg width="150" height="150" viewBox="0 0 24 24" fill="#000000">
                          <path d="M2 2h8v8H2zM4 4v4h4V4zm10-2h8v8h-8zM16 4v4h4V4zm-14 10h8v8H2zm2 2v4h4v-4zm11-2h2v2h-2zm4 0h2v2h-2zm-4 4h2v2h-2zm4 0h2v2h-2zm-2 2h2v2h-2zm-6-4h2v2h-2zm0 4h2v2h-2zm4-6h2v2h-2z" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="nx-stamp-barcode-wrap">
                      <div className="nx-stamp-barcode-lines">
                        {/* Realistic barcode stripes */}
                        <div className="b-bar b-w2" />
                        <div className="b-bar b-w1" />
                        <div className="b-bar b-w3" />
                        <div className="b-bar b-w1" />
                        <div className="b-bar b-w4" />
                        <div className="b-bar b-w2" />
                        <div className="b-bar b-w1" />
                        <div className="b-bar b-w3" />
                        <div className="b-bar b-w2" />
                        <div className="b-bar b-w4" />
                        <div className="b-bar b-w1" />
                        <div className="b-bar b-w2" />
                        <div className="b-bar b-w3" />
                        <div className="b-bar b-w1" />
                        <div className="b-bar b-w2" />
                        <div className="b-bar b-w4" />
                        <div className="b-bar b-w2" />
                        <div className="b-bar b-w3" />
                        <div className="b-bar b-w1" />
                        <div className="b-bar b-w2" />
                        <div className="b-bar b-w4" />
                        <div className="b-bar b-w1" />
                        <div className="b-bar b-w3" />
                        <div className="b-bar b-w2" />
                        <div className="b-bar b-w1" />
                        <div className="b-bar b-w3" />
                        <div className="b-bar b-w4" />
                        <div className="b-bar b-w2" />
                        <div className="b-bar b-w1" />
                        <div className="b-bar b-w2" />
                        <div className="b-bar b-w3" />
                        <div className="b-bar b-w4" />
                      </div>
                      <span className="nx-stamp-barcode-number">
                        098234 819203 194827
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Scalloped Perforations */}
                <div className="nx-stamp-perfs perfs-bottom" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
