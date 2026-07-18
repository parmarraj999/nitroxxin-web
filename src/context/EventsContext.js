import { createContext, useContext, useMemo } from "react";
import { useCollection } from "../hooks/useFirestore";
import { COLLECTIONS } from "../services/firebase";
import { normalizeCategory, normalizeEvent } from "../services/normalizers";

const EventsContext = createContext();

export function EventsProvider({ children }) {
  // Fetch a base set of events (e.g. 120 most recent/relevant) and categories
  const eventsQuery = useCollection(COLLECTIONS.events, { limit: 120 });
  const categoriesQuery = useCollection(COLLECTIONS.eventCategories, { limit: 20 });
  
  const events = useMemo(() => eventsQuery.data.map(normalizeEvent), [eventsQuery.data]);
  const categories = useMemo(() => categoriesQuery.data.map(normalizeCategory), [categoriesQuery.data]);

  const value = {
    events,
    eventsLoading: eventsQuery.loading,
    categories,
    categoriesLoading: categoriesQuery.loading,
  };

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEventsContext() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error("useEventsContext must be used within an EventsProvider");
  }
  return context;
}
