import { useMemo, useState } from "react";
import FilterPills from "../components/FilterPills";
import QrCode from "../components/QrCode";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";
import { useEventsContext } from "../../../context/EventsContext";

function RideCard({ booking, contextEvents = [] }) {
  const eventId = booking.eventId || booking.id;
  const contextMatch = contextEvents.find((e) => e.id === eventId) || {};
  const event = booking.eventSnapshot || contextMatch || booking.data || booking || {};
  const banner = event.bannerImage || event.banner || event.image || (event.images && event.images[0]);
  const title = booking.eventTitle || booking.title || event.title || event.name || "Event";
  const location = event.location || event.venue || "Location TBA";
  const dateInfo = event.dateTimeText || event.dateText || event.dates || event.date || "";
  const paymentStatus = booking.payment?.status || booking.paymentStatus || "paid";
  const grandTotal = Number(booking.payment?.amount || booking.total || booking.price || 0);

  return (
    <article className="ride-card">
      {banner ? (
        <img src={banner} alt={title} className="ride-card__image" />
      ) : (
        <div className="ride-card__image ride-card__image-empty">No image</div>
      )}
      <div className="ride-card__details">
        <span className={`ride-card__status ${String(booking.status || "pending").toLowerCase()}`}>{booking.status || "Pending"}</span>
        <h3>{title}</h3>
        <p>{location}</p>
        <p>{dateInfo}</p>
        <p>Booking ID: <strong>{booking.bookingId || booking.id}</strong></p>
        <p>Payment: <strong>{paymentStatus}</strong> | Check-in: <strong>{booking.checkInStatus || booking.attendanceStatus || "Not Checked In"}</strong></p>
        <p>
          Grand Total: <strong>Rs. {grandTotal.toLocaleString("en-IN")}</strong>
        </p>
        <div className="ride-card__footer">
          <span>{booking.status === "cancelled" ? "Refund status updates automatically" : "Ticket, invoice, refund, and reminders sync here"}</span>
          <QrCode />
        </div>
      </div>
    </article>
  );
}

export default function MyRides() {
  const { user } = useAuth();
  const { events: contextEvents = [] } = useEventsContext();
  const [filter, setFilter] = useState("All");

  const { data: bookingsData } = useCollection(COLLECTIONS.bookings, {
    where: user?.uid ? [["userId", "==", user.uid]] : [["userId", "==", "NO_USER"]],
    orderBy: [["createdAt", "desc"]],
  });

  const { data: joinedEventsData } = useCollection(
    user?.uid ? `users/${user.uid}/joined-event` : null,
    { orderBy: [["createdAt", "desc"]] }
  );

  const mergedBookings = useMemo(() => {
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

    (bookingsData || []).forEach((booking) => {
      const id = booking.bookingId || booking.eventId || booking.id;
      if (id && !map.has(id)) {
        map.set(id, booking);
      }
    });

    return Array.from(map.values());
  }, [joinedEventsData, bookingsData]);

  const filteredData = mergedBookings.filter((booking) => {
    if (filter === "All") return true;
    const status = String(booking.status || "").toLowerCase();
    if (filter === "Complete") return status === "completed";
    if (filter === "Ongoing") return status === "pending" || status === "confirmed" || status === "approved";
    return true;
  });

  return (
    <section className="profile-screen profile-screen--narrow">
      <h1>My Rides</h1>
      <FilterPills 
        items={["All", "Complete", "Ongoing"]} 
        activeItem={filter} 
        onChange={setFilter} 
      />
      <div className="ride-list">
        {filteredData.length ? filteredData.map((booking) => <RideCard key={booking.id} booking={booking} contextEvents={contextEvents} />) : <p>No event bookings yet.</p>}
      </div>
    </section>
  );
}
