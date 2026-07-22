import { useMemo, useState } from "react";
import "./EventPage.css";
import { Link, useNavigate } from "react-router-dom";
import { useEventsContext } from "../../context/EventsContext";
import { toDate } from "../../utils/dataFormatters";

const timeFilters = ["All", "Today", "Upcoming", "Free", "Paid", "VIP"];
const isVisibleEvent = (event) => String(event.status || "").toLowerCase() === "published";

const eventSortTime = (event) => {
  const date = toDate(event.date || event.eventDate || event.startsAt || event.startDate || event.createdAt);
  return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
};

function SearchIcon({ color = "white" }) {
  return (
    <svg viewBox="0 0 22 22" fill="none">
      <circle cx="9" cy="9" r="7" stroke={color} strokeWidth="2" />
      <path d="M14.5 14.5L20 20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 10 17" fill="none">
      <path d="M1 16L9 8.5L1 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 10 17" fill="none">
      <path d="M9 16L1 8.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <line x1="4" y1="6" x2="20" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="18" x2="20" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="6" r="2" fill="#17191b" stroke="white" strokeWidth="2" />
      <circle cx="15" cy="12" r="2" fill="#17191b" stroke="white" strokeWidth="2" />
      <circle cx="9" cy="18" r="2" fill="#17191b" stroke="white" strokeWidth="2" />
    </svg>
  );
}

function EventCard({ event }) {
  const [liked, setLiked] = useState(false);
  const image = event.bannerImage || event.banner;

  return (
    <Link className="ep-event-card" to={`/event/${event.id}`}>
      <div className="ep-event-card__image">
        {image ? <img src={image} alt={event.name || event.title} /> : <span>No image</span>}
        <button
          className={`ep-event-card__heart${liked ? " ep-event-card__heart--liked" : ""}`}
          onClick={(clickEvent) => {
            clickEvent.preventDefault();
            setLiked((previous) => !previous);
          }}
          aria-label="Save event"
        >
          <HeartIcon />
        </button>
        <div className="ep-event-card__info">
          <div className="ep-event-card__name">{event.name || event.title}</div>
          <div className="ep-event-card__meta">
            <span className="ep-event-card__date">{event.dateText || event.dateTimeText}</span>
            <span className="ep-event-card__sep" />
            <span className="ep-event-card__price">{event.priceText || "Free"}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ title, text }) {
  return (
    <div className="nx-empty-state">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export default function Events() {
  const navigate = useNavigate();
  const { events, eventsLoading, categories } = useEventsContext();
  const [query, setQuery] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All");

  const liveEvents = useMemo(
    () =>
      events
        .filter(isVisibleEvent)
        .sort((first, second) => eventSortTime(first) - eventSortTime(second)),
    [events]
  );

  const eventCategories = categories;

  let upcomingEvents = liveEvents.filter((event) => {
    const startsAt = toDate(event.date || event.eventDate || event.startsAt || event.startDate);
    return !startsAt || startsAt.setHours(0,0,0,0) >= new Date().setHours(0,0,0,0);
  });
  if (upcomingEvents.length === 0) upcomingEvents = liveEvents;
  const heroEvents = upcomingEvents.slice(0, 5);
  const total = Math.max(heroEvents.length, 1);
  const prev = () => setActiveSlide((previous) => (previous - 1 + total) % total);
  const next = () => setActiveSlide((previous) => (previous + 1) % total);

  const filteredEvents = useMemo(() => {
    const today = new Date().toDateString();
    const term = query.trim().toLowerCase();
    return liveEvents.filter((event) => {
      const startsAt = toDate(event.date || event.eventDate || event.startsAt || event.startDate);
      const price = Number(event.price || event.ticketPrice || event.startingPrice || 0);
      const matchesSearch =
        !term ||
        [event.name, event.title, event.category, event.location, event.organizerName]
          .some((value) => String(value || "").toLowerCase().includes(term));
      if (!matchesSearch) return false;
      if (activeFilter === "Today") return startsAt && startsAt.toDateString() === today;
      if (activeFilter === "Upcoming") return !startsAt || startsAt >= new Date();
      if (activeFilter === "Free") return price === 0;
      if (activeFilter === "Paid") return price > 0;
      if (activeFilter === "VIP") return String(event.type || event.ticketType || "").toLowerCase().includes("vip");
      return true;
    });
  }, [activeFilter, liveEvents, query]);

  const currentEvent = heroEvents[activeSlide] || heroEvents[0] || {};

  return (
    <div className="ep-page">
      <div className="ep-hero__flex">
        <div className="ep-hero">
          <h1 className="ep-hero__heading">Discover bike events<br />near you</h1>
          <div className="ep-search">
            <div className="ep-search__input-wrap">
              <span className="ep-search__icon-left"><SearchIcon /></span>
              <input
                className="ep-search__input"
                type="search"
                placeholder="Search events, city, organizer..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <button className="ep-search__btn" aria-label="Search events">
              <SearchIcon color="#fff" />
            </button>
          </div>
        </div>
      </div>

      {eventsLoading ? (
        <EmptyState title="Loading events" text="Fetching live events from Firestore." />
      ) : !liveEvents.length ? (
        <EmptyState title="No live events yet" text="Publish events from the Event Dashboard and they will appear here automatically." />
      ) : (
        <>
          <div className="ep-featured-wrap">
            <div className="ep-featured">
              <button className="ep-featured__slider-btn" aria-label="Previous" onClick={prev}><ChevronLeft /></button>
              <div className="ep-featured__viewport">
                <div className="ep-featured__track" style={{ transform: `translateX(-${activeSlide * 302}px)` }}>
                  {heroEvents.map((event, index) => (
                    <div key={event.id} className="ep-featured__slide">
                      {event.image || event.banner ? <img src={event.thumbnailImage || event.banner} alt={event.title || event.name} /> : `Event ${index + 1}`}
                    </div>
                  ))}
                </div>
              </div>
              <div className="ep-featured__info">
                <p className="ep-featured__date">{currentEvent.dateTimeText || currentEvent.dateText}</p>
                <h2 className="ep-featured__title">{currentEvent.title || currentEvent.name}</h2>
                <p className="ep-featured__location">{currentEvent.location}</p>
                <p className="ep-featured__price"><span>{currentEvent.priceText || "Free"}</span> onwards</p>
                <button className="ep-featured__book-btn" onClick={() => navigate(`/event/${currentEvent.id}/book`)}>
                  Book Ticket
                </button>
              </div>
              <button className="ep-featured__slider-btn" aria-label="Next" onClick={next}><ChevronRight /></button>
            </div>
            <div className="ep-dots">
              {heroEvents.map((event, index) => (
                <button
                  key={event.id}
                  className={`ep-dot${index === activeSlide ? " ep-dot--active" : ""}`}
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {eventCategories.length > 0 && (
            <div className="ep-section">
              <p className="ep-section__title">Events Category</p>
              <div className="ep-categories">
                {eventCategories.map((cat) => (
                  <Link to={`/events?category=${cat.id}`} key={cat.id} className="ep-cat-card">
                    <div className="ep-cat-card__image-slot">{cat.image ? <img src={cat.image} alt={cat.label} /> : "Category"}</div>
                    <div className="ep-cat-card__label">{cat.label}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="ep-section">
            <p className="ep-section__title">Recommended Events</p>
            <div className="ep-events-grid">
              {liveEvents.slice(0, 8).map((event) => <EventCard key={event.id} event={event} />)}
            </div>
          </div>

          <div className="ep-section">
            <p className="ep-section__title">All Events</p>
            <div className="ep-filters">
              <button className="ep-filter-btn"><SlidersIcon /> Filters</button>
              {timeFilters.map((filter) => (
                <button
                  key={filter}
                  className={`ep-filter-btn${activeFilter === filter ? " ep-filter-btn--active" : ""}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            {filteredEvents.length > 0 ? (
              <div className="ep-events-grid">
                {filteredEvents.map((event) => <EventCard key={`all-${event.id}`} event={event} />)}
              </div>
            ) : (
              <EmptyState title="No matching events" text="Try a different search, category, or date filter." />
            )}
          </div>
        </>
      )}
    </div>
  );
}
