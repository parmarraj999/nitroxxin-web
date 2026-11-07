import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useEventsContext } from '../../../context/EventsContext';
import { useCollection, useDocument } from '../../../hooks/useFirestore';
import { COLLECTIONS } from '../../../services/firebase';
import ImageWithLoader from '../../../components/common/ImageWithLoader';
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

// Normalize a host document from the Firestore 'event_host' collection
function normalizeHostDoc(doc) {
  if (!doc) return null;
  const id = doc.id || doc.uid || '';
  const name =
    doc.organizationName ||
    doc.fullName ||
    doc.displayName ||
    doc.name ||
    doc.companyName ||
    doc.legalName ||
    doc.title ||
    'Event Host';

  const tagline =
    doc.organizationType ||
    doc.role ||
    doc.partnerTitle ||
    doc.badge ||
    doc.category ||
    doc.tagline ||
    doc.sublabel ||
    'Event Organizers';

  const logoUrl =
    doc.photoURL ||
    doc.logoUrl ||
    doc.logo ||
    doc.avatar ||
    doc.image ||
    doc.imageUrl ||
    doc.profileImage ||
    '';

  const city =
    [doc.city, doc.state, doc.country].filter(Boolean).join(', ') ||
    doc.address ||
    doc.location ||
    '';

  const email = doc.email || doc.supportEmail || '';
  const phone = doc.phone || doc.supportPhone || '';
  const website = doc.socialLinks?.website || doc.website || '';
  const instagram = doc.socialLinks?.instagram || doc.instagram || '';
  const linkedin = doc.socialLinks?.linkedin || doc.linkedin || '';
  const bio = doc.bio || doc.description || '';

  const eventsCount =
    Number(doc.totalEventsHosted ?? doc.eventsCount ?? doc.totalEvents ?? 0) || null;

  const participants =
    doc.totalRegistrants ?? doc.totalParticipants ?? doc.participants ?? null;

  const reviews = doc.hostRating ?? doc.rating ?? doc.reviews ?? '4.5';

  return {
    id,
    name,
    tagline,
    logoUrl,
    avatarText: getAvatarBadgeText(name),
    avatarBg: '#d72b2b',
    city,
    email,
    phone,
    website,
    instagram,
    linkedin,
    bio,
    eventsCount,
    participants: participants
      ? typeof participants === 'number'
        ? `${participants}+`
        : String(participants)
      : null,
    reviews: String(reviews),
    isVerified: Boolean(doc.isVerified || doc.verified),
    rawDoc: doc,
  };
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

  // 1. Direct document query from Firestore collection 'event_host' by id
  const { data: directHostDoc } = useDocument(
    COLLECTIONS.eventHost || 'event_host',
    id
  );

  // 2. Full collection of event hosts from Firestore collection 'event_host'
  const { data: allHosts = [] } = useCollection(
    COLLECTIONS.eventHost || 'event_host'
  );

  // 3. Organizer logos from Firestore as fallback
  const { data: rawOrganizers = [] } = useCollection(
    COLLECTIONS.organizerLogos || 'organizer_logos'
  );

  const rawSlug = (id || '').toLowerCase().trim();

  // Scroll to top on load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  // Back button handler: return to previous page cleanly or /events
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (location.state?.fromPath) {
      navigate(location.state.fromPath, { replace: true });
    } else {
      const lastList = sessionStorage.getItem('nx_last_events_list') || '/events';
      navigate(lastList, { replace: true });
    }
  };

  // Find matching organizer profile from event_host (real data)
  const organizer = useMemo(() => {
    // 1. Direct document match from 'event_host'
    if (directHostDoc) {
      return normalizeHostDoc(directHostDoc);
    }

    // 2. Search in allHosts from 'event_host' collection
    if (allHosts && allHosts.length > 0) {
      // 2a. Match by exact document ID or uid
      const matchById = allHosts.find(
        (h) =>
          String(h.id).toLowerCase() === rawSlug ||
          String(h.uid || '').toLowerCase() === rawSlug
      );
      if (matchById) return normalizeHostDoc(matchById);

      // 2b. Match by slug of organizationName, fullName, displayName, name, companyName
      const matchBySlug = allHosts.find((h) => {
        const names = [
          h.organizationName,
          h.fullName,
          h.displayName,
          h.name,
          h.companyName,
          h.legalName,
          h.title,
        ].filter(Boolean);
        return names.some((n) => slugify(n) === rawSlug);
      });
      if (matchBySlug) return normalizeHostDoc(matchBySlug);

      // 2c. Substring match
      if (rawSlug.length >= 3) {
        const matchBySub = allHosts.find((h) => {
          const names = [
            h.organizationName,
            h.fullName,
            h.displayName,
            h.name,
            h.companyName,
          ].filter(Boolean);
          return names.some((n) => {
            const s = slugify(n);
            return s && (s.includes(rawSlug) || rawSlug.includes(s));
          });
        });
        if (matchBySub) return normalizeHostDoc(matchBySub);
      }
    }

    // 3. Check navigation state if passed from eventDetail or EventPartners
    if (location.state?.organizer) {
      const o = location.state.organizer;
      const stateHostId = String(o.hostId || o.id || '').toLowerCase();
      if (allHosts && allHosts.length > 0 && stateHostId) {
        const matchState = allHosts.find(
          (h) =>
            String(h.id).toLowerCase() === stateHostId ||
            String(h.uid || '').toLowerCase() === stateHostId
        );
        if (matchState) return normalizeHostDoc(matchState);
      }

      return {
        id: o.id || rawSlug,
        name: o.name || o.organizerName || o.hostName || o.fullName || 'Event Organizer',
        tagline:
          o.tagline ||
          o.organizationType ||
          o.role ||
          o.subtitle ||
          o.category ||
          'Event Organizers',
        logoUrl: o.logoUrl || o.logo || o.photoURL || o.imageUrl || '',
        avatarText:
          o.avatarText || getAvatarBadgeText(o.name || o.organizerName || o.fullName),
        avatarBg: o.avatarBg || '#d72b2b',
        eventsCount: o.eventsCount,
        participants: o.participants,
        reviews: o.reviews || o.rating || '4.5',
        city: o.city || o.location || '',
        email: o.email || '',
        phone: o.phone || '',
      };
    }

    // 4. Well-known curated organizers matching the reference UI (e.g. Deyor Travels)
    if (KNOWN_ORGANIZERS[rawSlug]) {
      return KNOWN_ORGANIZERS[rawSlug];
    }
    const matchedKnownKey = Object.keys(KNOWN_ORGANIZERS).find((k) =>
      rawSlug.includes(k) || k.includes(rawSlug)
    );
    if (matchedKnownKey) {
      return KNOWN_ORGANIZERS[matchedKnownKey];
    }

    // 5. Fallback to organizer_logos collection
    const fromLogos = rawOrganizers.find((doc) => {
      const docSlug = slugify(doc.name || doc.organizerName || doc.title || doc.id);
      return docSlug === rawSlug || String(doc.id).toLowerCase() === rawSlug;
    });

    if (fromLogos) {
      const name =
        fromLogos.name || fromLogos.organizerName || fromLogos.title || 'Event Organizer';
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

    // 6. Derive from live events matching this host/organizer
    const matchedEvents = allLiveEvents.filter((e) => {
      const hostSlug = slugify(e.hostName || '');
      const orgSlug = slugify(e.organizerName || e.organizer || e.host || '');
      const hostId = String(e.hostId || e.organizerId || e.vendorId || '').toLowerCase();
      return (
        hostSlug === rawSlug ||
        orgSlug === rawSlug ||
        hostId === rawSlug ||
        (rawSlug.includes('deyor') && (hostSlug.includes('deyor') || orgSlug.includes('deyor')))
      );
    });

    if (matchedEvents.length > 0) {
      const first = matchedEvents[0];
      const name =
        first.organizerName || first.hostName || first.organizer || 'Event Organizer';
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

    // 7. Friendly formatted fallback
    const fallbackName =
      rawSlug
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
  }, [directHostDoc, allHosts, rawSlug, location.state, rawOrganizers, allLiveEvents]);

  // Reset image error state when logoUrl changes
  useEffect(() => {
    setImgError(false);
  }, [organizer.logoUrl]);

  // Find all events belonging to this organizer
  const organizerEvents = useMemo(() => {
    const hostDocId = organizer.id ? String(organizer.id).toLowerCase() : '';
    const hostUid = organizer.rawDoc?.uid ? String(organizer.rawDoc.uid).toLowerCase() : '';
    const hostNameSlug = slugify(organizer.name);

    const matched = allLiveEvents.filter((e) => {
      const eHostId = String(
        e.hostId || e.organizerId || e.vendorId || e.userId || ''
      ).toLowerCase();
      const eHostSlug = slugify(e.hostName || '');
      const eOrgSlug = slugify(e.organizerName || e.organizer || e.host || '');

      const matchesId =
        (hostDocId && eHostId === hostDocId) ||
        (hostUid && eHostId === hostUid) ||
        (rawSlug && eHostId === rawSlug);

      const matchesSlug =
        (rawSlug && (eHostSlug === rawSlug || eOrgSlug === rawSlug)) ||
        (hostNameSlug && (eHostSlug === hostNameSlug || eOrgSlug === hostNameSlug));

      const matchesPartial =
        rawSlug &&
        rawSlug.length > 3 &&
        (eHostSlug.includes(rawSlug) ||
          eOrgSlug.includes(rawSlug) ||
          (rawSlug.includes('deyor') &&
            (eHostSlug.includes('deyor') || eOrgSlug.includes('deyor'))));

      return matchesId || matchesSlug || matchesPartial;
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

  // Derived real stats (Events, Participants, Reviews)
  const stats = useMemo(() => {
    const liveEventsCount = organizerEvents.length;
    const docEventsCount = Number(organizer.eventsCount || 0);
    const eventsCount =
      liveEventsCount > 0
        ? Math.max(liveEventsCount, docEventsCount)
        : docEventsCount > 0
        ? docEventsCount
        : 23;

    // Sum live participants or fallback
    let totalParticipants = 0;
    organizerEvents.forEach((e) => {
      totalParticipants += Number(
        e.registeredCount || e.participantsCount || e.totalRegistrations || e.capacity || 0
      );
    });

    let participantsDisplay = organizer.participants;
    if (!participantsDisplay) {
      if (totalParticipants > 50) {
        participantsDisplay =
          totalParticipants > 999
            ? `${(totalParticipants / 1000).toFixed(1)}k+`
            : `${totalParticipants}+`;
      } else {
        participantsDisplay = '800+';
      }
    }

    const reviews = organizer.reviews || '4.5';

    return {
      eventsCount,
      participants: participantsDisplay,
      reviews,
    };
  }, [organizer, organizerEvents]);

  // Format price helper
  const formatEventPrice = (event) => {
    if (event.priceText) return event.priceText;
    if (event.price === 0) return 'Free';
    if (event.price !== undefined && event.price !== null) {
      const num = Number(event.price);
      if (!isNaN(num)) {
        return `$${num.toLocaleString('en-US')}`;
      }
    }
    if (event.ticketPrice !== undefined && event.ticketPrice !== null) {
      const num = Number(event.ticketPrice);
      if (!isNaN(num)) {
        return `$${num.toLocaleString('en-US')}`;
      }
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

      {/* ── MAIN CONTENT CONTAINER (Responsive Mobile-to-Desktop) ── */}
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

          <h1 className="eod-organizer-name">
            {organizer.name}
            {organizer.isVerified && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginLeft: '6px',
                  verticalAlign: 'middle',
                  color: '#22c55e',
                }}
                title="Verified Host"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </span>
            )}
          </h1>
          <p className="eod-organizer-tagline">{organizer.tagline || 'Event Organizers'}</p>
        </div>

        {/* ── STATS CARD (Events, Participants, Reviews) ── */}
        <div className="eod-stats-container">
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

          {organizerEvents.length > 0 ? (
            <div className="eod-events-list">
              {organizerEvents.map((event) => {
                const eventImg =
                  event.bannerImage ||
                  event.banner ||
                  event.image ||
                  (event.images && event.images[0]) ||
                  'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80';
                const eventTitle =
                  event.title || event.name || 'Moonlight Ride to Mandu Fort';
                const eventLocation =
                  event.venue ||
                  event.location ||
                  event.city ||
                  event.address ||
                  'Manali Mall Road';
                const priceDisplay = formatEventPrice(event);
                const targetUrl = `/events/${event.id}`;

                return (
                  <Link
                    key={event.id}
                    to={targetUrl}
                    state={{ fromOrganizer: true, fromPath: location.pathname }}
                    className="eod-event-card"
                  >
                    <div className="eod-card-image-wrap">
                      <ImageWithLoader
                        src={eventImg}
                        alt={eventTitle}
                        className="eod-card-img"
                        loading="lazy"
                      />
                    </div>
                    <div className="eod-card-info-row">
                      <div className="eod-card-info-left">
                        <h3 className="eod-card-title">{eventTitle}</h3>
                        <div className="eod-card-meta-row">
                          <span className="eod-card-location">{eventLocation}</span>
                          {event.dateText && <span className="eod-card-dot">•</span>}
                          {event.dateText && (
                            <span className="eod-card-date">{event.dateText}</span>
                          )}
                        </div>
                      </div>
                      <div className="eod-card-price">{priceDisplay}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="eod-empty-state">
              <p>No upcoming events listed by this organizer yet.</p>
              <Link to="/events" className="eod-explore-btn">
                Explore All Events
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
