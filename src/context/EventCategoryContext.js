import React, { createContext, useContext, useMemo } from "react";
import { useEventsContext } from "./EventsContext";

const EventCategoryContext = createContext(null);

export function EventCategoryProvider({ children }) {
  const { displayedCategories, layoutData, categoriesLoading } = useEventsContext();

  const value = useMemo(
    () => ({
      categories: displayedCategories,
      categoryCards: displayedCategories,
      rawCategories: layoutData?.categories || layoutData?.data?.categories,
      layoutData,
      loading: categoriesLoading,
      error: null,
    }),
    [displayedCategories, layoutData, categoriesLoading]
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
