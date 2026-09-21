import { useMemo, useState, useEffect } from "react";
import "./EventPage.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEventsContext } from "../../context/EventsContext";
import { toDate } from "../../utils/dataFormatters";
import { EVENT_CATEGORY_CONFIG } from "./eventCategoryConfig";
import { useDocument } from "../../hooks/useFirestore";

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

  // Fetch dynamic page layout config from Firestore (page_layouts > events_layout)
  const { data: eventsLayoutDoc } = useDocument("page_layouts", "events_layout");
  const { data: fallbackEventsDoc } = useDocument("page_layouts", "events");
  const layoutData = eventsLayoutDoc || fallbackEventsDoc;

  const rawSlides =
    layoutData?.heroSlides ||
    layoutData?.data?.heroSlides ||
    layoutData?.banners ||
    layoutData?.data?.banners ||
    (Array.isArray(layoutData?.data) ? layoutData.data : null);

  const rawCategories = layoutData?.categories || layoutData?.data?.categories;

  const displayedCategories = useMemo(() => {
    if (rawCategories && Array.isArray(rawCategories) && rawCategories.length > 0) {
      return rawCategories.map((cat, idx) => {
        let slug = "";
        if (cat.redirectUrl && cat.redirectUrl.includes("category=")) {
          slug = cat.redirectUrl.split("category=")[1].split("&")[0];
        } else if (cat.slug) {
          slug = cat.slug;
        } else if (cat.title || cat.label) {
          slug = (cat.title || cat.label).toLowerCase().replace(/\s+/g, "_");
        } else {
          slug = `cat-${idx}`;
        }
        return {
          id: slug,
          label: cat.title || cat.label || "Category",
          image: cat.imageUrl || cat.image || "",
          redirectUrl: cat.redirectUrl,
        };
      });
    }

    if (categories && categories.length > 0) {
      return categories;
    }
    return EVENT_CATEGORY_CONFIG.map((cfg) => ({
      id: cfg.slug,
      label: cfg.category,
      image: "",
    }));
  }, [rawCategories, categories]);

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

  // Map dynamic hero slides from page_layouts or fallback to upcoming live events
  const heroEvents = useMemo(() => {
    if (rawSlides && Array.isArray(rawSlides) && rawSlides.length > 0) {
      const validSlides = rawSlides.filter((slide) => {
        return (
          (slide.imageUrl && String(slide.imageUrl).trim()) ||
          slide.eventId ||
          (slide.title && String(slide.title).trim()) ||
          (slide.eventName && String(slide.eventName).trim())
        );
      });

      if (validSlides.length > 0) {
        return validSlides.map((slide, index) => {
          const matchedEvent = slide.eventId
            ? events.find((e) => String(e.id) === String(slide.eventId))
            : null;

          const title =
            slide.title ||
            slide.eventName ||
            matchedEvent?.title ||
            matchedEvent?.name ||
            `Featured Event ${index + 1}`;

          const image =
            slide.imageUrl ||
            slide.bannerImage ||
            slide.banner ||
            matchedEvent?.bannerImage ||
            matchedEvent?.banner ||
            "";

          const dateText =
            slide.date ||
            matchedEvent?.dateTimeText ||
            matchedEvent?.dateText ||
            "";

          const location =
            slide.venue ||
            matchedEvent?.location ||
            "";

          let priceText = "";
          if (slide.price !== undefined && slide.price !== null && String(slide.price).trim() !== "") {
            const p = String(slide.price).trim();
            priceText = p.toLowerCase() === "free" || p.startsWith("₹") ? p : `₹${p}`;
          } else if (matchedEvent?.priceText) {
            priceText = matchedEvent.priceText;
          } else if (matchedEvent?.price !== undefined && matchedEvent?.price !== null) {
            priceText = matchedEvent.price === 0 ? "Free" : `₹${matchedEvent.price}`;
          } else {
            priceText = "Free";
          }

          const eventId = slide.eventId || matchedEvent?.id || slide.id || `slide-${index}`;
          const redirectUrl =
            slide.redirectUrl ||
            (slide.eventId ? `/event/${slide.eventId}` : matchedEvent?.id ? `/event/${matchedEvent.id}` : "");

          return {
            id: eventId,
            eventId: slide.eventId || matchedEvent?.id,
            title,
            name: title,
            subtitle: slide.subtitle || "",
            badge: slide.badge || "",
            bannerImage: image,
            banner: image,
            dateTimeText: dateText,
            dateText: dateText,
            location,
            priceText,
            redirectUrl,
            rawEvent: matchedEvent,
          };
        });
      }
    }

    // Fallback: If no custom layout is configured, use upcoming live events
    let upcomingEvents = liveEvents.filter((event) => {
      const startsAt = toDate(event.date || event.eventDate || event.startsAt || event.startDate);
      return !startsAt || startsAt.setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0);
    });
    if (upcomingEvents.length === 0) upcomingEvents = liveEvents;
    return upcomingEvents.slice(0, 5);
  }, [rawSlides, events, liveEvents]);

  // Section 1: Events Near Me
  const nearMeEvents = useMemo(() => {
    if (!liveEvents || liveEvents.length === 0) return [];

    if (selectedCity && selectedCity.trim()) {
      const cityLower = selectedCity.trim().toLowerCase();
      const matched = liveEvents.filter((event) => {
        const loc = String(event.location || "").toLowerCase();
        const city = String(event.city || "").toLowerCase();
        const venue = String(event.venue || "").toLowerCase();
        const address = String(event.address || "").toLowerCase();
        return (
          loc.includes(cityLower) ||
          city.includes(cityLower) ||
          venue.includes(cityLower) ||
          address.includes(cityLower)
        );
      });
      if (matched.length > 0) return matched;
    }

    const withLocation = liveEvents.filter(
      (event) => event.location || event.city || event.venue
    );
    return withLocation.length > 0 ? withLocation : liveEvents;
  }, [liveEvents, selectedCity]);

  // Section 2: Upcoming Events
  const upcomingEventsList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = liveEvents.filter((event) => {
      const startsAt = toDate(event.date || event.eventDate || event.startsAt || event.startDate);
      return !startsAt || startsAt.getTime() >= today.getTime();
    });

    return (upcoming.length > 0 ? upcoming : liveEvents).sort(
      (a, b) => eventSortTime(a) - eventSortTime(b)
    );
  }, [liveEvents]);

  // Section 3: Top Events
  const topEvents = useMemo(() => {
    if (!liveEvents || liveEvents.length === 0) return [];

    const featuredIds = layoutData?.featuredEventIds || layoutData?.data?.featuredEventIds || [];

    const scored = [...liveEvents].map((event) => {
      let score = 0;
      if (featuredIds.includes(event.id)) score += 1000;
      if (event.isTop || event.top || event.topEvent) score += 500;
      if (event.featured || event.isFeatured) score += 300;
      if (event.rating) score += Number(event.rating) * 20;
      if (event.registeredCount) score += Number(event.registeredCount);
      if (event.bookingsCount) score += Number(event.bookingsCount);
      return { event, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.event);
  }, [liveEvents, layoutData]);

  const total = Math.max(heroEvents.length, 1);
  const prev = () => setActiveSlide((previous) => (previous - 1 + total) % total);
  const next = () => setActiveSlide((previous) => (previous + 1) % total);

  useEffect(() => {
    if (activeSlide >= heroEvents.length && heroEvents.length > 0) {
      setActiveSlide(0);
    }
  }, [heroEvents.length, activeSlide]);

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
      ) : !liveEvents.length && !heroEvents.length ? (
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
                  {currentEvent.badge && (
                    <span className="ep-featured__badge">{currentEvent.badge}</span>
                  )}
                  {Boolean(currentEvent.dateTimeText || currentEvent.dateText) && (
                    <p className="ep-featured__date">{currentEvent.dateTimeText || currentEvent.dateText}</p>
                  )}
                  <h2 className="ep-featured__title">{currentEvent.title || currentEvent.name}</h2>
                  {currentEvent.subtitle && (
                    <p className="ep-featured__subtitle">{currentEvent.subtitle}</p>
                  )}
                  {currentEvent.location && (
                    <p className="ep-featured__location">{currentEvent.location}</p>
                  )}
                  <p className="ep-featured__price">
                    <span>{currentEvent.priceText || "Free"}</span>
                    {currentEvent.priceText && currentEvent.priceText !== "Free" && !currentEvent.priceText.startsWith("Starts from") && !currentEvent.priceText.includes("onwards") ? " onwards" : ""}
                  </p>
                  <button
                    className="ep-featured__book-btn"
                    onClick={() => {
                      if (currentEvent.redirectUrl) {
                        if (currentEvent.redirectUrl.startsWith("http://") || currentEvent.redirectUrl.startsWith("https://")) {
                          window.open(currentEvent.redirectUrl, "_blank");
                        } else {
                          navigate(currentEvent.redirectUrl);
                        }
                      } else if (currentEvent.eventId) {
                        navigate(`/event/${currentEvent.eventId}/book`);
                      } else if (currentEvent.id && !String(currentEvent.id).startsWith("slide-")) {
                        navigate(`/event/${currentEvent.id}/book`);
                      } else {
                        navigate("/events");
                      }
                    }}
                  >
                    Book tickets
                  </button>
                </div>

                <div className="ep-featured__viewport">
                  <div className="ep-featured__track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
                    {heroEvents.map((event, index) => (
                      <div
                        key={event.id || index}
                        className={`ep-featured__slide${index === activeSlide ? " ep-featured__slide--active" : ""}`}
                        onClick={() => setActiveSlide(index)}
                        style={{ cursor: "pointer" }}
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
                              <div className="ep-slide-placeholder">{event.title || `Event ${index + 1}`}</div>
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
                  key={event.id || index}
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

          {/* Section: Events Near Me */}
          <div className="ep-section">
            <p className="ep-section__title">
              Events Near Me
              {selectedCity && (
                <span className="ep-section__subtitle-tag"> — {selectedCity}</span>
              )}
            </p>
            {nearMeEvents.length > 0 ? (
              <div className="ep-events-grid">
                {nearMeEvents.slice(0, 6).map((event) => (
                  <EventCard key={`near-${event.id}`} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No events near you"
                text={selectedCity ? `No events found in ${selectedCity} right now.` : "No nearby events available."}
              />
            )}
          </div>

          {/* Section: Upcoming Events */}
          <div className="ep-section">
            <p className="ep-section__title">Upcoming Events</p>
            {upcomingEventsList.length > 0 ? (
              <div className="ep-events-grid">
                {upcomingEventsList.slice(0, 6).map((event) => (
                  <EventCard key={`upcoming-${event.id}`} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No upcoming events"
                text="Stay tuned! Exciting new events are being planned."
              />
            )}
          </div>

          {/* Section: Top Events */}
          <div className="ep-section">
            <p className="ep-section__title">Top Events</p>
            {topEvents.length > 0 ? (
              <div className="ep-events-grid">
                {topEvents.slice(0, 6).map((event) => (
                  <EventCard key={`top-${event.id}`} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No top events yet"
                text="Top events will appear here."
              />
            )}
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
