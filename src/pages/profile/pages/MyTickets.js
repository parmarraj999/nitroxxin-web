import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";
import { getTicketQrUrl } from "../../../utils/ticketSecurity";

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

  const { data: myEventsData } = useCollection(
    user?.uid ? `users/${user.uid}/my-events` : null
  );

  const tickets = useMemo(() => {
    const map = new Map();

    const addTicket = (item, idx) => {
      const id = item.bookingId || item.eventId || item.id;
      if (id && !map.has(id)) {
        map.set(id, {
          ...item,
          theme: idx % 2 === 0 ? "holographic" : "amber",
          type: idx % 2 === 0 ? "qr" : "barcode",
        });
      }
    };

    (myEventsData || []).forEach(addTicket);
    (joinedEventsData || []).forEach(addTicket);
    (bookingsData || []).forEach(addTicket);

    return Array.from(map.values());
  }, [myEventsData, joinedEventsData, bookingsData]);

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
      ) : tickets.length === 0 ? (
        <div className="profile-empty-state">
          <div className="profile-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M12 12h.01" />
              <path d="M17 6v12" strokeDasharray="2 2" />
              <path d="M7 6v12" strokeDasharray="2 2" />
            </svg>
          </div>
          <h3>No event passes or tickets yet</h3>
          <p>Book passes for rallies, track days, and motorcycle expeditions to access digital QR passes here.</p>
          <Link to="/events" className="profile-btn-primary">
            Explore Events
          </Link>
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

            const ticketCode =
              t.ticketCode ||
              t.ticketNumber ||
              (t.bookingId ? `NTX-${t.bookingId}` : `NTX-${String(t.id || idx).slice(0, 6).toUpperCase()}`);

            const qrPayload =
              t.qrPayload ||
              JSON.stringify({
                ticketCode,
                bookingId: t.bookingRefId || t.bookingId || t.id || '',
                eventId: t.eventId || event?.id || '',
                attendeeEmail: t.email || t.participantEmail || user?.email || '',
                signature: t.signature || 'ntx_verified_pass',
              });

            const qrUrl = getTicketQrUrl(qrPayload);

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

                {/* Lower Ticket Section: High-Contrast QR Code */}
                <div className="nx-stamp-lower">
                  <div className="nx-stamp-qr-wrap">
                    <span className="nx-stamp-qr-vertical-text">
                      SCAN THIS QR WHEN ENTER
                    </span>
                    <div
                      className="nx-stamp-qr-code"
                      style={{
                        background: '#ffffff',
                        padding: '10px',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '240px',
                        minHeight: '240px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                      }}
                    >
                      <img
                        src={qrUrl}
                        alt={`QR Code for Ticket ${ticketCode}`}
                        style={{
                          width: '210px',
                          height: '210px',
                          display: 'block',
                          imageRendering: 'pixelated',
                        }}
                      />
                      <span
                        style={{
                          marginTop: '6px',
                          fontSize: '11px',
                          fontWeight: '800',
                          fontFamily: 'monospace',
                          color: '#0f172a',
                          letterSpacing: '0.8px',
                        }}
                      >
                        {ticketCode}
                      </span>
                    </div>
                  </div>
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
