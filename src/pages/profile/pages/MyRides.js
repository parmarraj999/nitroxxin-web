import FilterPills from "../components/FilterPills";
import QrCode from "../components/QrCode";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";

function RideCard({ booking }) {
  const event = booking.eventSnapshot || {};
  return (
    <article className="ride-card">
      {event.image ? <img src={event.image} alt={event.title || event.name || "Event"} className="ride-card__image" /> : <div className="ride-card__image ride-card__image-empty">No image</div>}
      <div className="ride-card__details">
        <span className={`ride-card__status ${String(booking.status).toLowerCase()}`}>{booking.status}</span>
        <h3>{event.title || event.name}</h3>
        <p>{event.location}</p>
        <p>{event.dateTimeText || event.dateText}</p>
        <p>Booking ID: <strong>{booking.bookingId || booking.id}</strong></p>
        <p>Payment: <strong>{booking.paymentStatus || "pending"}</strong> | Check-in: <strong>{booking.checkInStatus || booking.attendanceStatus || "Not Checked In"}</strong></p>
        <p>
          Grand Total: <strong>Rs. {Number(booking.total || 0).toLocaleString("en-IN")}</strong>
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
  const { data } = useCollection(COLLECTIONS.bookings, {
    where: [["userId", "==", user?.uid]],
    orderBy: [["createdAt", "desc"]],
    limit: 50,
  });

  return (
    <section className="profile-screen profile-screen--narrow">
      <h1>My Rides</h1>
      <FilterPills items={["All", "Complete", "Ongoing"]} />
      <div className="ride-list">
        {data.length ? data.map((booking) => <RideCard key={booking.id} booking={booking} />) : <p>No event bookings yet.</p>}
      </div>
    </section>
  );
}
