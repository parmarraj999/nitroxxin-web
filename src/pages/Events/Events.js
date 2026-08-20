import { useMemo, useState, useEffect } from "react";
import "./EventPage.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEventsContext } from "../../context/EventsContext";
import { toDate } from "../../utils/dataFormatters";
import { EVENT_CATEGORY_CONFIG } from "./eventCategoryConfig";

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
      <path d="M1 16L9 8.5L1 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 10 17" fill="none">
      <path d="M9 16L1 8.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
      </div>
      <div className="ep-event-card__info">
        <div className="ep-event-card__name">{event.name || event.title}</div>
        <div className="ep-event-card__meta">
          <span className="ep-event-card__date">{event.dateText || event.dateTimeText}</span>
          <span className="ep-event-card__sep" />
          <span className="ep-event-card__price">{event.priceText || "Free"}</span>
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
  const displayedCategories = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories;
    }
    return EVENT_CATEGORY_CONFIG.map((cfg) => ({
      id: cfg.slug,
      label: cfg.category,
      image: "",
    }));
  }, [categories]);

  const [query, setQuery] = useState("");
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All");

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCity, setSelectedCity] = useState(localStorage.getItem('selectedCity') || "");

  // Advanced Filter state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [filterPrice, setFilterPrice] = useState("All"); // All, Free, Under500, Under1000, Paid
  const [filterDate, setFilterDate] = useState("All"); // All, Today, Tomorrow, Weekend, NextWeek
  const [sortBy, setSortBy] = useState("DateSoonest"); // DateSoonest, PriceLowHigh, PriceHighLow

  // Listen to city changes
  useEffect(() => {
    const handleLocationChange = () => {
      setSelectedCity(localStorage.getItem('selectedCity') || "");
    };
    window.addEventListener('locationChanged', handleLocationChange);
    window.addEventListener('storage', handleLocationChange);
    return () => {
      window.removeEventListener('locationChanged', handleLocationChange);
      window.removeEventListener('storage', handleLocationChange);
    };
  }, []);

  const activeCategory = searchParams.get("category") || "All";

  const liveEvents = useMemo(
    () =>
      events
        .filter(isVisibleEvent)
        .sort((first, second) => eventSortTime(first) - eventSortTime(second)),
    [events]
  );

  const eventCategories = displayedCategories;

  let upcomingEvents = liveEvents.filter((event) => {
    const startsAt = toDate(event.date || event.eventDate || event.startsAt || event.startDate);
    return !startsAt || startsAt.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0);
  });
  if (upcomingEvents.length === 0) upcomingEvents = liveEvents;
  const heroEvents = upcomingEvents.slice(0, 5);
  const total = Math.max(heroEvents.length, 1);
  const prev = () => setActiveSlide((previous) => (previous - 1 + total) % total);
  const next = () => setActiveSlide((previous) => (previous + 1) % total);

  const filteredEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const term = query.trim().toLowerCase();

    let result = liveEvents.filter((event) => {
      const startsAt = toDate(event.date || event.eventDate || event.startsAt || event.startDate);
      const price = Number(event.price || event.ticketPrice || event.startingPrice || 0);

      // Search match
      const matchesSearch =
        !term ||
        [event.name, event.title, event.category, event.location, event.organizerName]
          .some((value) => String(value || "").toLowerCase().includes(term));
      if (!matchesSearch) return false;

      // Location match (selected city)
      if (selectedCity) {
        const matchesCity =
          String(event.location || "").toLowerCase().includes(selectedCity.toLowerCase()) ||
          String(event.city || "").toLowerCase().includes(selectedCity.toLowerCase());
        if (!matchesCity) return false;
      }

      // Category match (URL parameter)
      if (activeCategory !== "All") {
        const matchesCategory =
          String(event.category || "").toLowerCase() === activeCategory.toLowerCase() ||
          String(event.categoryId || "").toLowerCase() === activeCategory.toLowerCase() ||
          (displayedCategories.find(c => c.id === activeCategory)?.label || "").toLowerCase() === String(event.category || "").toLowerCase();
        if (!matchesCategory) return false;
      }

      // Quick filter
      if (activeFilter === "Today") {
        if (!startsAt || startsAt.toDateString() !== today.toDateString()) return false;
      } else if (activeFilter === "Upcoming") {
        if (startsAt && startsAt < today) return false;
      } else if (activeFilter === "Free") {
        if (price !== 0) return false;
      } else if (activeFilter === "Paid") {
        if (price === 0) return false;
      } else if (activeFilter === "VIP") {
        const isVip = String(event.type || event.ticketType || "").toLowerCase().includes("vip");
        if (!isVip) return false;
      }

      // Sidebar Date filter
      if (filterDate === "Today") {
        if (!startsAt || startsAt.toDateString() !== today.toDateString()) return false;
      } else if (filterDate === "Tomorrow") {
        if (!startsAt || startsAt.toDateString() !== tomorrow.toDateString()) return false;
      } else if (filterDate === "Weekend") {
        if (!startsAt) return false;
        const eventDay = startsAt.getDay();
        const isWeekend = eventDay === 0 || eventDay === 6; // Sat or Sun
        if (!isWeekend) return false;
      } else if (filterDate === "NextWeek") {
        if (!startsAt) return false;
        const next7Days = new Date(today);
        next7Days.setDate(today.getDate() + 7);
        if (startsAt < today || startsAt > next7Days) return false;
      }

      // Sidebar Price filter
      if (filterPrice === "Free") {
        if (price !== 0) return false;
      } else if (filterPrice === "Under500") {
        if (price > 500) return false;
      } else if (filterPrice === "Under1000") {
        if (price > 1000) return false;
      } else if (filterPrice === "Paid") {
        if (price < 1000) return false;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      const dateA = toDate(a.date || a.eventDate || a.startsAt || a.startDate || a.createdAt);
      const dateB = toDate(b.date || b.eventDate || b.startsAt || b.startDate || b.createdAt);
      const timeA = dateA ? dateA.getTime() : Number.MAX_SAFE_INTEGER;
      const timeB = dateB ? dateB.getTime() : Number.MAX_SAFE_INTEGER;

      const priceA = Number(a.price || a.ticketPrice || a.startingPrice || 0);
      const priceB = Number(b.price || b.ticketPrice || b.startingPrice || 0);

      if (sortBy === "DateSoonest") {
        return timeA - timeB;
      } else if (sortBy === "PriceLowHigh") {
        return priceA - priceB;
      } else if (sortBy === "PriceHighLow") {
        return priceB - priceA;
      }
      return 0;
    });

    return result;
  }, [activeFilter, activeCategory, displayedCategories, liveEvents, query, selectedCity, filterDate, filterPrice, sortBy]);

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
          <div
            className="ep-featured-wrap"
            style={{
              backgroundImage: currentEvent.bannerImage || currentEvent.banner
                ? `url(${currentEvent.bannerImage || currentEvent.banner})`
                : 'none'
            }}
          >
            <div className="ep-featured__bg-overlay" />
            <div className="ep-featured">
              <button className="ep-featured__slider-btn prev" aria-label="Previous" onClick={prev}><ChevronLeft /></button>

              <div className="ep-featured__container">
                <div className="ep-featured__info">
                  <p className="ep-featured__date">{currentEvent.dateTimeText || currentEvent.dateText}</p>
                  <h2 className="ep-featured__title">{currentEvent.title || currentEvent.name}</h2>
                  <p className="ep-featured__location">{currentEvent.location}</p>
                  <p className="ep-featured__price">
                    <span>{currentEvent.priceText || "Free"}</span>
                    {currentEvent.priceText && currentEvent.priceText !== "Free" && !currentEvent.priceText.startsWith("Starts from") ? " onwards" : ""}
                  </p>
                  <button className="ep-featured__book-btn" onClick={() => navigate(`/event/${currentEvent.id}/book`)}>
                    Book tickets
                  </button>
                </div>

                <div className="ep-featured__viewport">
                  <div className="ep-featured__track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
                    {heroEvents.map((event, index) => (
                      <div
                        key={event.id}
                        className={`ep-featured__slide${index === activeSlide ? " ep-featured__slide--active" : ""}`}
                      >
                        <div className="ep-stamp-card">
                          <div className="ep-stamp-perforations top" />
                          <div className="ep-stamp-perforations bottom" />
                          <div className="ep-stamp-perforations left" />
                          <div className="ep-stamp-perforations right" />
                          <div className="ep-stamp-inner">
                            {event.bannerImage || event.banner ? (
                              <img src={event.bannerImage || event.banner} alt={event.title || event.name} />
                            ) : (
                              <div className="ep-slide-placeholder">Event {index + 1}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button className="ep-featured__slider-btn next" aria-label="Next" onClick={next}><ChevronRight /></button>
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
                  <Link
                    to={activeCategory === cat.id ? "/events" : `/events?category=${cat.id}`}
                    key={cat.id}
                    className={`ep-cat-card${activeCategory === cat.id ? " ep-cat-card--active" : ""}`}
                  >
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
              <button className="ep-filter-btn" onClick={() => setIsFilterDrawerOpen(true)}><SlidersIcon /> Filters</button>
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

            {/* Active Filter Tags */}
            {(filterDate !== "All" || filterPrice !== "All" || activeCategory !== "All" || selectedCity) && (
              <div className="ep-active-tags">
                {selectedCity && (
                  <span className="ep-tag">
                    City: {selectedCity}
                    <button className="ep-tag__close" onClick={() => {
                      localStorage.removeItem('selectedCity');
                      window.dispatchEvent(new Event('locationChanged'));
                    }}>×</button>
                  </span>
                )}
                {activeCategory !== "All" && (
                  <span className="ep-tag">
                    Category: {displayedCategories.find(c => c.id === activeCategory)?.label || activeCategory}
                    <button className="ep-tag__close" onClick={() => setSearchParams({})}>×</button>
                  </span>
                )}
                {filterDate !== "All" && (
                  <span className="ep-tag">
                    Date: {filterDate === "Weekend" ? "This Weekend" : filterDate === "NextWeek" ? "Next 7 Days" : filterDate}
                    <button className="ep-tag__close" onClick={() => setFilterDate("All")}>×</button>
                  </span>
                )}
                {filterPrice !== "All" && (
                  <span className="ep-tag">
                    Price: {filterPrice === "Under500" ? "Under ₹500" : filterPrice === "Under1000" ? "Under ₹1000" : filterPrice === "Paid" ? "₹1000+" : filterPrice}
                    <button className="ep-tag__close" onClick={() => setFilterPrice("All")}>×</button>
                  </span>
                )}
                <button className="ep-clear-all-btn" onClick={() => {
                  setFilterDate("All");
                  setFilterPrice("All");
                  setSearchParams({});
                }}>Clear All</button>
              </div>
            )}

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

      {/* Advanced Filter Drawer */}
      {isFilterDrawerOpen && (
        <div className="ep-drawer-backdrop" onClick={() => setIsFilterDrawerOpen(false)}>
          <div className="ep-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ep-drawer__header">
              <h3>Filters & Sort</h3>
              <button className="ep-drawer__close-btn" onClick={() => setIsFilterDrawerOpen(false)}>×</button>
            </div>

            <div className="ep-drawer__content">
              {/* Sort Section */}
              <div className="ep-drawer__section">
                <h4>Sort By</h4>
                <div className="ep-drawer__options-grid">
                  <button
                    className={`ep-drawer__option-btn${sortBy === "DateSoonest" ? " active" : ""}`}
                    onClick={() => setSortBy("DateSoonest")}
                  >
                    Soonest Date
                  </button>
                  <button
                    className={`ep-drawer__option-btn${sortBy === "PriceLowHigh" ? " active" : ""}`}
                    onClick={() => setSortBy("PriceLowHigh")}
                  >
                    Price: Low to High
                  </button>
                  <button
                    className={`ep-drawer__option-btn${sortBy === "PriceHighLow" ? " active" : ""}`}
                    onClick={() => setSortBy("PriceHighLow")}
                  >
                    Price: High to Low
                  </button>
                </div>
              </div>

              {/* Category Filter Section */}
              {displayedCategories && displayedCategories.length > 0 && (
                <div className="ep-drawer__section">
                  <h4>Category</h4>
                  <div className="ep-drawer__options-grid">
                    <button
                      className={`ep-drawer__option-btn${activeCategory === "All" ? " active" : ""}`}
                      onClick={() => {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete("category");
                        setSearchParams(newParams);
                      }}
                    >
                      All Categories
                    </button>
                    {displayedCategories.map((cat) => (
                      <button
                        key={cat.id}
                        className={`ep-drawer__option-btn${activeCategory === cat.id ? " active" : ""}`}
                        onClick={() => {
                          const newParams = new URLSearchParams(searchParams);
                          newParams.set("category", cat.id);
                          setSearchParams(newParams);
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Filter Section */}
              <div className="ep-drawer__section">
                <h4>Date</h4>
                <div className="ep-drawer__options-grid">
                  {["All", "Today", "Tomorrow", "Weekend", "NextWeek"].map((dateOpt) => (
                    <button
                      key={dateOpt}
                      className={`ep-drawer__option-btn${filterDate === dateOpt ? " active" : ""}`}
                      onClick={() => setFilterDate(dateOpt)}
                    >
                      {dateOpt === "All" ? "Any Date" : dateOpt === "Weekend" ? "This Weekend" : dateOpt === "NextWeek" ? "Next 7 Days" : dateOpt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter Section */}
              <div className="ep-drawer__section">
                <h4>Price</h4>
                <div className="ep-drawer__options-grid">
                  {["All", "Free", "Under500", "Under1000", "Paid"].map((priceOpt) => (
                    <button
                      key={priceOpt}
                      className={`ep-drawer__option-btn${filterPrice === priceOpt ? " active" : ""}`}
                      onClick={() => setFilterPrice(priceOpt)}
                    >
                      {priceOpt === "All" ? "Any Price" : priceOpt === "Under500" ? "Under ₹500" : priceOpt === "Under1000" ? "Under ₹1000" : priceOpt === "Paid" ? "₹1000+" : priceOpt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="ep-drawer__footer">
              <button className="ep-drawer__reset-btn" onClick={() => {
                setFilterDate("All");
                setFilterPrice("All");
                setSortBy("DateSoonest");
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("category");
                setSearchParams(newParams);
              }}>
                Reset All
              </button>
              <button className="ep-drawer__apply-btn" onClick={() => setIsFilterDrawerOpen(false)}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
