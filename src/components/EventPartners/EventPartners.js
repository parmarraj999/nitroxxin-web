import React, { useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './EventPartners.css';
import { useCollection } from '../../hooks/useFirestore';
import { COLLECTIONS } from '../../services/firebase';

const FALLBACK_ORGANIZERS = [
  {
    id: 'apex-racing-academy',
    name: 'Apex Racing Academy',
    tagline: 'Track Days & Pro Coaching',
    logoUrl: '/assets/images/brand-1.png',
    city: 'Buddh International Circuit',
  },
  {
    id: 'throttle-shifters-mc',
    name: 'Throttle Shifters MC',
    tagline: 'Touring & Adventure Expeditions',
    logoUrl: '/assets/images/brand-2.png',
    city: 'Mumbai & Pune',
  },
  {
    id: 'torque-riders-india',
    name: 'Torque Riders Club',
    tagline: 'Night Rides & Weekend Brunches',
    logoUrl: '/assets/images/brand-3.png',
    city: 'Bengaluru',
  },
  {
    id: 'himalayan-explorers',
    name: 'Himalayan Explorers',
    tagline: 'High-Altitude Mountain Trails',
    logoUrl: '/assets/images/brand-4.png',
    city: 'Manali & Leh',
  },
  {
    id: 'redline-moto-club',
    name: 'Redline Superbikes',
    tagline: 'Performance & Track Enthusiasts',
    logoUrl: '/assets/images/brand-5.png',
    city: 'Delhi NCR',
  },
  {
    id: 'mud-mavericks-offroad',
    name: 'Mud Mavericks Enduro',
    tagline: 'Dirt Trails & Sand Dunes',
    logoUrl: '/assets/images/brand-6.png',
    city: 'Goa & Coorg',
  },
];

export default function EventPartners({
  theme = 'dark',
  title = 'EVENT PARTNERS & ORGANIZERS',
  subtitle = 'Official motorcycle clubs, touring academies, and event organizers powering riding experiences on Nitroxx.',
  badge = 'OFFICIAL EVENT HOSTS',
  className = '',
}) {
  const navigate = useNavigate();
  const sliderRef = useRef(null);

  // Fetch live organizer logos from Firestore collection
  const { data: rawOrganizers = [] } = useCollection(
    COLLECTIONS.organizerLogos || 'organizer_logos'
  );

  const organizers = useMemo(() => {
    if (rawOrganizers && rawOrganizers.length > 0) {
      return rawOrganizers.map((doc, idx) => {
        const name =
          doc.name ||
          doc.organizerName ||
          doc.title ||
          doc.label ||
          `Partner ${idx + 1}`;
        const logo =
          doc.logoUrl ||
          doc.logo ||
          doc.imageUrl ||
          doc.image ||
          doc.photoURL ||
          doc.photo ||
          doc.icon ||
          doc.banner ||
          `/assets/images/brand-${(idx % 6) + 1}.png`;
        const tagline =
          doc.tagline ||
          doc.subtitle ||
          doc.bio ||
          doc.description ||
          doc.type ||
          'Event Organizer';
        const city = doc.city || doc.location || '';
        const url = doc.website || doc.link || doc.url || doc.redirectUrl || '';

        return {
          id: doc.id || `partner-${idx}`,
          ...doc,
          name,
          logo,
          tagline,
          city,
          url,
        };
      });
    }
    return FALLBACK_ORGANIZERS;
  }, [rawOrganizers]);

  const scroll = (direction) => {
    if (sliderRef.current) {
      const container = sliderRef.current;
      const firstCard = container.querySelector('.event-partner-card');
      const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 220;
      const gap = 20;
      const scrollAmount = (cardWidth + gap) * 2;

      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handlePartnerClick = (partner) => {
    if (partner.url) {
      if (partner.url.startsWith('http://') || partner.url.startsWith('https://')) {
        window.open(partner.url, '_blank', 'noopener,noreferrer');
        return;
      }
      navigate(partner.url);
      return;
    }
    const query = partner.name || partner.id;
    if (query) {
      navigate(`/events/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <section className={`event-partners-section event-partners-section--${theme} ${className}`}>
      <div className="event-partners-container">
        {/* Header */}
        <div className="event-partners-header">
          {badge && (
            <div className="event-partners-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
              {badge}
            </div>
          )}
          <h2 className="event-partners-title">{title}</h2>
          {subtitle && <p className="event-partners-subtitle">{subtitle}</p>}
        </div>

        {/* Slider Wrapper */}
        <div className="event-partners-slider-wrapper">
          <div className="event-partners-track" ref={sliderRef}>
            {organizers.map((partner, idx) => (
              <div
                key={partner.id || idx}
                className="event-partner-card"
                onClick={() => handlePartnerClick(partner)}
                role="button"
                tabIndex="0"
                aria-label={`View events by ${partner.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePartnerClick(partner);
                  }
                }}
              >
                <div className="event-partner-logo-box">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="event-partner-logo-img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `/assets/images/brand-${(idx % 6) + 1}.png`;
                    }}
                  />
                </div>
                <div className="event-partner-info">
                  <h4 className="event-partner-name">{partner.name}</h4>
                  {/* {partner.tagline && (
                    <p className="event-partner-tagline">{partner.tagline}</p>
                  )}
                  {partner.city && (
                    <span className="event-partner-city-pill">{partner.city}</span>
                  )} */}
                </div>
              </div>
            ))}
          </div>

          {/* Slider controls at bottom */}
          {organizers.length > 2 && (
            <div className="event-partners-controls" aria-label="Partner carousel controls">
              <button
                type="button"
                className="event-partner-ctrl-btn event-partner-ctrl-btn--prev"
                onClick={() => scroll('left')}
                aria-label="Previous event partners"
                title="Previous"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                className="event-partner-ctrl-btn event-partner-ctrl-btn--next"
                onClick={() => scroll('right')}
                aria-label="Next event partners"
                title="Next"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
