/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import "./eventDetail.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDocument } from "../../../hooks/useFirestore";
import { COLLECTIONS, db } from "../../../services/firebase";
import { normalizeEvent } from "../../../services/normalizers";
import { useEventsContext } from "../../../context/EventsContext";
import {
  saveFavoriteEvent,
  removeFavoriteEvent,
  saveEventLike,
  removeEventLike,
} from "../../../services/commerceService";
import { useAuth } from "../../../context/AuthContext";
import { useAuthModal } from "../../../components/AuthModal/useAuthModal";
import { formatCategoryValue, getCategoryDetails } from "../eventCategoryConfig";

const listFrom = (...values) =>
  values.flatMap((value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "object") return Object.values(value);
    return [value];
  }).filter(Boolean);

const ExpandableText = ({ text, maxLength = 150 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!text) return null;
  if (text.length <= maxLength) return <p className="ed-itin-text">{text}</p>;
  return (
    <div>
      <p className="ed-itin-text">
        {isExpanded ? text : `${text.slice(0, maxLength)}...`}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ background: 'transparent', border: 'none', color: 'var(--green)', fontSize: '13px', cursor: 'pointer', padding: 0, marginTop: '4px', fontWeight: '600' }}
      >
        {isExpanded ? 'Read Less' : 'Read More'}
      </button>
    </div>
  );
};

export default function EventDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { events, eventsLoading } = useEventsContext();

  const eventFromContext = events.find((e) => e.id === id);

  const fallbackQuery = useDocument(COLLECTIONS.events, !eventFromContext && !eventsLoading ? id : null);

  const event = eventFromContext || (fallbackQuery.data ? normalizeEvent(fallbackQuery.data) : null);
  const loading = eventsLoading || (fallbackQuery.loading && !eventFromContext);

  const relatedEvents = events;
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showFullItinerary, setShowFullItinerary] = useState(false);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sync bookmark state with Firestore & localStorage
  useEffect(() => {
    if (!event?.id) return;

    // Check localStorage first
    try {
      const localSaved = JSON.parse(localStorage.getItem("nitroxx_bookmarked_events") || "[]");
      if (localSaved.includes(event.id)) {
        setIsBookmarked(true);
      }
    } catch {
      // ignore
    }

    if (!user?.uid) return;

    try {
      const unsub = db()
        .collection(COLLECTIONS.users || "users")
        .doc(user.uid)
        .collection("bookmark")
        .doc(event.id)
        .onSnapshot(
          (snap) => {
            if (snap.exists) {
              setIsBookmarked(true);
            } else {
              // Fallback check in wishlist collection
              db()
                .collection(COLLECTIONS.wishlist)
                .doc(`${user.uid}_event_${event.id}`)
                .get()
                .then((wishSnap) => {
                  if (wishSnap.exists) setIsBookmarked(true);
                  else setIsBookmarked(false);
                })
                .catch(() => setIsBookmarked(false));
            }

            try {
              const localSaved = JSON.parse(localStorage.getItem("nitroxx_bookmarked_events") || "[]");
              if (snap.exists && !localSaved.includes(event.id)) {
                localStorage.setItem("nitroxx_bookmarked_events", JSON.stringify([...localSaved, event.id]));
              } else if (!snap.exists && localSaved.includes(event.id)) {
                localStorage.setItem(
                  "nitroxx_bookmarked_events",
                  JSON.stringify(localSaved.filter((i) => i !== event.id))
                );
              }
            } catch {
              // ignore
            }
          },
          (err) => {
            console.warn("Error listening to event bookmark:", err);
          }
        );

      return () => unsub();
    } catch (err) {
      console.warn("Firestore bookmark listener failed:", err);
    }
  }, [user?.uid, event?.id]);

  // Sync like state with Firestore & localStorage
  useEffect(() => {
    if (!event?.id) return;

    // Check localStorage first
    try {
      const localLikes = JSON.parse(localStorage.getItem("nitroxx_liked_events") || "[]");
      if (localLikes.includes(event.id)) {
        setIsLiked(true);
      }
    } catch {
      // ignore
    }

    if (!user?.uid) return;

    try {
      const unsub = db()
        .collection(COLLECTIONS.eventLikes || "event_likes")
        .doc(`${user.uid}_${event.id}`)
        .onSnapshot(
          (snap) => {
            setIsLiked(snap.exists);
            try {
              const localLikes = JSON.parse(localStorage.getItem("nitroxx_liked_events") || "[]");
              if (snap.exists && !localLikes.includes(event.id)) {
                localStorage.setItem("nitroxx_liked_events", JSON.stringify([...localLikes, event.id]));
              } else if (!snap.exists && localLikes.includes(event.id)) {
                localStorage.setItem(
                  "nitroxx_liked_events",
                  JSON.stringify(localLikes.filter((i) => i !== event.id))
                );
              }
            } catch {
              // ignore
            }
          },
          (err) => {
            console.warn("Error listening to event like:", err);
          }
        );

      return () => unsub();
    } catch (err) {
      console.warn("Firestore like listener failed:", err);
    }
  }, [user?.uid, event?.id]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/events");
    }
  };

  const handleToggleBookmark = async () => {
    if (!event) return;
    if (!user) {
      openLogin();
      return;
    }

    const nextState = !isBookmarked;
    setIsBookmarked(nextState);

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
      setIsBookmarked(!nextState);
    }
  };

  const handleToggleLike = async () => {
    if (!event) return;

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);

    try {
      const localLikes = JSON.parse(localStorage.getItem("nitroxx_liked_events") || "[]");
      if (nextLiked) {
        if (!localLikes.includes(event.id)) {
          localStorage.setItem("nitroxx_liked_events", JSON.stringify([...localLikes, event.id]));
        }
      } else {
        localStorage.setItem(
          "nitroxx_liked_events",
          JSON.stringify(localLikes.filter((i) => i !== event.id))
        );
      }
    } catch {
      // ignore
    }

    if (user?.uid) {
      try {
        if (nextLiked) {
          await saveEventLike({ userId: user.uid, eventId: event.id });
        } else {
          await removeEventLike({ userId: user.uid, eventId: event.id });
        }
      } catch (err) {
        console.warn("Failed to sync like with Firestore:", err);
      }
    }
  };

  const gallery = event?.images?.length ? event.images : [event?.image || event?.banner].filter(Boolean);

  useEffect(() => {
    if (lightboxIndex === null && !showTerms) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setLightboxIndex(null);
        setShowTerms(false);
      }
      if (e.key === "ArrowLeft" && gallery.length > 1) {
        setLightboxIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
      }
      if (e.key === "ArrowRight" && gallery.length > 1) {
        setLightboxIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, showTerms, gallery.length]);

  const openLightbox = (index) => {
    setLightboxIndex(index);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
  };

  const navHeader = (
    <header className="ed-navbar">
      <div className="ed-navbar-blur" />
      <div className="ed-navbar-inner">
        <button
          type="button"
          className="ed-nav-btn ed-back-btn"
          onClick={handleBack}
          aria-label="Go back"
          title="Go back"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {event && (
          <div className="ed-nav-actions">
            <button
              type="button"
              className={`ed-nav-btn ed-bookmark-btn ${isBookmarked ? "ed-nav-btn--bookmarked" : ""}`}
              onClick={handleToggleBookmark}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark event"}
              title={isBookmarked ? "Bookmarked" : "Bookmark event"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill={isBookmarked ? "#50d735" : "none"}
                stroke={isBookmarked ? "#50d735" : "currentColor"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>

          </div>
        )}
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="event-detail-page">
        {navHeader}
        <div className="nx-empty-state" style={{ paddingTop: 120 }}>
          <h3>Loading event</h3>
          <p>Fetching event details from Firestore.</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-detail-page">
        {navHeader}
        <div className="nx-empty-state" style={{ paddingTop: 120 }}>
          <h3>Event not available</h3>
          <p>This event is not published or could not be found in Firestore.</p>
          <button className="ed-book-btn" onClick={() => navigate("/events")}>Browse Events</button>
        </div>
      </div>
    );
  }

  const thingsToKnow = listFrom(
    event?.duration && `Duration: ${event?.duration}`,
    event?.ageLimit && `Age limit: ${event?.ageLimit}`,
    event?.parking && `Parking: ${event?.parking}`,
    event?.rules,
    event?.highlights
  );
  const agenda = listFrom(event.agenda, event.timeline);
  const faqs = listFrom(event.faqs);
  const related = relatedEvents
    .filter((item) => item.id !== event.id)
    .filter((item) => item.category === event.category || item.hostId === event.hostId)
    .slice(0, 4);
  const seatsLeft = Math.max(0, Number(event.capacity || 0) - Number(event.registeredCount || 0));
  const categoryDetails = getCategoryDetails(event);


  return (
    <div className="event-detail-page">
      {navHeader}
      <div className="event-detail-scroll-container">
        <div className="event-detail-canvas">

          {/* ── Gallery ── */}
          <div className="ed-gallery-wrap">
            {/* Banner – first image full width */}
            {gallery[0] && (
              <div className="ed-gallery-banner" onClick={() => openLightbox(0)}>
                <img src={event.bannerImage || gallery[0]} alt={event?.title || event?.name} className="ed-gallery-banner-img" />
                <div className="ed-gallery-banner-overlay" />
              </div>
            )}

            {/* Thumbnail grid – remaining images */}
            {gallery.length > 1 && (
              <div className={`ed-gallery-grid ed-gallery-grid--${Math.min(gallery.length - 1, 4)}`}>
                {gallery.slice(1, 5).map((src, i) => {
                  const isLast = i === 3 && gallery.length > 5;
                  return (
                    <div key={i} className="ed-gallery-thumb" onClick={() => openLightbox(i + 1)}>
                      <img src={src} alt={`${event?.title || event?.name} ${i + 2}`} className="ed-gallery-thumb-img" />
                      {isLast && (
                        <div className="ed-gallery-more-overlay">
                          <span>+{gallery.length - 5} more</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="ed-event-title">{event.title || event.name}</p>
          <p className="ed-event-meta">
            {event.category && <span className="ed-event-category">{event.category}</span>}
            <span className="ed-event-date">{event.dateTimeText || event.dateText}</span>
            <span className="ed-event-location"> | {event.location}</span>
          </p>

          <div className="ed-body-row">
            <div className="ed-body-left">
              {/* ── About ── */}
              <p className="ed-section-heading ed-about-heading">About</p>
              <p className="ed-about-text">{event.description || event.about || "Organizer has not added a description yet."}</p>

              {/* ── Itinerary ── */}
              {event.itinerary?.length > 0 && (
                <section className="ed-itinerary-section">
                  <p className="ed-section-heading ed-itin-heading">Itinerary</p>
                  <div className="ed-itin-list">
                    {(showFullItinerary ? event.itinerary : event.itinerary.slice(0, 1)).map((item, idx) => {
                      const type = item.type || (item.text ? "text" : item.url ? "image" : "text");
                      const typeLabel = type === "pdf" ? "PDF" : type === "image" ? "Photo" : "Info";
                      return (
                        <div className="ed-itin-item" key={idx}>
                          {/* Step number bubble */}
                          {/* <div className="ed-itin-num">{idx + 1}</div> */}
                          {/* Card */}
                          <div className="ed-itin-content">
                            <div className="ed-itin-card">
                              {/* Header: type pill + title */}
                              <div className="ed-itin-card-header">
                                <span className={`ed-itin-type-pill ed-itin-type-pill--${type}`}>{typeLabel}</span>
                                {item.title && <p className="ed-itin-title">{item.title}</p>}
                              </div>
                              {/* Text body */}
                              {(type === "text" || item.text) && item.text && (
                                <ExpandableText text={item.text} maxLength={120} />
                              )}
                              {/* Image */}
                              {type === "image" && item.url && (
                                <img src={item.url} alt={item.title || `Step ${idx + 1}`} className="ed-itin-img" />
                              )}
                              {/* PDF */}
                              {type === "pdf" && item.url && (
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="ed-itin-pdf-link">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                                  <span>Open Document</span>
                                </a>
                              )}
                              {/* Extra description */}
                              {item.description && type !== "text" && (
                                <p className="ed-itin-text" style={{ marginTop: 8 }}>{item.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {event.itinerary.length > 1 && (
                    <div style={{ marginTop: '16px', textAlign: 'center' }}>
                      <button
                        onClick={() => setShowFullItinerary(!showFullItinerary)}
                        className="ed-book-btn"
                        style={{ padding: '8px 20px', fontSize: '13px', background: 'rgba(255,255,255,0.1)', color: 'white', boxShadow: 'none' }}
                      >
                        {showFullItinerary ? 'Show Less' : `View Full Itinerary (${event.itinerary.length})`}
                      </button>
                    </div>
                  )}
                </section>
              )}

              {/* ── Category Details ── */}
              {categoryDetails?.details?.length > 0 && (
                <>
                  <p className="ed-section-heading ed-category-heading">{categoryDetails.config?.category} Details</p>
                  <div className="ed-category-grid">
                    {categoryDetails.details.map((field) => {
                      const isLongText = typeof field.value === 'string' && field.value.length > 60;
                      return (
                        <div className={`ed-category-item ${isLongText ? 'ed-category-item--wide' : ''}`} key={field.id} style={{ height: 'fit-content' }}>
                          <p className="ed-category-label">{field.label}</p>
                          <p className="ed-category-value">{formatCategoryValue(field.value, field)}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ── Trip Support ── */}
              {event.tripSupport && event.tripSupport.length > 0 && (
                <>
                  <p className="ed-section-heading ed-things-heading">Trip Support</p>
                  <ol className="ed-things-list">
                    {event.tripSupport.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ol>
                </>
              )}

              {/* ── Mandatory Rider Requirements ── */}
              {event.mandatoryRequirements && event.mandatoryRequirements.length > 0 && (
                <>
                  <p className="ed-section-heading ed-things-heading">Mandatory Rider Requirements</p>
                  <ol className="ed-things-list">
                    {event.mandatoryRequirements.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ol>
                </>
              )}

              {/* ── Things to know ── */}
              {thingsToKnow.length > 0 && (
                <>
                  <p className="ed-section-heading ed-things-heading">Things to know</p>
                  <ol className="ed-things-list">
                    {thingsToKnow.map((item) => <li key={item}>{item}</li>)}
                  </ol>
                </>
              )}

              {/* ── Agenda ── */}
              {agenda.length > 0 && (
                <>
                  <p className="ed-section-heading ed-more-heading">Agenda</p>
                  <ol className="ed-things-list">{agenda.map((item) => <li key={JSON.stringify(item)}>{typeof item === "object" ? `${item.time || ""} ${item.title || item.name || item.description || ""}` : item}</li>)}</ol>
                </>
              )}

              {/* ── More ── */}
              <p className="ed-section-heading ed-more-heading">More</p>
              <div className="ed-more-card">
                <div className="ed-more-row"><p className="ed-more-label">FAQs: {faqs.length ? `${faqs.length} answers available` : "Organizer has not added FAQs yet"}</p></div>
                {(event.termsAndConditions || event.terms) && (
                  <>
                    <div className="ed-divider-thin" />
                    <div className="ed-more-row" onClick={() => setShowTerms(true)} style={{ cursor: "pointer" }}>
                      <p className="ed-more-label">Terms & Conditions</p>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "rgba(255,255,255,0.5)" }}><path d="m9 18 6-6-6-6" /></svg>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Right column ── */}
            <div className="ed-right-col">
              {/* Info Card */}
              <div className="ed-info-card">
                <div className="ed-info-row">
                  <div className="ed-info-icon-box"><svg xmlns="http://www.w3.org/2000/svg" color="white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg></div>
                  <div className="ed-info-text"><p className="ed-info-label">{event.location || event.city}</p><p className="ed-info-sub">{event.venue || event.address || "Venue details from organizer"}{event.city ? `, ${event.city}` : ""}{event.state ? `, ${event.state}` : ""}</p></div>
                </div>
                <div className="ed-divider-thin" />
                <div className="ed-info-row">
                  <div className="ed-info-icon-box"><svg xmlns="http://www.w3.org/2000/svg" color="white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 14v2.2l1.6 1" /><path d="M16 2v4" /><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" /><path d="M3 10h5" /><path d="M8 2v4" /><circle cx="16" cy="16" r="6" /></svg></div>
                  <div className="ed-info-text">
                    <p className="ed-info-label">{event.startDate || event.dateText}{event.startTime ? ` · ${event.startTime}` : ""}</p>
                    <p className="ed-info-sub">{event.endDate ? `Ends ${event.endDate}` : ""}{event.endTime ? ` · ${event.endTime}` : ""}</p>
                  </div>
                </div>
                <div className="ed-divider-thin" />
                <div className="ed-info-row">
                  <div className="ed-info-icon-box"><svg xmlns="http://www.w3.org/2000/svg" color="white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M16 3.128a4 4 0 0 1 0 7.744" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx="9" cy="7" r="4" /></svg></div>
                  <div className="ed-info-text"><p className="ed-info-label">{seatsLeft || "Limited"} seats available</p><p className="ed-info-sub">Out of {event.capacity || "—"} total capacity</p></div>
                </div>
                {(event.registrationStart || event.registrationEnd) && (
                  <>
                    <div className="ed-divider-thin" />
                    <div className="ed-info-row">
                      <div className="ed-info-icon-box"><svg xmlns="http://www.w3.org/2000/svg" color="white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg></div>
                      <div className="ed-info-text">
                        <p className="ed-info-label">Registration</p>
                        <p className="ed-info-sub">{event.registrationStart} → {event.registrationEnd}</p>
                      </div>
                    </div>
                  </>
                )}
                <div className="ed-card-divider" />
                <div className="ed-price-row">
                  <div>
                    <p className="ed-price">{event.ticketPrice ? `₹${event.ticketPrice}` : (event.priceText || "Free")}</p>
                    {event.ticketType && <p className="ed-info-sub" style={{ marginTop: 2 }}>{event.ticketType}</p>}
                  </div>
                  <button className="ed-book-btn" onClick={() => navigate(`/event/${event.id}/book`)}>Book Ticket</button>
                </div>
              </div>

              {/* Organizer Card */}
              <div className="ed-organizer-card">
                <p className="ed-organizer-heading">Organizer</p>
                <div className="ed-organizer-profile">
                  {(event.hostPhotoURL || event.organizerPhoto) ? (
                    <img src={event.hostPhotoURL || event.organizerPhoto} alt={event.hostName || event.organizerName} className="ed-organizer-avatar" />
                  ) : (
                    <div className="ed-organizer-avatar ed-organizer-avatar--placeholder">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" color="white"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    </div>
                  )}
                  <div className="ed-organizer-meta">
                    <p className="ed-organizer-name">{event.organizerName || event.hostName || "Nitroxx Partner"}</p>
                    {event.hostName && event.organizerName && event.hostName !== event.organizerName && (
                      <p className="ed-info-sub">Host: {event.hostName}</p>
                    )}
                  </div>
                </div>

                <div className="ed-organizer-contacts">
                  {event.organizerEmail && (
                    <a href={`mailto:${event.organizerEmail}`} className="ed-organizer-contact-row">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                      <span>{event.organizerEmail}</span>
                    </a>
                  )}
                  {event.organizerPhone && (
                    <a href={`tel:${event.organizerPhone}`} className="ed-organizer-contact-row">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13 19.79 19.79 0 0 1 1.61 4.48 2 2 0 0 1 3.59 2.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l.88-.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 17z" /></svg>
                      <span>{event.organizerPhone}</span>
                    </a>
                  )}
                  {event.organizerInstagram && (
                    <a href={`https://instagram.com/${event.organizerInstagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="ed-organizer-contact-row">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                      <span>@{event.organizerInstagram.replace(/^@/, "")}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <>
              <p className="ed-recommended-heading">Recommended Events</p>
              <div className="ep-events-grid">
                {related.map((item) => (
                  <Link className="ep-event-card" to={`/event/${item.id}`} key={item.id}>
                    <div className="ep-event-card__image">
                      {item.image ? <img src={item.image} alt={item.title || item.name} /> : <span>No image</span>}
                    </div>
                    <div className="ep-event-card__info">
                      <div className="ep-event-card__name">{item.title || item.name}</div>
                      <div className="ep-event-card__meta"><span>{item.dateText}</span><span>{item.priceText || "Free"}</span></div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* ── Terms & Conditions Modal ── */}
          {showTerms && (
            <div className="ed-modal-overlay" onClick={() => setShowTerms(false)}>
              <div className="ed-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="ed-modal-header">
                  <h3>Terms & Conditions</h3>
                  <button className="ed-modal-close" onClick={() => setShowTerms(false)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                <div className="ed-modal-body">
                  {typeof (event.termsAndConditions || event.terms) === 'string' ? (
                    <p style={{ whiteSpace: "pre-line", margin: 0 }}>{event.termsAndConditions || event.terms}</p>
                  ) : Array.isArray(event.termsAndConditions || event.terms) ? (
                    <ul className="ed-terms-list">
                      {(event.termsAndConditions || event.terms).map((term, i) => <li key={i}>{term}</li>)}
                    </ul>
                  ) : (
                    <p>No terms and conditions provided.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Lightbox Modal ── */}
          {lightboxIndex !== null && (
            <div className="ed-lightbox" onClick={closeLightbox}>
              <button className="ed-lightbox-close" onClick={closeLightbox} aria-label="Close lightbox">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

              {gallery.length > 1 && (
                <button className="ed-lightbox-arrow ed-lightbox-arrow--left" onClick={prevImage} aria-label="Previous image">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
              )}

              <div className="ed-lightbox-content" onClick={(e) => e.stopPropagation()}>
                <img src={gallery[lightboxIndex]} alt={`Gallery view ${lightboxIndex + 1}`} className="ed-lightbox-main-img" />
                <div className="ed-lightbox-counter">
                  {lightboxIndex + 1} / {gallery.length}
                </div>
              </div>

              {gallery.length > 1 && (
                <button className="ed-lightbox-arrow ed-lightbox-arrow--right" onClick={nextImage} aria-label="Next image">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              )}

              {/* Lightbox thumbnails strip */}
              {gallery.length > 1 && (
                <div className="ed-lightbox-thumbs-wrap" onClick={(e) => e.stopPropagation()}>
                  <div className="ed-lightbox-thumbs-list">
                    {gallery.map((src, i) => (
                      <div
                        key={i}
                        className={`ed-lightbox-thumb-item ${i === lightboxIndex ? "active" : ""}`}
                        onClick={() => setLightboxIndex(i)}
                      >
                        <img src={src} alt={`Thumbnail ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
