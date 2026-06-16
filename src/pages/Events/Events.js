import { useState, useMemo } from "react";
import "./EventPage.css";
import { Link } from "react-router-dom";


/* ── DATA ── */

const featuredEvents = [
  {
    id: 1,
    date: "Sat, 9:00 PM",
    title: "Adventure Begins Dirty Bike\nEvent | Bhopal",
    location: "DB mall, MP nagar, Bhopal",
    price: "$1500",
  },
  {
    id: 2,
    date: "Sun, 6:00 PM",
    title: "Night Riders Championship\nEvent | Indore",
    location: "Brilliant Convention Centre, Indore",
    price: "$1200",
  },
  {
    id: 3,
    date: "Fri, 8:00 PM",
    title: "Mountain Mayhem Bike Fest\nEvent | Pune",
    location: "Sahyadri Hills Arena, Pune",
    price: "$2000",
  },
];

const allEventsData = [
  { id: 1, name: "Swift Motion", date: "27 May 2026", price: "₹ 1200", category: "Night Ride" },
  { id: 2, name: "Swift Motion", date: "27 May 2026", price: "₹ 1200", category: "Mountain Rides" },
  { id: 3, name: "Swift Motion", date: "27 May 2026", price: "₹ 1200", category: "Meetups" },
  { id: 4, name: "Swift Motion", date: "27 May 2026", price: "₹ 1200", category: "Night Ride" },
  { id: 5, name: "Swift Motion", date: "27 May 2026", price: "₹ 1200", category: "Bike Festivals" },
  { id: 6, name: "Swift Motion", date: "27 May 2026", price: "₹ 1200", category: "Mountain Rides" },
  { id: 7, name: "Swift Motion", date: "27 May 2026", price: "₹ 1200", category: "Meetups" },
  { id: 8, name: "Swift Motion", date: "27 May 2026", price: "₹ 1200", category: "Night Ride" },
];

const categories = [
  { id: 1, label: "Night Ride" },
  { id: 2, label: "Mountain Rides" },
  { id: 3, label: "Meetups" },
  { id: 4, label: "Bike Festivals" },
  { id: 5, label: "Night Ride" },
];

const timeFilters = ["Today", "Tommorow", "Upcoming", "Ongoing"];

/* ── ICONS ── */

function SearchIcon({ color = "white" }) {
  return (
    <svg viewBox="0 0 22 22" fill="none">
      <circle cx="9" cy="9" r="7" stroke={color} strokeWidth="2" />
      <path
        d="M14.5 14.5L20 20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}



function ChevronRight() {
  return (
    <svg viewBox="0 0 10 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 16L9 8.5L1 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 10 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 16L1 8.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="4" y1="6" x2="20" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="18" x2="20" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="6" r="2" fill="#17191b" stroke="white" strokeWidth="2" />
      <circle cx="15" cy="12" r="2" fill="#17191b" stroke="white" strokeWidth="2" />
      <circle cx="9" cy="18" r="2" fill="#17191b" stroke="white" strokeWidth="2" />
    </svg>
  );
}

/* ── EVENT CARD ── */

function EventCard({ event }) {
  const [liked, setLiked] = useState(false);

  return (
    <Link className="ep-event-card" to='/events/123'>
      <div className="ep-event-card__image">
        <span>Image</span>

        <button
          className={`ep-event-card__heart${liked ? " ep-event-card__heart--liked" : ""}`}
          onClick={() => setLiked((p) => !p)}
          aria-label="Like"
        >
          <HeartIcon />
        </button>

        {/* Blur overlay at bottom */}
        <div className="ep-event-card__info">
          <div className="ep-event-card__name">{event.name}</div>
          <div className="ep-event-card__meta">
            <span className="ep-event-card__date">{event.date}</span>
            <span className="ep-event-card__sep" />
            <span className="ep-event-card__price">{event.price}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── MAIN PAGE ── */

export default function Events() {
  /* search */
  const [query, setQuery] = useState("");

  /* featured slider */
  const [activeSlide, setActiveSlide] = useState(0);
  const total = featuredEvents.length;

  const prev = () => setActiveSlide((p) => (p - 1 + total) % total);
  const next = () => setActiveSlide((p) => (p + 1) % total);

  /* all events filter */
  const [activeFilter, setActiveFilter] = useState("Today");

  /* search filtering */
  const filteredEvents = useMemo(() => {
    if (!query.trim()) return allEventsData;
    const q = query.toLowerCase();
    return allEventsData.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [query]);

  const currentEvent = featuredEvents[activeSlide];

  return (
    <div className="ep-page">

      {/* ── HERO: heading + search side by side ── */}
      <div className="ep-hero__flex">
        <div className="ep-hero">
          <h1 className="ep-hero__heading">
            Discover bike events<br />near you
          </h1>

          <div className="ep-search">
            <div className="ep-search__input-wrap">
              <span className="ep-search__icon-left">
                <SearchIcon />
              </span>
              <input
                className="ep-search__input"
                type="text"
                placeholder="Search For Any Event...."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              className="ep-search__btn"
              aria-label="Search"
              onClick={() => {/* query already live-filters */ }}
            >
              <SearchIcon color="#fff" />
            </button>
          </div>
        </div>
      </div>

      {/* ── FEATURED EVENT ── */}
      <div className="ep-featured-wrap">
        <div className="ep-featured">

          {/* Left button */}
          <button className="ep-featured__slider-btn" aria-label="Previous" onClick={prev}>
            <ChevronLeft />
          </button>

          {/* Sliding image viewport */}
          <div className="ep-featured__viewport">
            <div
              className="ep-featured__track"
              style={{ transform: `translateX(-${activeSlide * 302}px)` }}
            >
              {featuredEvents.map((_, i) => (
                <div key={i} className="ep-featured__slide">
                  Image {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Event info — updates with slide */}
          <div className="ep-featured__info">
            <p className="ep-featured__date">{currentEvent.date}</p>
            <h2 className="ep-featured__title">
              {currentEvent.title.split("\n").map((line, i) => (
                <span key={i}>{line}{i === 0 && <br />}</span>
              ))}
            </h2>
            <p className="ep-featured__location">{currentEvent.location}</p>
            <p className="ep-featured__price">
              <span>{currentEvent.price}</span> onwards
            </p>
            <button className="ep-featured__book-btn">Book Ticket</button>
          </div>

          {/* Right button */}
          <button className="ep-featured__slider-btn" aria-label="Next" onClick={next}>
            <ChevronRight />
          </button>
        </div>

        {/* Dot indicators */}
        <div className="ep-dots">
          {featuredEvents.map((_, i) => (
            <button
              key={i}
              className={`ep-dot${i === activeSlide ? " ep-dot--active" : ""}`}
              onClick={() => setActiveSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── EVENTS CATEGORY ── */}
      <div className="ep-section">
        <p className="ep-section__title">Events Category</p>
        <div className="ep-categories">
          {categories.map((cat) => (
            <div key={cat.id} className="ep-cat-card">
              <div className="ep-cat-card__image-slot">Image</div>
              <div className="ep-cat-card__label">{cat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RECOMMENDED EVENTS ── */}
      <div className="ep-section">
        <p className="ep-section__title">Recommended Events</p>
        <div className="ep-events-grid">
          {allEventsData.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>

      {/* ── ALL EVENTS ── */}
      <div className="ep-section">
        <p className="ep-section__title">All Events</p>

        {/* Filters */}
        <div className="ep-filters">
          <button className="ep-filter-btn">
            <SlidersIcon /> Filters
          </button>
          {timeFilters.map((f) => (
            <button
              key={f}
              className={`ep-filter-btn${activeFilter === f ? " ep-filter-btn--active" : ""}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Filtered grid */}
        {filteredEvents.length > 0 ? (
          <div className="ep-events-grid">
            {filteredEvents.map((event) => (
              <EventCard key={`all-${event.id}`} event={event} />
            ))}
          </div>
        ) : (
          <p style={{ color: "#979797", fontFamily: "Inter", marginTop: "16px" }}>
            No events match "{query}".
          </p>
        )}
      </div>

    </div>
  );
}
