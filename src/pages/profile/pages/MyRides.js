import FilterPills from "../components/FilterPills";
import QrCode from "../components/QrCode";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";

const eventImage =
  "https://i.pinimg.com/736x/f4/19/f9/f419f9ee2c94bf67c5ccb2985295db2f.jpg";

function RideCard({ booking }) {
  const event = booking.eventSnapshot || {};
  return (
    <article className="ride-card">
      <img src={event.image || eventImage} alt={event.title || event.name || "Event"} className="ride-card__image" />
      <div className="ride-card__details">
        <span className={`ride-card__status ${String(booking.status).toLowerCase()}`}>{booking.status}</span>
        <h3>{event.title || event.name}</h3>
        <p>{event.location}</p>
        <p>{event.dateTimeText || event.dateText}</p>
        <p>
          Ticket Price : <strong>{event.priceText || booking.total}</strong>
        </p>
        <div className="ride-card__footer">
          <span>Cancellation Available before 24 hours</span>
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
