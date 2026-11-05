import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useEventsContext } from '../../../context/EventsContext';
import { useCollection } from '../../../hooks/useFirestore';
import { COLLECTIONS } from '../../../services/firebase';
import './OrganizerDetail.css';

// Slugify helper
function slugify(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Extract initials or short name for the avatar badge (e.g. "DEYOR", "APEX")
function getAvatarBadgeText(name) {
  if (!name) return 'NX';
  const clean = String(name).trim();
  const firstWord = clean.split(' ')[0];
  if (firstWord.length <= 6) {
    return firstWord.toUpperCase();
  }
  const initials = clean
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
  return (initials || 'NX').toUpperCase();
}

// Well-known curated organizers matching the reference UI
const KNOWN_ORGANIZERS = {
  'deyor': {
    id: 'deyor-travels',
    name: 'Deyor Travels',
    tagline: 'Event Organizers',
    avatarText: 'DEYOR',
    avatarBg: '#d72b2b',
    eventsCount: 23,
    participants: '800+',
    reviews: '4.5',
    verified: true,
    city: 'Manali, Himachal Pradesh',
    sampleEvents: [
      {
        id: 'deyor-mandu-fort',
        title: 'Moonlight Ride to Mandu Fort',
        name: 'Moonlight Ride to Mandu Fort',
        location: 'Manali Mall Road',
        venue: 'Manali Mall Road',
        priceText: '$39,599',
        price: 39599,
        bannerImage: '/assets/images/mandu-fort-ride.png',
      },
      {
        id: 'deyor-spiti-circuit',
        title: 'Spiti Valley High Altitude Expedition',
        name: 'Spiti Valley High Altitude Expedition',
        location: 'Kaza Main Gate, Spiti',
        venue: 'Kaza Main Gate, Spiti',
        priceText: '$45,000',
        price: 45000,
        bannerImage:
          'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
  'deyor-travels': {
    id: 'deyor-travels',
    name: 'Deyor Travels',
    tagline: 'Event Organizers',
    avatarText: 'DEYOR',
    avatarBg: '#d72b2b',
    eventsCount: 23,
    participants: '800+',
    reviews: '4.5',
    verified: true,
    city: 'Manali, Himachal Pradesh',
    sampleEvents: [
      {
        id: 'deyor-mandu-fort',
        title: 'Moonlight Ride to Mandu Fort',
        name: 'Moonlight Ride to Mandu Fort',
        location: 'Manali Mall Road',
        venue: 'Manali Mall Road',
        priceText: '$39,599',
        price: 39599,
        bannerImage: '/assets/images/mandu-fort-ride.png',
      },
      {
        id: 'deyor-spiti-circuit',
        title: 'Spiti Valley High Altitude Expedition',
        name: 'Spiti Valley High Altitude Expedition',
        location: 'Kaza Main Gate, Spiti',
        venue: 'Kaza Main Gate, Spiti',
        priceText: '$45,000',
        price: 45000,
        bannerImage:
          'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
  'apex-racing-academy': {
    id: 'apex-racing-academy',
    name: 'Apex Racing Academy',
    tagline: 'Track Days & Pro Coaching',
    avatarText: 'APEX',
    avatarBg: '#d72b2b',
    eventsCount: 14,
    participants: '1.2k+',
    reviews: '4.9',
    city: 'Buddh International Circuit, Greater Noida',
    sampleEvents: [],
  },
  'throttle-shifters-mc': {
    id: 'throttle-shifters-mc',
    name: 'Throttle Shifters MC',
    tagline: 'Touring & Adventure Expeditions',
    avatarText: 'TSMC',
    avatarBg: '#d72b2b',
    eventsCount: 19,
    participants: '650+',
    reviews: '4.7',
    city: 'Mumbai & Pune',
    sampleEvents: [],
  },
};

export default function OrganizerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [imgError, setImgError] = useState(false);

  // Live events from EventsContext
  const { events: allLiveEvents = [] } = useEventsContext();

  // Organizer logos from Firestore
  const { data: rawOrganizers = [] } = useCollection(
    COLLECTIONS.organizerLogos || 'organizer_logos'
  );

  const rawSlug = (id || '').toLowerCase().trim();

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  // Back button handler as requested: in upper nav bar add back button in left
  const handleBack = () => {
    if (location.state?.fromPath) {
      navigate(location.state.fromPath);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/events');
    }
  };

  // Find matching organizer profile
  const organizer = useMemo(() => {
    // 1. Check state passed via navigation
    if (location.state?.organizer) {
      const o = location.state.organizer;
      return {
        id: o.id || rawSlug,
        name: o.name || o.organizerName || o.hostName || 'Event Organizer',
        tagline: o.tagline || o.subtitle || o.category || 'Event Organizers',
        logoUrl: o.logoUrl || o.logo || o.photoURL || o.imageUrl || '',
        avatarText: o.avatarText || getAvatarBadgeText(o.name || o.organizerName),
        avatarBg: o.avatarBg || '#d72b2b',
        eventsCount: o.eventsCount,
        participants: o.participants,
        reviews: o.reviews || o.rating || '4.5',
        city: o.city || o.location || '',
      };
    }

    // 2. Check well-known static profiles (like Deyor Travels)
    if (KNOWN_ORGANIZERS[rawSlug]) {
      return KNOWN_ORGANIZERS[rawSlug];
    }
    const matchedKnownKey = Object.keys(KNOWN_ORGANIZERS).find((k) =>
      rawSlug.includes(k) || k.includes(rawSlug)
    );
    if (matchedKnownKey) {
      return KNOWN_ORGANIZERS[matchedKnownKey];
    }

    // 3. Check Firestore organizer_logos collection
    const fromLogos = rawOrganizers.find((doc) => {
      const docSlug = slugify(doc.name || doc.organizerName || doc.title || doc.id);
      return docSlug === rawSlug || String(doc.id).toLowerCase() === rawSlug;
    });

    if (fromLogos) {
      const name = fromLogos.name || fromLogos.organizerName || fromLogos.title || 'Event Organizer';
      return {
        id: fromLogos.id,
        name,
        tagline: fromLogos.tagline || fromLogos.subtitle || fromLogos.type || 'Event Organizers',
        logoUrl: fromLogos.logoUrl || fromLogos.logo || fromLogos.imageUrl || '',
        avatarText: getAvatarBadgeText(name),
        avatarBg: '#d72b2b',
        eventsCount: fromLogos.eventsCount,
        participants: fromLogos.participants || '800+',
        reviews: fromLogos.reviews || fromLogos.rating || '4.5',
        city: fromLogos.city || fromLogos.location || '',
      };
    }

    // 4. Derive from live events matching this host/organizer
    const matchedEvents = allLiveEvents.filter((e) => {
      const hostSlug = slugify(e.hostName || '');
      const orgSlug = slugify(e.organizerName || e.organizer || e.host || '');
      const hostId = String(e.hostId || e.organizerId || '').toLowerCase();
      return (
        hostSlug === rawSlug ||
        orgSlug === rawSlug ||
        hostId === rawSlug ||
        (rawSlug.includes('deyor') && (hostSlug.includes('deyor') || orgSlug.includes('deyor')))
      );
    });

    if (matchedEvents.length > 0) {
      const first = matchedEvents[0];
      const name = first.organizerName || first.hostName || first.organizer || 'Event Organizer';
      return {
        id: rawSlug,
        name,
        tagline: first.category || 'Event Organizers',
        logoUrl: first.hostPhotoURL || first.organizerPhoto || '',
        avatarText: getAvatarBadgeText(name),
        avatarBg: '#d72b2b',
        eventsCount: matchedEvents.length,
        participants: '800+',
        reviews: '4.5',
        city: first.city || first.location || '',
      };
    }

    // 5. Friendly formatted fallback
    const fallbackName = rawSlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || 'Deyor Travels';

    return {
      id: rawSlug,
      name: fallbackName,
      tagline: 'Event Organizers',
      avatarText: getAvatarBadgeText(fallbackName),
      avatarBg: '#d72b2b',
      eventsCount: 23,
      participants: '800+',
      reviews: '4.5',
      city: 'Manali, Himachal Pradesh',
    };
  }, [rawSlug, location.state, rawOrganizers, allLiveEvents]);

  // Find all events belonging to this organizer
  const organizerEvents = useMemo(() => {
    const matched = allLiveEvents.filter((e) => {
      const hostSlug = slugify(e.hostName || '');
      const orgSlug = slugify(e.organizerName || e.organizer || e.host || '');
      const hostId = String(e.hostId || e.organizerId || '').toLowerCase();

      return (
        hostSlug === rawSlug ||
        orgSlug === rawSlug ||
        hostId === rawSlug ||
        slugify(organizer.name) === hostSlug ||
        slugify(organizer.name) === orgSlug
      );
    });

    // If there are sample events configured for this organizer (e.g. Deyor Travels)
    // and no live events matched yet, include the sample events
    if (matched.length === 0 && organizer.sampleEvents && organizer.sampleEvents.length > 0) {
      return organizer.sampleEvents;
    }

    // If live events matched, also merge any unique sample events if Deyor
    if (rawSlug.includes('deyor') && organizer.sampleEvents) {
      const existingIds = new Set(matched.map((m) => m.id));
      const missingSamples = organizer.sampleEvents.filter((s) => !existingIds.has(s.id));
      return [...missingSamples, ...matched];
    }

    return matched;
  }, [allLiveEvents, rawSlug, organizer]);

  // Derived stats
  const stats = useMemo(() => {
    const eventsCount =
      organizer.eventsCount || (organizerEvents.length > 0 ? organizerEvents.length : 23);

    // Sum live participants or fallback
    let totalParticipants = 0;
    organizerEvents.forEach((e) => {
      totalParticipants += Number(e.registeredCount || e.capacity || 0);
    });
    const participants =
      organizer.participants ||
      (totalParticipants > 50 ? `${totalParticipants}+` : '800+');

    const reviews = organizer.reviews || '4.5';

    return {
      eventsCount,
      participants,
      reviews,
    };
  }, [organizer, organizerEvents]);

  // Format price helper
  const formatEventPrice = (event) => {
    if (event.priceText) return event.priceText;
    if (event.price === 0) return 'Free';
    if (event.price) {
      // If price was stored as numeric USD or INR
      return `$${Number(event.price).toLocaleString('en-US')}`;
    }
    return '$39,599';
  };

  return (
    <div className="eod-page">
      {/* ── TOP NAV BAR (With back button on the left) ── */}
      <header className="eod-navbar">
        <button
          type="button"
          className="eod-back-btn"
          onClick={handleBack}
          aria-label="Go back"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="eod-nav-center" />
        <div className="eod-nav-right-spacer" />
      </header>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <main className="eod-shell">
        {/* Profile Avatar / Badge */}
        <div className="eod-profile-header">
          <div className="eod-avatar-container">
            {organizer.logoUrl && !imgError ? (
              <img
                src={organizer.logoUrl}
                alt={organizer.name}
                className="eod-avatar-img"
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="eod-avatar-badge"
                style={{ backgroundColor: organizer.avatarBg || '#d72b2b' }}
              >
                <span>{organizer.avatarText || getAvatarBadgeText(organizer.name)}</span>
              </div>
            )}
          </div>

          <h1 className="eod-organizer-name">{organizer.name}</h1>
          <p className="eod-organizer-tagline">{organizer.tagline || 'Event Organizers'}</p>
        </div>

        {/* ── STATS CARD (Events, Participants, Reviews) ── */}
        <div className='eod-stats-container'>
          <div className="eod-stats-card">
            <div className="eod-stat-col">
              <span className="eod-stat-val">{stats.eventsCount}</span>
              <span className="eod-stat-lbl">Events</span>
            </div>
            <div className="eod-stat-divider" />
            <div className="eod-stat-col">
              <span className="eod-stat-val">{stats.participants}</span>
              <span className="eod-stat-lbl">Participants</span>
            </div>
            <div className="eod-stat-divider" />
            <div className="eod-stat-col">
              <span className="eod-stat-val">{stats.reviews}</span>
              <span className="eod-stat-lbl">Reviews</span>
            </div>
          </div>
        </div>

        {/* ── EVENTS SECTION ── */}
        <section className="eod-events-section">
          <div className="eod-section-header">
            <h2 className="eod-section-title">
              Events ({organizerEvents.length > 0 ? organizerEvents.length : stats.eventsCount})
            </h2>
          </div>

          <div className="eod-events-list">
            {organizerEvents.map((event) => {
              const eventImg =
                event.bannerImage ||
                event.banner ||
                event.image ||
                (event.images && event.images[0]) ||
                'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80';
              const eventTitle = event.title || event.name || 'Moonlight Ride to Mandu Fort';
              const eventLocation =
                event.venue || event.location || event.city || event.address || 'Manali Mall Road';
              const priceDisplay = formatEventPrice(event);
              const targetUrl = `/events/${event.id}`;
              console.log(event)

              return (
                <Link
                  key={event.id}
                  to={targetUrl}
                  state={{ fromOrganizer: true, fromPath: location.pathname }}
                  className="eod-event-card"
                >
                  <div className="eod-card-image-wrap">
                    <img
                      src={eventImg}
                      alt={eventTitle}
                      className="eod-card-img"
                      loading="lazy"
                    />
                  </div>
                  <div className="eod-card-info-row">
                    <div className="eod-card-info-left">
                      <h3 className="eod-card-title">{eventTitle}</h3>
                      <div style={{ display: 'flex', alignItems: 'center',gap:'10px' }}>
                        <p className="eod-card-location">{eventLocation},</p>
                        <div className="eod-card-date">{event.dateText}</div>
                      </div>
                    </div>
                    <div className="eod-card-price">{priceDisplay}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
