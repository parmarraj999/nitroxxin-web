import React, { useMemo } from "react";
import "./featureEvent.css";
import { Link } from "react-router-dom";
import { useEventsContext } from "../../../context/EventsContext";
import { toDate } from "../../../utils/dataFormatters";

const HIDDEN_STATUSES = new Set(["archived", "deleted", "rejected", "removed"]);
const isVisibleEvent = (event) => !HIDDEN_STATUSES.has(String(event.status || "").toLowerCase());
const eventSortTime = (event) => {
  const date = toDate(event.date || event.eventDate || event.startsAt || event.startDate || event.createdAt);
  return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
};

const EventCard = ({ id, image, title, date, price }) => (
  <Link className="event-card" to={`/event/${id}`}>
    <div className="event-image-wrapper">
      {image ? <img src={image} alt={title} className="event-image" /> : <span>No image</span>}
    </div>
    <div className="event-info">
      <h3 className="event-title">{title}</h3>
      <div className="event-details">
        <span className="event-date">{date}</span>
        <span className="event-divider"></span>
        <span className="event-price">{price}</span>
      </div>
    </div>
  </Link>
);

const FeaturedEvents = () => {
  const { events: cachedEvents, eventsLoading: loading } = useEventsContext();
  const events = useMemo(() => {
    return (cachedEvents || [])
      .filter((e) => isVisibleEvent(e) && e.featuredForYou === true)
      .sort((first, second) => eventSortTime(first) - eventSortTime(second))
      .slice(0, 9);
  }, [cachedEvents]);

  if (!loading && !events.length) return null;

  return (
    <section className="featured-events">
      <h2 className="section-title events-title">FEATURED EVENTS</h2>
      <div className="events-grid">
        {events.map((event) => (
          <EventCard
            key={event.id}
            id={event.id}
            image={event.banner || event.image}
            title={event.name || event.title}
            date={event.dateText || event.dateTimeText}
            price={event.priceText || event.price || "Free"}
          />
        ))}
      </div>
    </section>
  );
};

export default FeaturedEvents;
