import { useMemo, useState, useEffect, useRef } from "react";
import "./EventPage.css";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEventsContext } from "../../context/EventsContext";
import { toDate } from "../../utils/dataFormatters";
import { EVENT_CATEGORY_CONFIG } from "./eventCategoryConfig";
import { useDocument } from "../../hooks/useFirestore";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../components/AuthModal/useAuthModal";
import { COLLECTIONS, db } from "../../services/firebase";
import { saveFavoriteEvent, removeFavoriteEvent } from "../../services/commerceService";
import LocationModal from "../../components/layout/bottomNav/LocationModal";

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

function BookmarkIcon({ active = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={active ? "var(--green, #50d735)" : "none"}
      stroke={active ? "var(--green, #50d735)" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SlidersIcon({ color = "currentColor" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
      <line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="6" r="2" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="15" cy="12" r="2" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="9" cy="18" r="2" fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}



export function EventCard({ event, isBookmarked: propIsBookmarked, onToggleBookmark }) {
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const [internalBookmarked, setInternalBookmarked] = useState(() => {
    try {
      const local = JSON.parse(localStorage.getItem("nitroxx_bookmarked_events") || "[]");
      return local.includes(event?.id);
    } catch {
      return false;
    }
  });

  // If user is logged in, and propIsBookmarked is not provided, listen to document
  useEffect(() => {
    if (propIsBookmarked !== undefined || !user?.uid || !event?.id) return;
    try {
      const unsub = db()
        .collection(COLLECTIONS.users || "users")
        .doc(user.uid)
        .collection("bookmark")
        .doc(event.id)
        .onSnapshot((snap) => {
          setInternalBookmarked(snap.exists);
        });
      return () => unsub();
    } catch {
      // ignore
    }
  }, [propIsBookmarked, user?.uid, event?.id]);

  const isBookmarked = propIsBookmarked !== undefined ? propIsBookmarked : internalBookmarked;

  const handleBookmarkClick = async (clickEvent) => {
    clickEvent.preventDefault();
    clickEvent.stopPropagation();

    if (onToggleBookmark) {
      onToggleBookmark(event, clickEvent);
      return;
    }

    if (!user) {
      openLogin();
      return;
    }

    const nextState = !isBookmarked;
    setInternalBookmarked(nextState);

    try {
      const localSaved = JSON.parse(localStorage.getItem("nitroxx_bookmarked_events") || "[]");
      if (nextState) {
        if (!localSaved.includes(event.id)) {
          localStorage.setItem("nitroxx_bookmarked_events", JSON.stringify([...localSaved, event.id]));
        }
      } else {
        localStorage.setItem(
          "nitroxx_bookmarked_events",
          JSON.stringify(localSaved.filter((i) => i !== event.id))
        );
      }
    } catch {
      // ignore
    }

    try {
      if (nextState) {
        await saveFavoriteEvent({ userId: user.uid, event });
      } else {
        await removeFavoriteEvent({ userId: user.uid, eventId: event.id });
      }
    } catch (err) {
      console.error("Failed to update bookmark:", err);
      setInternalBookmarked(!nextState);
    }
  };

  const image = event.bannerImage || event.banner || event.image;
  const priceDisplay = event.priceText || (event.price === 0 ? "Free" : event.price ? `₹${event.price}` : "Free");
  const locationDisplay = event.venue || event.location || event.city || event.address || "";

  // Dynamic throttled count matching the UI: "16k+ are Throttled!"
  const throttledDisplay = useMemo(() => {
    if (event.throttledText) return event.throttledText;
    if (event.throttledCount) return `${event.throttledCount} are Throttled!`;
    if (event.throttleCount) return `${event.throttleCount} are Throttled!`;
    if (event.attendeesCount) return `${event.attendeesCount} are Throttled!`;
    const seed = String(event.id || event.title || event.name || "nx")
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const count = (seed % 18) + 2;
    return `${count}k+ are Throttled!`;
  }, [event]);

  return (
    <Link className="ep-event-card" to={`/event/${event.id}`}>
      <div className="ep-event-card__image">
        {image ? <img src={image} alt={event.name || event.title} /> : <span>No image</span>}
        <button
          type="button"
          className={`ep-event-card__bookmark${isBookmarked ? " ep-event-card__bookmark--active" : ""}`}
          onClick={handleBookmarkClick}
          aria-label={isBookmarked ? "Remove bookmark" : "Bookmark event"}
          title={isBookmarked ? "Bookmarked" : "Bookmark event"}
        >
          <BookmarkIcon active={isBookmarked} />
        </button>
      </div>
      <div className="ep-event-card__info">
        <div className="ep-event-card__title-row">
          <div className="ep-event-card__name" title={event.name || event.title}>
            {event.name || event.title}
          </div>
          <div className="ep-event-card__price">{priceDisplay}</div>
        </div>
        {locationDisplay ? (
          <div className="ep-event-card__location">{locationDisplay}</div>
        ) : (
          <div className="ep-event-card__location">{event.dateText || event.dateTimeText || "India"}</div>
        )}
        <div className="ep-event-card__throttled">{throttledDisplay}</div>
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

  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const [bookmarkedEventIds, setBookmarkedEventIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("nitroxx_bookmarked_events") || "[]"));
    } catch {
      return new Set();
    }
  });

  // Sync bookmarks in real-time
  useEffect(() => {
    if (!user?.uid) return;

    try {
      const unsub = db()
        .collection(COLLECTIONS.users || "users")
        .doc(user.uid)
        .collection("bookmark")
        .onSnapshot(
          (snap) => {
            const ids = new Set();
            snap.forEach((doc) => {
              ids.add(doc.id);
              if (doc.data()?.eventId) {
                ids.add(doc.data().eventId);
              }
            });
            setBookmarkedEventIds(ids);

            try {
              localStorage.setItem(
                "nitroxx_bookmarked_events",
                JSON.stringify(Array.from(ids))
              );
            } catch {
              // ignore
            }
          },
          (err) => {
            console.warn("Error listening to user bookmarks:", err);
          }
        );

      return () => unsub();
    } catch (err) {
      console.warn("Firestore bookmark collection listener failed:", err);
    }
  }, [user?.uid]);

  const handleToggleBookmark = async (event, clickEvent) => {
    if (clickEvent) {
      clickEvent.preventDefault();
      clickEvent.stopPropagation();
    }
    if (!event?.id) return;
    if (!user) {
      openLogin();
      return;
    }

    const isCurrentlyBookmarked = bookmarkedEventIds.has(event.id);
    const nextIds = new Set(bookmarkedEventIds);

    if (isCurrentlyBookmarked) {
      nextIds.delete(event.id);
    } else {
      nextIds.add(event.id);
    }
    setBookmarkedEventIds(nextIds);

    try {
      localStorage.setItem("nitroxx_bookmarked_events", JSON.stringify(Array.from(nextIds)));
    } catch {
      // ignore
    }

    try {
      if (!isCurrentlyBookmarked) {
        await saveFavoriteEvent({ userId: user.uid, event });
      } else {
        await removeFavoriteEvent({ userId: user.uid, eventId: event.id });
      }
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
      setBookmarkedEventIds(bookmarkedEventIds);
    }
  };

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

  const allEventsSectionRef = useRef(null);
  const [isStickyNavVisible, setIsStickyNavVisible] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!allEventsSectionRef.current) return;
      const rect = allEventsSectionRef.current.getBoundingClientRect();
      setIsStickyNavVisible(rect.top <= 120);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSelectCity = (city) => {
    setSelectedCity(city);
    localStorage.setItem("selectedCity", city);
    window.dispatchEvent(new Event("locationChanged"));
    setIsLocationModalOpen(false);
  };

  const upcomingTrackRef = useRef(null);

  const scrollUpcoming = (direction) => {
    if (!upcomingTrackRef.current) return;
    const scrollAmount = 340 * 2;
    upcomingTrackRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const toggleToday = () => {
    if (filterDate === "Today" || activeFilter === "Today") {
      setFilterDate("All");
      setActiveFilter("All");
    } else {
      setFilterDate("Today");
      setActiveFilter("Today");
    }
  };

  const toggleTomorrow = () => {
    setFilterDate((prev) => (prev === "Tomorrow" ? "All" : "Tomorrow"));
  };

  const toggleWeekend = () => {
    setFilterDate((prev) => (prev === "Weekend" ? "All" : "Weekend"));
  };

  const toggleFree = () => {
    if (filterPrice === "Free" || activeFilter === "Free") {
      setFilterPrice("All");
      setActiveFilter("All");
    } else {
      setFilterPrice("Free");
      setActiveFilter("Free");
    }
  };

  const togglePaid = () => {
    if (filterPrice === "Paid" || activeFilter === "Paid") {
      setFilterPrice("All");
      setActiveFilter("All");
    } else {
      setFilterPrice("Paid");
      setActiveFilter("Paid");
    }
  };

  const activeCategory = searchParams.get("category") || "All";

  const toggleCategory = (catId) => {
    const newParams = new URLSearchParams(searchParams);
    if (activeCategory === catId) {
      newParams.delete("category");
    } else {
      newParams.set("category", catId);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setActiveFilter("All");
    setFilterDate("All");
    setFilterPrice("All");
    setSearchParams({});
    setQuery("");
  };

  const isTodayActive = filterDate === "Today" || activeFilter === "Today";
  const isTomorrowActive = filterDate === "Tomorrow";
  const isWeekendActive = filterDate === "Weekend";
  const isFreeActive = filterPrice === "Free" || activeFilter === "Free";
  const isPaidActive = filterPrice === "Paid" || activeFilter === "Paid";

  const activeFiltersCount =
    (filterDate !== "All" ? 1 : 0) +
    (filterPrice !== "All" ? 1 : 0) +
    (activeCategory !== "All" ? 1 : 0) +
    (activeFilter !== "All" && activeFilter !== "Today" && activeFilter !== "Free" && activeFilter !== "Paid" ? 1 : 0) +
    (selectedCity ? 1 : 0);

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

  const currentEvent = useMemo(
    () => heroEvents[activeSlide] || heroEvents[0] || {},
    [heroEvents, activeSlide]
  );

  const displayDate = useMemo(() => {
    if (!currentEvent) return "";

    const explicit = currentEvent.dateTimeText || currentEvent.rawEvent?.dateTimeText;
    if (explicit && typeof explicit === "string" && /[a-zA-Z]{3,}/.test(explicit) && !explicit.includes("T00:00") && !explicit.includes("Z")) {
      return explicit;
    }

    const raw =
      currentEvent.date ||
      currentEvent.eventDate ||
      currentEvent.startsAt ||
      currentEvent.startDate ||
      explicit ||
      currentEvent.rawEvent?.date ||
      currentEvent.rawEvent?.eventDate ||
      currentEvent.rawEvent?.startsAt ||
      currentEvent.rawEvent?.startDate;

    const timeStr =
      currentEvent.time ||
      currentEvent.startTime ||
      currentEvent.rawEvent?.time ||
      currentEvent.rawEvent?.startTime ||
      "";

    if (raw) {
      if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
        const [y, m, d] = raw.trim().split("-").map(Number);
        const dateObj = new Date(y, m - 1, d);
        const formatted = new Intl.DateTimeFormat("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(dateObj);
        return timeStr ? `${formatted}, ${timeStr}` : formatted;
      }

      const d = toDate(raw);
      if (d && !Number.isNaN(d.getTime())) {
        const hasTime = Boolean(timeStr) || d.getHours() !== 0 || d.getMinutes() !== 0;
        const options = {
          weekday: "short",
          day: "numeric",
          month: "short",
          ...(d.getFullYear() !== new Date().getFullYear() ? { year: "numeric" } : {}),
          ...(hasTime ? { hour: "numeric", minute: "2-digit" } : {}),
        };
        const formatted = new Intl.DateTimeFormat("en-IN", options).format(d);
        if (timeStr && !hasTime) {
          return `${formatted}, ${timeStr}`;
        }
        return formatted;
      }
    }

    if (currentEvent.dateText) {
      return timeStr ? `${currentEvent.dateText}, ${timeStr}` : currentEvent.dateText;
    }

    return "";
  }, [currentEvent]);

  const displayPrice = useMemo(() => {
    if (currentEvent.price === 0) return "Free";
    const pt = currentEvent.priceText;
    if (!pt) return "Free";
    const str = String(pt).trim();
    if (str.toLowerCase() === "free" || str === "₹0" || str === "0") return "Free";

    let clean = str.replace(/^starts\s+from\s+/i, "").trim();
    if (clean === "₹0" || clean === "0" || clean.toLowerCase() === "free") return "Free";
    if (!clean.toLowerCase().includes("onwards")) {
      clean = `${clean} onwards`;
    }
    return clean;
  }, [currentEvent.price, currentEvent.priceText]);

  const handleHeroAction = (event) => {
    const target = event || currentEvent;
    if (!target) return;
    if (target.redirectUrl) {
      if (target.redirectUrl.startsWith("http://") || target.redirectUrl.startsWith("https://")) {
        window.open(target.redirectUrl, "_blank");
      } else {
        navigate(target.redirectUrl);
      }
    } else if (target.eventId) {
      navigate(`/event/${target.eventId}`);
    } else if (target.id && !String(target.id).startsWith("slide-")) {
      navigate(`/event/${target.id}`);
    } else {
      navigate("/events");
    }
  };

  const handleHeroBook = (event) => {
    const target = event || currentEvent;
    if (!target) return;
    if (target.redirectUrl) {
      if (target.redirectUrl.startsWith("http://") || target.redirectUrl.startsWith("https://")) {
        window.open(target.redirectUrl, "_blank");
      } else {
        navigate(target.redirectUrl);
      }
    } else if (target.eventId) {
      navigate(`/event/${target.eventId}/book`);
    } else if (target.id && !String(target.id).startsWith("slide-")) {
      navigate(`/event/${target.id}/book`);
    } else {
      navigate("/events");
    }
  };

  const handleSlideClick = (index, event) => {
    if (index !== activeSlide) {
      setActiveSlide(index);
    } else {
      handleHeroAction(event);
    }
  };

  const touchStartXRef = useRef(0);
  const isSwipingRef = useRef(false);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  const handleTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartXRef.current = e.touches[0].clientX;
    isSwipingRef.current = true;
    setIsHeroPaused(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwipingRef.current || !e.touches || e.touches.length === 0) return;
  };

  const handleTouchEnd = (e) => {
    setIsHeroPaused(false);
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;
    const touchEndX = e.changedTouches?.[0]?.clientX;
    if (touchEndX === undefined) return;
    const diffX = touchStartXRef.current - touchEndX;
    const minSwipeDistance = 35;
    if (diffX > minSwipeDistance) {
      next();
    } else if (diffX < -minSwipeDistance) {
      prev();
    }
  };

  useEffect(() => {
    if (isHeroPaused || !heroEvents || heroEvents.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prevIndex) => (prevIndex + 1) % heroEvents.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isHeroPaused, heroEvents, next]);

  return (
    <div className="ep-page">
      {/* District-by-Zomato inspired Sticky Top Navbar */}
      <div className={`ep-sticky-nav${isStickyNavVisible ? " ep-sticky-nav--visible" : ""}`}>
        {/* Row 1: Brand, Location, Nav Tabs, Search, Profile */}
        <div className="ep-sticky-nav__header">
          <div className="ep-sticky-nav__brand-col">
            <Link to="/" className="ep-sticky-nav__logo">
              <div className="ep-sticky-nav__logo-title">
                NITRO<span className="logo-x">X</span>X
              </div>
              <div className="ep-sticky-nav__logo-sub">BY NITROXX</div>
            </Link>

            <button
              type="button"
              className="ep-sticky-nav__location"
              onClick={() => setIsLocationModalOpen(true)}
              title="Change location"
            >
              <div className="ep-sticky-nav__location-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="ep-sticky-nav__location-text">
                <span className="ep-sticky-nav__location-city">{selectedCity || "Select City"}</span>
                <span className="ep-sticky-nav__location-sub">
                  {selectedCity ? "Current location" : "Set location"}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
                </span>
              </div>
            </button>
          </div>

          <div className="ep-sticky-nav__tabs">
            <Link to="/" className="ep-sticky-nav__tab">For you</Link>
            <Link to="/events" className="ep-sticky-nav__tab ep-sticky-nav__tab--active">Events</Link>
            <Link to="/accessories" className="ep-sticky-nav__tab">Accessories</Link>
          </div>

          <div className="ep-sticky-nav__actions">
            <div className="ep-sticky-nav__search-wrap">
              <span className="ep-sticky-nav__search-icon">
                <SearchIcon color="#7c3aed" />
              </span>
              <input
                className="ep-sticky-nav__search-input"
                type="search"
                placeholder="Search for events, movies and restaurants"
                value={query}
                onFocus={() => navigate('/events/search')}
                onClick={() => navigate('/events/search')}
                onChange={(e) => {
                  setQuery(e.target.value);
                  navigate(`/events/search?q=${encodeURIComponent(e.target.value)}`);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && query.trim()) {
                    navigate(`/events/search?q=${encodeURIComponent(query.trim())}`);
                  }
                }}
              />
              {query && (
                <button
                  type="button"
                  className="ep-sticky-nav__search-clear"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <Link to="/profile" className="ep-sticky-nav__profile" title="My Profile">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#9ca3af" stroke="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm0 14c-2.03 0-4.43-.82-6.14-2.88C7.55 15.8 9.68 15 12 15s4.45.8 6.14 2.12C16.43 19.18 14.03 20 12 20z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Row 2: Filter Options Bar */}
        <div className="ep-sticky-nav__filter-bar">
          <div className="ep-sticky-nav__filter-scroll">
            <button
              type="button"
              className={`ep-sticky-pill ep-sticky-pill--filters${activeFiltersCount > 0 ? " ep-sticky-pill--has-count" : ""}`}
              onClick={() => setIsFilterDrawerOpen(true)}
            >
              <SlidersIcon color="#111827" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="ep-sticky-pill__badge">{activeFiltersCount}</span>
              )}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            <button
              type="button"
              className={`ep-sticky-pill${isTodayActive ? " ep-sticky-pill--active" : ""}`}
              onClick={toggleToday}
            >
              Today
            </button>

            <button
              type="button"
              className={`ep-sticky-pill${isTomorrowActive ? " ep-sticky-pill--active" : ""}`}
              onClick={toggleTomorrow}
            >
              Tomorrow
            </button>

            <button
              type="button"
              className={`ep-sticky-pill${isWeekendActive ? " ep-sticky-pill--active" : ""}`}
              onClick={toggleWeekend}
            >
              This Weekend
            </button>

            <button
              type="button"
              className={`ep-sticky-pill${isFreeActive ? " ep-sticky-pill--active" : ""}`}
              onClick={toggleFree}
            >
              Free
            </button>

            <button
              type="button"
              className={`ep-sticky-pill${isPaidActive ? " ep-sticky-pill--active" : ""}`}
              onClick={togglePaid}
            >
              Paid
            </button>

            {eventCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`ep-sticky-pill${activeCategory === cat.id ? " ep-sticky-pill--active" : ""}`}
                onClick={() => toggleCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}

            {(activeFiltersCount > 0 || query) && (
              <button
                type="button"
                className="ep-sticky-pill ep-sticky-pill--clear"
                onClick={clearAllFilters}
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectCity={handleSelectCity}
        currentCity={selectedCity}
        onAutoDetect={() => {}}
        isDetecting={false}
      />
      {/* <div className="ep-hero__flex">
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
      </div> */}

      {eventsLoading ? (
        <EmptyState title="Loading events" text="Fetching live events from Firestore." />
      ) : !liveEvents.length && !heroEvents.length ? (
        <EmptyState title="No live events yet" text="Publish events from the Event Dashboard and they will appear here automatically." />
      ) : (
        <>
          <div
            className="ep-featured-wrap"
            onMouseEnter={() => setIsHeroPaused(true)}
            onMouseLeave={() => setIsHeroPaused(false)}
          >
            <div
              className="ep-featured__blurred-bg"
              style={{
                backgroundImage: currentEvent.bannerImage || currentEvent.banner
                  ? `url(${currentEvent.bannerImage || currentEvent.banner})`
                  : 'none'
              }}
            />
            <div className="ep-featured__bg-overlay" />
            <div className="ep-featured">
              {heroEvents.length > 1 && (
                <button
                  type="button"
                  className="ep-featured__slider-btn prev"
                  aria-label="Previous slide"
                  onClick={prev}
                >
                  <ChevronLeft />
                </button>
              )}

              <div className="ep-featured__container">
                <div className="ep-featured__info">
                  {displayDate && (
                    <div className="ep-featured__date-line">{displayDate}</div>
                  )}

                  <h2
                    className="ep-featured__title"
                    onClick={() => handleHeroAction(currentEvent)}
                    title={currentEvent.title || currentEvent.name}
                  >
                    {currentEvent.title || currentEvent.name}
                  </h2>

                  {currentEvent.location && (
                    <div className="ep-featured__location-line">
                      {currentEvent.location}
                    </div>
                  )}

                  <div className="ep-featured__price-line">
                    {displayPrice}
                  </div>

                  <button
                    type="button"
                    className="ep-featured__book-btn"
                    onClick={() => handleHeroBook(currentEvent)}
                  >
                    Book tickets
                  </button>
                </div>

                <div
                  className="ep-featured__viewport"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div
                    className="ep-featured__track"
                    style={{ transform: `translateX(-${activeSlide * 100}%)` }}
                  >
                    {heroEvents.map((event, index) => (
                      <div
                        key={event.id || index}
                        className={`ep-featured__slide${index === activeSlide ? " ep-featured__slide--active" : ""}`}
                        onClick={() => handleSlideClick(index, event)}
                        title={event.title || event.name}
                      >
                        <div className="ep-banner-card">
                          <div className="ep-banner-card__inner">
                            {event.bannerImage || event.banner ? (
                              <img
                                src={event.bannerImage || event.banner}
                                alt={event.title || event.name}
                                loading={index === 0 ? "eager" : "lazy"}
                              />
                            ) : (
                              <div className="ep-slide-placeholder">{event.title || `Event ${index + 1}`}</div>
                            )}
                            <div className="ep-banner-card__overlay" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {heroEvents.length > 1 && (
                <button
                  type="button"
                  className="ep-featured__slider-btn next"
                  aria-label="Next slide"
                  onClick={next}
                >
                  <ChevronRight />
                </button>
              )}
            </div>

            {heroEvents.length > 1 && (
              <div className="ep-dots">
                {heroEvents.map((event, index) => (
                  <button
                    key={event.id || index}
                    type="button"
                    className={`ep-dot${index === activeSlide ? " ep-dot--active" : ""}`}
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
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

          {/* Section: Events Near You (Crimson Banner Card matching screenshot) */}
          <div className="ep-section ep-section--near-banner">
            <Link to="/events/near-you" className="ep-near-you-banner">
              <div className="ep-near-you-banner__content">
                <h3 className="ep-near-you-banner__title">Events Near You</h3>
                <p className="ep-near-you-banner__subtitle">
                  {selectedCity
                    ? `There are ${nearMeEvents.length} events in ${selectedCity}`
                    : `There are ${liveEvents.length} events near you`}
                </p>
              </div>
              <span className="ep-near-you-banner__arrow">
                <ChevronRight />
              </span>
            </Link>
          </div>

          {/* Section: Upcoming Event > (Screenshot-inspired Horizontal Carousel) */}
          <div className="ep-section ep-section--upcoming-carousel">
            <div className="ep-upcoming-header">
              <Link to="/events/upcoming" className="ep-upcoming-header__link">
                <h2 className="ep-upcoming-header__title">
                  Upcoming Event
                  <span className="ep-upcoming-header__chevron">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </h2>
              </Link>
              <p className="ep-upcoming-header__subtitle">Latest upcoming events listed here</p>
            </div>

            {upcomingEventsList.length > 0 ? (
              <div className="ep-upcoming-carousel-wrap">
                <button
                  type="button"
                  className="ep-upcoming-arrow prev"
                  onClick={() => scrollUpcoming("left")}
                  aria-label="Previous upcoming events"
                >
                  <ChevronLeft />
                </button>

                <div className="ep-upcoming-track" ref={upcomingTrackRef}>
                  {upcomingEventsList.map((event) => (
                    <div className="ep-upcoming-item" key={`upcoming-slide-${event.id}`}>
                      <EventCard
                        event={event}
                        isBookmarked={bookmarkedEventIds.has(event.id)}
                        onToggleBookmark={handleToggleBookmark}
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="ep-upcoming-arrow next"
                  onClick={() => scrollUpcoming("right")}
                  aria-label="Next upcoming events"
                >
                  <ChevronRight />
                </button>
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
                  <EventCard
                    key={`top-${event.id}`}
                    event={event}
                    isBookmarked={bookmarkedEventIds.has(event.id)}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No top events yet"
                text="Top events will appear here."
              />
            )}
          </div>

          <div className="ep-section" ref={allEventsSectionRef}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <p className="ep-section__title" style={{ margin: 0 }}>All Events</p>
              <Link
                to="/events/all"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  color: "#50d735",
                  textDecoration: "none",
                  padding: "5px 14px",
                  borderRadius: "999px",
                  background: "rgba(80, 215, 53, 0.08)",
                  border: "1px solid rgba(80, 215, 53, 0.2)",
                  transition: "all 0.2s ease",
                }}
              >
                <span>View Full Page</span>
                <span style={{ fontSize: "1.05rem", lineHeight: 1 }}>→</span>
              </Link>
            </div>
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
                {filteredEvents.map((event) => (
                  <EventCard
                    key={`all-${event.id}`}
                    event={event}
                    isBookmarked={bookmarkedEventIds.has(event.id)}
                    onToggleBookmark={handleToggleBookmark}
                  />
                ))}
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
