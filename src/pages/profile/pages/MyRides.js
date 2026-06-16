import FilterPills from "../components/FilterPills";
import QrCode from "../components/QrCode";

const eventImage =
  "https://i.pinimg.com/736x/f4/19/f9/f419f9ee2c94bf67c5ccb2985295db2f.jpg";
const eventImageAlt =
  "https://i.pinimg.com/736x/2c/69/3c/2c693c3f24c4642755f69fade9b71091.jpg";

function RideCard({ image, status }) {
  return (
    <article className="ride-card">
      <img src={image} alt="Adventure bike event" className="ride-card__image" />
      <div className="ride-card__details">
        <span className={`ride-card__status ${status.toLowerCase()}`}>{status}</span>
        <h3>Adventure Begins Dirty Bike Event | Bhopal</h3>
        <p>Jawaharlal Nehru Stadium, New Delhi</p>
        <p>Sat, 23 May, 8:00 PM</p>
        <p>
          Ticket Price : <strong>&#8377;1200</strong>
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
  return (
    <section className="profile-screen profile-screen--narrow">
      <h1>My Rides</h1>
      <FilterPills items={["All", "Complete", "Ongoing"]} />
      <div className="ride-list">
        <RideCard image={eventImage} status="Upcoming" />
        <div className="ride-date">2 May 2025</div>
        <RideCard image={eventImageAlt} status="Complete" />
      </div>
    </section>
  );
}
