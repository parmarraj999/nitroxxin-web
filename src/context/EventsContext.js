import React, { createContext, useContext, useMemo, useEffect } from "react";
import { useCollection, useDocument } from "../hooks/useFirestore";
import { COLLECTIONS } from "../services/firebase";
import { normalizeCategory, normalizeEvent } from "../services/normalizers";
import { toDate } from "../utils/dataFormatters";
import { EVENT_CATEGORY_CONFIG } from "../pages/Events/eventCategoryConfig";

const CACHE_KEY = "nx_events_cache_v2";

const loadCachedEvents = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY) || localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (_) {}
  return null;
};

export const isVisibleEvent = (event) => {
  if (!event) return false;
  const st = String(event?.status || "").toLowerCase().trim();
  const clean = st.replace(/[_\s-]+/g, "");
  return (
    st === "published" ||
    st === "active" ||
    st === "approved" ||
    clean === "soldout" ||
    st.includes("sold out") ||
    st === "completed" ||
    !st
  );
};

export const eventSortTime = (event) => {
  if (!event) return Number.MAX_SAFE_INTEGER;
  const date = toDate(event.date || event.eventDate || event.startsAt || event.startDate || event.createdAt);
  return date ? date.getTime() : Number.MAX_SAFE_INTEGER;
};

const EventsContext = createContext(null);

export function EventsProvider({ children }) {
  const initialCache = useMemo(() => loadCachedEvents(), []);

  // 1. Fetch live events and categories collection
  const eventsQuery = useCollection(COLLECTIONS.events, { limit: 120 });
  const categoriesQuery = useCollection(COLLECTIONS.eventCategories, { limit: 20 });

  // 2. Fetch events layout configuration (for heroSlides and dynamic categories)
  const eventsLayoutQuery = useDocument("page_layouts", "events_layout");
  const fallbackEventsQuery = useDocument("page_layouts", "events");
  const singularEventsQuery = useDocument("page_layout", "events_layout");

  // Normalized events: Use live data if present, otherwise instantly fallback to cached data
  const events = useMemo(() => {
    if (eventsQuery.data && eventsQuery.data.length > 0) {
      return eventsQuery.data.map(normalizeEvent);
    }
    if (initialCache?.events && initialCache.events.length > 0) {
      return initialCache.events;
    }
    return [];
  }, [eventsQuery.data, initialCache]);

  // Normalized categories
  const categories = useMemo(() => {
    if (categoriesQuery.data && categoriesQuery.data.length > 0) {
      return categoriesQuery.data.map(normalizeCategory);
    }
    if (initialCache?.categories && initialCache.categories.length > 0) {
      return initialCache.categories;
    }
    return [];
  }, [categoriesQuery.data, initialCache]);

  // Merged layout data
  const layoutData = useMemo(() => {
    const doc =
      eventsLayoutQuery.data ||
      fallbackEventsQuery.data ||
      singularEventsQuery.data ||
      initialCache?.layoutData;
    return doc || null;
  }, [eventsLayoutQuery.data, fallbackEventsQuery.data, singularEventsQuery.data, initialCache]);

  // Raw hero slides / banners from layout
  const rawSlides = useMemo(() => {
    if (!layoutData) return initialCache?.rawSlides || [];
    return (
      layoutData.heroSlides ||
      layoutData.data?.heroSlides ||
      layoutData.banners ||
      layoutData.data?.banners ||
      (Array.isArray(layoutData.data) ? layoutData.data : [])
    );
  }, [layoutData, initialCache]);

  // Dynamic / configured event categories
  const displayedCategories = useMemo(() => {
    const rawCategories = layoutData?.categories || layoutData?.data?.categories;

    if (rawCategories && Array.isArray(rawCategories) && rawCategories.length > 0) {
      return rawCategories.map((cat, idx) => {
        let slug = "";
        if (cat.redirectUrl && cat.redirectUrl.includes("category=") && cat.redirectUrl.split("category=")[1].split("&")[0]) {
          slug = cat.redirectUrl.split("category=")[1].split("&")[0];
        } else if (cat.slug) {
          slug = cat.slug;
        } else if (cat.title || cat.label) {
          slug = (cat.title || cat.label).toLowerCase().replace(/\s+/g, "_");
        } else {
          slug = `cat-${idx}`;
        }
        const label = cat.title || cat.label || "Category";
        const image = cat.imageUrl || cat.image || "";
        return {
          id: slug,
          label,
          title: label,
          image,
          imageUrl: image,
          redirectUrl: cat.redirectUrl,
          targetUrl: cat.redirectUrl || `/events/all?category=${encodeURIComponent(slug)}`,
        };
      });
    }

    if (initialCache?.displayedCategories && initialCache.displayedCategories.length > 0) {
      return initialCache.displayedCategories;
    }

    if (categories && categories.length > 0) {
      return categories;
    }

    return EVENT_CATEGORY_CONFIG.map((cfg) => ({
      id: cfg.slug,
      label: cfg.category,
      title: cfg.category,
      image: "",
      imageUrl: "",
      redirectUrl: `/events/all?category=${encodeURIComponent(cfg.slug)}`,
      targetUrl: `/events/all?category=${encodeURIComponent(cfg.slug)}`,
    }));
  }, [layoutData, categories, initialCache]);

  // Live visible events sorted by soonest date
  const liveEvents = useMemo(() => {
    return events
      .filter(isVisibleEvent)
      .sort((a, b) => eventSortTime(a) - eventSortTime(b));
  }, [events]);

  // Hero events mapped from slides or fallback to upcoming live events
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

  // Persist to sessionStorage and localStorage for zero-latency hydration
  useEffect(() => {
    if (events.length > 0 || layoutData) {
      try {
        const payload = {
          events,
          categories,
          layoutData,
          rawSlides,
          displayedCategories,
          savedAt: Date.now(),
        };
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      } catch (_) {}
    }
  }, [events, categories, layoutData, rawSlides, displayedCategories]);

  // Loading flags are false if cached data exists, preventing blank screens/spinners
  const eventsLoading = eventsQuery.loading && events.length === 0;
  const categoriesLoading = categoriesQuery.loading && categories.length === 0;

  const value = useMemo(
    () => ({
      events,
      eventsLoading,
      categories,
      categoriesLoading,
      layoutData,
      rawSlides,
      displayedCategories,
      liveEvents,
      heroEvents,
      refetchEvents: eventsQuery.retry,
    }),
    [
      events,
      eventsLoading,
      categories,
      categoriesLoading,
      layoutData,
      rawSlides,
      displayedCategories,
      liveEvents,
      heroEvents,
      eventsQuery.retry,
    ]
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEventsContext() {
  const context = useContext(EventsContext);
  if (context === undefined || context === null) {
    throw new Error("useEventsContext must be used within an EventsProvider");
  }
  return context;
}

export default EventsContext;
