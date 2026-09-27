import { useMemo, useState } from "react";
import FilterPills from "../components/FilterPills";
import QrCode from "../components/QrCode";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";

function RideCard({ booking }) {
  const event = booking.eventSnapshot || booking.data || booking || {};
  return (
    <article className="ride-card">
      {event.image || event.banner ? (
        <img src={event.image || event.banner} alt={event.title || event.name || "Event"} className="ride-card__image" />
      ) : (
        <div className="ride-card__image ride-card__image-empty">No image</div>
      )}
      <div className="ride-card__details">
        <span className={`ride-card__status ${String(booking.status || "pending").toLowerCase()}`}>{booking.status || "Pending"}</span>
        <h3>{event.title || event.name}</h3>
        <p>{event.location || event.venue || "Location TBA"}</p>
        <p>{event.dateTimeText || event.dateText || event.dates || event.date}</p>
        <p>Booking ID: <strong>{booking.bookingId || booking.id}</strong></p>
        <p>Payment: <strong>{booking.paymentStatus || "paid"}</strong> | Check-in: <strong>{booking.checkInStatus || booking.attendanceStatus || "Not Checked In"}</strong></p>
        <p>
          Grand Total: <strong>Rs. {Number(booking.total || booking.price || 0).toLocaleString("en-IN")}</strong>
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
        {filteredData.length ? filteredData.map((booking) => <RideCard key={booking.id} booking={booking} />) : <p>No event bookings yet.</p>}
      </div>
    </section>
  );
}
