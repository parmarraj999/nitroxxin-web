import React, { createContext, useContext, useMemo } from "react";
import { useDocument } from "../hooks/useFirestore";
import { EVENT_CATEGORY_CONFIG } from "../pages/Events/eventCategoryConfig";

const EventCategoryContext = createContext(null);

export function EventCategoryProvider({ children }) {
  // Fetch dynamic page layout config from Firestore:
  // Checks page_layouts > events_layout, page_layout > events_layout, and fallback page_layouts > events
  const { data: pluralDoc, loading: pluralLoading, error: pluralError } = useDocument("page_layouts", "events_layout");
  const { data: singularDoc } = useDocument("page_layout", "events_layout");
  const { data: fallbackDoc } = useDocument("page_layouts", "events");

  const layoutData = pluralDoc || singularDoc || fallbackDoc;
  const rawCategories = layoutData?.categories || layoutData?.data?.categories;

  const categories = useMemo(() => {
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

        const image = cat.imageUrl || cat.image || "";
        const label = cat.title || cat.label || "Category";

        return {
          id: slug,
          label,
          title: label,
          image,
          imageUrl: image,
          redirectUrl: cat.redirectUrl,
          targetUrl: `/events/all?category=${encodeURIComponent(slug)}`,
        };
      });
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
  }, [rawCategories]);

  const value = useMemo(
    () => ({
      categories,
      categoryCards: categories,
      rawCategories,
      layoutData,
      loading: pluralLoading && !layoutData,
      error: pluralError,
    }),
    [categories, rawCategories, layoutData, pluralLoading, pluralError]
  );

  return (
    <EventCategoryContext.Provider value={value}>
      {children}
    </EventCategoryContext.Provider>
  );
}

export function useEventCategoryContext() {
  const context = useContext(EventCategoryContext);
  if (context === undefined || context === null) {
    throw new Error("useEventCategoryContext must be used within an EventCategoryProvider");
  }
  return context;
}

export const useEventCategories = useEventCategoryContext;
export default EventCategoryContext;
