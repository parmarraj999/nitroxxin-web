/* eslint-disable no-unused-vars */
import React from "react";
import "./eventDetail.css";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCollection, useDocument } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";
import { normalizeEvent } from "../../../services/normalizers";
import { saveFavoriteEvent } from "../../../services/commerceService";
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

export default function EventDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, loading } = useDocument(COLLECTIONS.events, id);
  const relatedQuery = useCollection(COLLECTIONS.events, { limit: 12 });
  const event = data ? normalizeEvent(data) : null;
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  const handleFavorite = async () => {
    if (!event) return;
    if (!user) return openLogin();
    await saveFavoriteEvent({ userId: user.uid, event });
  };

  if (loading) {
    return (
      <div className="event-detail-page">
        <div className="nx-empty-state">
          <h3>Loading event</h3>
          <p>Fetching event details from Firestore.</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-detail-page">
        <div className="nx-empty-state">
          <h3>Event not available</h3>
          <p>This event is not published or could not be found in Firestore.</p>
          <button className="ed-book-btn" onClick={() => navigate("/events")}>Browse Events</button>
        </div>
      </div>
    );
  }

  const gallery = event.images?.length ? event.images : [event.image || event.banner].filter(Boolean);
  const thingsToKnow = listFrom(
    event.duration && `Duration: ${event.duration}`,
    event.ageLimit && `Age limit: ${event.ageLimit}`,
    event.parking && `Parking: ${event.parking}`,
    event.rules,
    event.highlights
  );
  const agenda = listFrom(event.agenda, event.timeline);
  const faqs = listFrom(event.faqs);
  const related = relatedQuery.data
    .map(normalizeEvent)
    .filter((item) => item.id !== event.id)
    .filter((item) => item.category === event.category || item.hostId === event.hostId)
    .slice(0, 4);
  const seatsLeft = Math.max(0, Number(event.capacity || 0) - Number(event.registeredCount || 0));
  const categoryDetails = getCategoryDetails(event);

  return (
    <div className="event-detail-page">
      <div className="event-detail-scroll-container">
        <div className="event-detail-canvas">
          <div className="event-detail-bg" />
          {/* <div className="ed-navbar">
            <div className="ed-navbar-blur" />
            <button className="ed-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" color="white" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <button className="ed-bookmark-btn" onClick={handleFavorite} aria-label="Save event">
              <div className="ed-bookmark-bg" />
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" color="white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z" /></svg>
            </button>
          </div> */}

          <p className="ed-event-title">{event.title || event.name}</p>
          <p className="ed-event-meta">
            <span className="ed-event-date">{event.dateTimeText || event.dateText}</span>
            <span className="ed-event-location"> | {event.location}</span>
          </p>

          <div className="ed-images-group">
            <div className="ed-img-main">{gallery[0] ? <img alt={event.title || event.name} src={gallery[0]} className="ed-img-cover ed-img-main-inner" /> : <span>No image</span>}</div>
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className={`ed-img-${index < 3 ? "top" : "bottom"}-right-${index % 2 || 2}`}>
                {gallery[index] || gallery[0] ? <img alt={event.title || event.name} src={gallery[index] || gallery[0]} className="ed-img-cover ed-img-fill" /> : null}
              </div>
            ))}
          </div>

          <p className="ed-section-heading ed-about-heading">About</p>
          <p className="ed-about-text">{event.description || event.about || "Organizer has not added a description yet."}</p>

          {categoryDetails.config && (
            <section className="ed-category-section">
              <div className="ed-category-head"><span>Event category</span><h2>{categoryDetails.config.category}</h2></div>
              {categoryDetails.details.length ? <div className="ed-category-grid">
                {categoryDetails.details.map((field) => <article className={`ed-category-item${field.type === 'textarea' || field.type === 'array' ? ' ed-category-item--wide' : ''}`} key={field.id}>
                  <span>{field.label}</span><strong>{formatCategoryValue(field.value, field)}</strong>
                </article>)}
              </div> : <p className="ed-category-empty">Detailed category information will be published by the organizer soon.</p>}
            </section>
          )}

          <p className="ed-section-heading ed-things-heading">Things to know</p>
          <ol className="ed-things-list">
            {thingsToKnow.length ? thingsToKnow.map((item) => <li key={item}>{item}</li>) : <li>Rules, amenities, and venue guidance will appear after organizer updates.</li>}
          </ol>

          <div className="ed-info-card">
            <div className="ed-info-row">
              <div className="ed-info-icon-box"><svg xmlns="http://www.w3.org/2000/svg" color="white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg></div>
              <div className="ed-info-text"><p className="ed-info-label">{event.location}</p><p className="ed-info-sub">{event.venue || event.address || "Venue details from organizer"}</p></div>
            </div>
            <div className="ed-divider-thin" />
            <div className="ed-info-row">
              <div className="ed-info-icon-box"><svg xmlns="http://www.w3.org/2000/svg" color="white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 14v2.2l1.6 1"/><path d="M16 2v4"/><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M3 10h5"/><path d="M8 2v4"/><circle cx="16" cy="16" r="6"/></svg></div>
              <div className="ed-info-text"><p className="ed-info-label">{event.gatesOpen || event.dateTimeText || event.dateText}</p><p className="ed-info-sub">Agenda and timeline update live from dashboard</p></div>
            </div>
            <div className="ed-divider-thin" />
            <div className="ed-info-row">
              <div className="ed-info-icon-box"><svg xmlns="http://www.w3.org/2000/svg" color="white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg></div>
              <div className="ed-info-text"><p className="ed-info-label">{seatsLeft || "Limited"} seats available</p><p className="ed-info-sub">Ticket inventory syncs in real time</p></div>
            </div>
            <div className="ed-card-divider" />
            <div className="ed-price-row">
              <p className="ed-price">{event.priceText || "Free"}</p>
              <button className="ed-book-btn" onClick={() => navigate(`/event/${event.id}/book`)}>Book Ticket</button>
            </div>
          </div>

          {agenda.length > 0 && (
            <>
              <p className="ed-section-heading ed-more-heading">Agenda</p>
              <ol className="ed-things-list">{agenda.map((item) => <li key={JSON.stringify(item)}>{typeof item === "object" ? `${item.time || ""} ${item.title || item.name || item.description || ""}` : item}</li>)}</ol>
            </>
          )}

          <p className="ed-section-heading ed-more-heading">More</p>
          <div className="ed-more-card">
            <div className="ed-more-row"><p className="ed-more-label">Organizer: {event.organizerName || event.organizer || "Nitroxx partner"}</p></div>
            <div className="ed-divider-thin" />
            <div className="ed-more-row"><p className="ed-more-label">FAQs: {faqs.length ? `${faqs.length} answers available` : "Organizer has not added FAQs yet"}</p></div>
          </div>

          {related.length > 0 && (
            <>
              <p className="ed-recommended-heading">Recommended Events</p>
              <div className="ep-events-grid">
                {related.map((item) => (
                  <Link className="ep-event-card" to={`/event/${item.id}`} key={item.id}>
                    <div className="ep-event-card__image">
                      {item.image ? <img src={item.image} alt={item.title || item.name} /> : <span>No image</span>}
                      <div className="ep-event-card__info">
                        <div className="ep-event-card__name">{item.title || item.name}</div>
                        <div className="ep-event-card__meta"><span>{item.dateText}</span><span>{item.priceText || "Free"}</span></div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
