import React, { useMemo } from "react";
import "./featureEvent.css";
import { useEventsContext } from "../../../context/EventsContext";
import { toDate } from "../../../utils/dataFormatters";
import { EventCard } from "../../Events/Events";

const HIDDEN_STATUSES = new Set(["archived", "deleted", "rejected", "removed"]);
const isVisibleEvent = (event) => !HIDDEN_STATUSES.has(String(event.status || "").toLowerCase());
const eventSortTime = (event) => {
  const date = toDate(event.date || event.eventDate || event.startsAt || event.startDate || event.createdAt);
  return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
};

const FeaturedEvents = () => {
  const { events: cachedEvents, eventsLoading: loading } = useEventsContext();
  const events = useMemo(() => {
    const list = (cachedEvents || []).filter(isVisibleEvent);
    const featured = list.filter((e) => e.featuredForYou === true);
    const source = featured.length > 0 ? featured : list;
    return source
      .sort((first, second) => eventSortTime(first) - eventSortTime(second))
      .slice(0, 9);
  }, [cachedEvents]);

  if (!loading && !events.length) return null;

  return (
    <section className="featured-events">
      <h2 className="section-title events-title">FEATURED EVENTS</h2>
      <div className="events-grid featured-events-grid">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedEvents;
