import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import EventSearchModal from "../../../components/EventSearchModal/EventSearchModal";

export default function EventSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialQuery = searchParams.get("q") || searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "All";

  return (
    <div style={{ minHeight: "100vh", background: "#0f1115" }}>
      <EventSearchModal
        isOpen={true}
        onClose={() => navigate("/events")}
        initialQuery={initialQuery}
        initialCategory={initialCategory}
      />
    </div>
  );
}
