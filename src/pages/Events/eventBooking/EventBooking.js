import React, { useEffect, useMemo, useState, isValidElement } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheck,
  FaChevronDown,
  FaChevronRight,
  FaCreditCard,
  FaEdit,
  FaIdCard,
  FaLock,
  FaMapMarkerAlt,
  FaPercentage,
  FaRegEdit,
  FaRegUser,
  FaShieldAlt,
  FaTicketAlt,
  FaUser,
  FaUserFriends,
  FaWallet,
} from 'react-icons/fa';
import './EventBooking.css';
import { useDocument, useCollection } from '../../../hooks/useFirestore';
import { COLLECTIONS } from '../../../services/firebase';
import { normalizeEvent } from '../../../services/normalizers';
import { useEventsContext } from '../../../context/EventsContext';
import { bookEvent } from '../../../services/commerceService';
import { useAuth } from '../../../context/AuthContext';
import { useAuthModal } from '../../../components/AuthModal/useAuthModal';
import { getTicketQrUrl } from '../../../utils/ticketSecurity';
import { getEventStatusInfo } from '../../../utils/eventStatus';

const STEPS = [
  { id: 1, label: 'Ticket' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Setup' },
  { id: 4, label: 'Add Ons' },
  { id: 5, label: 'Payment' },
];

// const JOIN_OPTIONS = [
//   { key: 'biker', title: 'Biker', text: 'I am riding my motorcycle to the event.' },
//   { key: 'pillion', title: 'Pillion', text: 'I need to be paired with an approved rider.' },
//   // { key: 'group', title: 'Group ride', text: 'I am booking for a riding crew.' },
// ];



/**
 * Formats motorcycle / vehicle registration number to standard Indian format:
 * Strips special characters and spaces, forces uppercase, max 10 chars (e.g. MP04XX1231).
 */
export const formatVehicleNumber = (val) => {
  if (!val) return '';
  return String(val).replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
};

/**
 * Validates motorcycle / vehicle registration number against Indian RTO standards:
 * - Standard state series: 2-letter State code + 1-2 digit RTO + optional 1-3 series letters + 1-4 digit number
 *   (e.g. MP04XX1231, MH02AB1234, DL011234)
 * - Bharat (BH) series: 2-digit year + BH + 1-4 digit number + 1-2 letters
 *   (e.g. 22BH1234AA)
 */
export const isValidRegistrationNumber = (reg) => {
  if (!reg || typeof reg !== 'string') return false;
  const clean = formatVehicleNumber(reg);
  const standardPattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$/;
  const bhSeriesPattern = /^[0-9]{2}BH[0-9]{1,4}[A-Z]{1,2}$/;
  return (standardPattern.test(clean) || bhSeriesPattern.test(clean)) && clean.length >= 6 && clean.length <= 10;
};

const makeAttendee = (index = 0) => ({
  name: '',
  phone: '',
  email: '',
  age: '',
  gender: '',
  idType: 'Aadhaar',
  joinAs: index === 0 ? 'biker' : 'pillion',
});

const extractCleanPhone = (sourcePhone) => {
  if (!sourcePhone) return '';
  let str = String(sourcePhone).trim();
  if (str.startsWith('+91')) {
    str = str.slice(3).trim();
  } else if (str.startsWith('91') && str.length === 12) {
    str = str.slice(2).trim();
  } else if (str.startsWith('0') && str.length === 11) {
    str = str.slice(1).trim();
  }
  return str.replace(/[\s-]/g, '');
};

const getBestUserPhone = (prof, usr) => {
  const candidate =
    prof?.phone ||
    prof?.phoneNumber ||
    prof?.mobile ||
    prof?.mobileNumber ||
    prof?.contactPhone ||
    prof?.contactNumber ||
    usr?.phone ||
    usr?.phoneNumber ||
    usr?.providerData?.find((p) => p?.phoneNumber)?.phoneNumber ||
    localStorage.getItem('nitroxx_user_phone') ||
    localStorage.getItem('userPhone') ||
    '';
  return extractCleanPhone(candidate) || (candidate ? String(candidate).trim() : '');
};

const getBestEmergency = (prof) => {
  const name =
    prof?.emergencyContactName ||
    prof?.emergencyName ||
    prof?.emergencyContactPerson ||
    prof?.emergencyPerson ||
    prof?.emergencyContact?.name ||
    prof?.emergencyContact?.fullName ||
    prof?.emergency?.name ||
    (typeof prof?.emergencyContact === 'string' && isNaN(Number(prof.emergencyContact)) ? prof.emergencyContact : '') ||
    '';
  const rawPhone =
    prof?.emergencyNumber ||
    prof?.emergencyPhone ||
    prof?.emergencyContactPhone ||
    prof?.emergencyContactNumber ||
    prof?.emergencyContact?.phone ||
    prof?.emergencyContact?.number ||
    prof?.emergencyContact?.mobile ||
    prof?.emergency?.phone ||
    (typeof prof?.emergencyContact === 'string' && !isNaN(Number(prof.emergencyContact.replace(/\D/g, ''))) ? prof.emergencyContact : '') ||
    '';
  return {
    name,
    phone: extractCleanPhone(rawPhone) || (rawPhone ? String(rawPhone).trim() : ''),
  };
};

const getBestBikeDetails = (prof, bikesList) => {
  const primary =
    bikesList && bikesList.length > 0
      ? bikesList[0]
      : prof?.bikes && prof.bikes.length > 0
        ? prof.bikes[0]
        : prof?.bike || null;

  if (primary) {
    return {
      brand: primary.brand || primary.make || '',
      model: primary.model || primary.bikeModel || '',
      registration: formatVehicleNumber(
        primary.regNumber ||
        primary.registration ||
        primary.registrationNumber ||
        primary.plateNumber ||
        ''
      ),
      engineCC: primary.cc || primary.engineCC || primary.capacity || '',
    };
  }

  return {
    brand: prof?.bikeBrand || prof?.motorcycleBrand || '',
    model: prof?.bikeModel || prof?.motorcycleModel || '',
    registration: formatVehicleNumber(prof?.bikeRegistration || prof?.regNumber || prof?.vehicleNumber || ''),
    engineCC: prof?.engineCC || prof?.bikeCC || '',
  };
};

const resolveBikeRequirements = (event) => {
  if (!event) return null;
  const raw = event.bikeRequirements || event.bikeRequirement || null;

  const brand = raw?.brand || raw?.bikeBrand || event.bikeBrand || event.brand || '';
  const model = raw?.model || raw?.bikeModel || event.bikeModel || event.model || '';
  const engineCC = raw?.engineCC || raw?.bikeEngineCC || raw?.engineCc || event.bikeEngineCC || event.engineCC || event.minimumCC || '';
  const bikeType = raw?.bikeType || event.bikeType || '';
  const criteria = raw?.criteria || raw?.bikeCriteria || event.bikeCriteria || '';

  const isExplicitlyDisabled = event.specificBikeRequired === false && !raw?.specificBikeRequired;
  if (isExplicitlyDisabled) return null;

  const hasSpecificFlag = Boolean(event.specificBikeRequired || raw?.specificBikeRequired);
  const hasDetails = Boolean(brand || model || engineCC || bikeType || criteria);

  if (!hasSpecificFlag && !hasDetails) return null;

  return {
    brand: String(brand || '').trim(),
    model: String(model || '').trim(),
    engineCC: String(engineCC || '').trim(),
    bikeType: String(bikeType || '').trim(),
    criteria: String(criteria || '').trim(),
  };
};

const isPillionOrSpectatorTier = (tier) => {
  if (!tier) return false;
  const str = `${tier.ticketFor || ''} ${tier.name || ''} ${tier.packageName || ''} ${tier.title || ''} ${tier.description || ''} ${tier.type || ''}`.toLowerCase();
  const hasPillion = str.includes('pillion') || str.includes('pillon') || str.includes('passenger') || str.includes('co-rider') || str.includes('corider');
  const hasSpectator = str.includes('spectator') || str.includes('visitor') || str.includes('audience') || str.includes('guest') || str.includes('fan');
  return hasPillion || hasSpectator;
};

const formatMoney = (amount) => `₹ ${Math.round(Number(amount || 0)).toLocaleString('en-IN')}`;

function Field({
  label,
  children,
  isLocked = false,
  trailingIcon = null,
  className = '',
  error = null,
  plain = false,
}) {
  if (plain) {
    return (
      <div className={`eb-plain-field ${className}`}>
        {label && <span className="eb-plain-field__label">{label}</span>}
        <div className="eb-plain-field__control">{children}</div>
        {error && <span className="eb-field-error">{error}</span>}
      </div>
    );
  }

  const isTextarea = isValidElement(children) && children.type === 'textarea';

  return (
    <div className={`eb-notched-field-group ${className}`}>
      <label className={`eb-notched-field ${isTextarea ? 'eb-notched-field--textarea' : ''} ${error ? 'has-error' : ''}`}>
        {label && <span className="eb-notched-field__label">{label}</span>}
        <div className="eb-notched-field__control">
          {children}
          {isLocked ? (
            <span className="eb-notched-field__lock" title="Verified contact detail" aria-label="Verified">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
          ) : trailingIcon ? (
            <span className="eb-notched-field__trailing">{trailingIcon}</span>
          ) : null}
        </div>
      </label>
      {error && <span className="eb-field-error">{error}</span>}
    </div>
  );
}

function BookingHeader({ event, seatsLeft, onBack, step, setStep, steps = STEPS }) {
  const displayDate = useMemo(() => {
    if (event.dateTimeText) return event.dateTimeText;
    if (event.dateText && event.time) return `${event.dateText}, ${event.time}`;
    if (event.dateText) return event.dateText;
    return 'Mon, 9 Nov, 5:30 am';
  }, [event]);

  const displayLocation = useMemo(() => {
    if (event.venue && (event.city || event.state)) {
      return [event.venue, event.city, event.state].filter(Boolean).join(', ');
    }
    return event.venue || event.location || event.city || 'Manali Mall Road, manali, himachal pradesh';
  }, [event]);

  const displayTickets = useMemo(() => {
    if (seatsLeft > 0 && seatsLeft < 999) {
      return `${seatsLeft} Ticket Left`;
    }
    if (seatsLeft === 999) {
      return event.ticketsLeft ? `${event.ticketsLeft} Ticket Left` : '38 Ticket Left';
    }
    if (seatsLeft === 0) {
      return 'Sold Out';
    }
    return `${seatsLeft} Ticket Left`;
  }, [seatsLeft, event.ticketsLeft]);

  const bannerImg =
    event.image ||
    event.bannerImage ||
    event.banner ||
    (event.images && event.images[0]) ||
    '/assets/images/mandu-fort-ride.png';

  return (
    <>
      <div className="eb-navbar_mobile">
        <button
          type="button"
          className="eb-back-circle-mob"
          onClick={onBack}
          aria-label="Back to event"
        >
          <svg
            width="18"
            height="18"
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
        <h3 title={event.title}>{event.title}</h3>
        <div className="eb-navbar_mobile-spacer" />
      </div>

      <header className="eb-hero">
        {bannerImg && (
          <img
            className="eb-hero__image"
            src={bannerImg}
            alt={event.title || 'Event banner'}
          />
        )}
        <div className="eb-hero__shade" />
        <div className="eb-hero__content">
          <button
            className="eb-back-circle"
            type="button"
            onClick={onBack}
            aria-label="Back to event"
          >
            <svg
              width="18"
              height="18"
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

          <h1 className="eb-hero__title">
            {event.title || 'Leh Ladakh Ultimate Expedition 2027'}
          </h1>

          <div className="eb-hero__pills">
            <div className="eb-hero__pill">
              <svg
                className="eb-pill-icon"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{displayDate}</span>
            </div>

            <div className="eb-hero__pill">
              <svg
                className="eb-pill-icon"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
              <span>{displayLocation}</span>
            </div>

            <div className="eb-hero__pill">
              <svg
                className="eb-pill-icon"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <line x1="9" y1="9" x2="9" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
                <line x1="9" y1="15" x2="9.01" y2="15" />
                <line x1="15" y1="15" x2="15.01" y2="15" />
              </svg>
              <span>{displayTickets}</span>
            </div>
          </div>

          {step && setStep && (
            <div className="eb-stepper-wrap">
              <Stepper step={step} setStep={setStep} steps={steps} />
            </div>
          )}
        </div>
      </header>
    </>
  );
}

function Stepper({ step, setStep, steps = STEPS }) {
  return (
    <nav className="eb-stepper-pill-bar" aria-label="Booking steps">
      {steps.map(({ id, label }) => {
        const isActive = step === id;
        const isDone = step > id;
        return (
          <button
            key={id}
            type="button"
            className={`eb-step-pill-btn ${isActive ? 'is-active' : ''} ${isDone ? 'is-done' : ''}`}
            onClick={() => {
              if (isDone && setStep) setStep(id);
            }}
            disabled={!isDone && !isActive}
            aria-current={isActive ? 'step' : undefined}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}

function TicketStep({ counts, setCount, tiers, seatsLeft }) {
  const [expandedIncludes, setExpandedIncludes] = useState({});
  const [expandedExcludes, setExpandedExcludes] = useState({});

  const handleSelectTier = (tierKey) => {
    // If this tier is already selected, do nothing
    if ((counts[tierKey] || 0) > 0) return;

    // Preserve the current chosen quantity if possible, or default to 1
    const currentQty = Object.values(counts).find((c) => Number(c) > 0) || 1;
    const targetTier = tiers.find((t) => t.key === tierKey);
    const maxForTier = targetTier?.availableSeats && targetTier.availableSeats > 0 ? targetTier.availableSeats : (seatsLeft || 20);
    const targetQty = Math.max(1, Math.min(Number(currentQty), maxForTier));

    tiers.forEach((t) => {
      setCount(t.key, t.key === tierKey ? targetQty : 0);
    });
  };

  return (
    <section className="eb-plan-panel">
      {/* Header matching reference UI: Title on Left, Toggle Pill on Right */}
      <div className="eb-plan-header">
        <div>
          <h2 className="eb-plan-main-title">Select a Plan</h2>
          <span className="eb-plan-toggle-discount">{seatsLeft > 0 ? `${seatsLeft} LEFT` : 'SOLD OUT'}</span>
        </div>
      </div>

      {/* Plan Cards Stack */}
      <div className="eb-plan-list">
        {tiers.length ? (
          tiers.map((tier, idx) => {
            const count = Number(counts[tier.key] || 0);
            const isSelected = count > 0;
            const maxAllowed = Math.min(seatsLeft, tier.availableSeats > 0 ? tier.availableSeats : 20);

            // Subtitle derivation: use tier.ticketFor, shortDescription, or fallback
            const subtitle = tier.ticketFor
              ? `For ${tier.ticketFor}`
              : tier.description && tier.description.length < 50
                ? tier.description
                : (idx === 0 ? 'For Individuals' : idx === 1 ? 'For Teams & Crews' : 'Premium Access');

            const isExpandedPerks = Boolean(expandedIncludes[tier.key]);
            const perksList = tier.perks || [];
            const hasManyPerks = perksList.length > 2;
            const visiblePerks = hasManyPerks && !isExpandedPerks ? perksList.slice(0, 2) : perksList;

            const isExpandedExc = Boolean(expandedExcludes[tier.key]);
            const excList = tier.exclusions || [];
            const hasManyExcludes = excList.length > 2;
            const visibleExcludes = hasManyExcludes && !isExpandedExc ? excList.slice(0, 2) : excList;

            return (
              <article
                key={tier.key}
                className={`eb-plan-card ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleSelectTier(tier.key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectTier(tier.key);
                  }
                }}
              >
                {/* Top Row: Radio, Title/Subtitle on Left | Price/Subtext on Right */}
                <div className="eb-plan-card-top">
                  <div className="eb-plan-card-left">
                    <span className={`eb-plan-radio-circle ${isSelected ? 'is-checked' : ''}`}>
                      {isSelected && <span className="eb-plan-radio-dot" />}
                    </span>
                    <div className="eb-plan-title-box">
                      <h3 className="eb-plan-name">{tier.name}</h3>
                      <p className="eb-plan-subtitle">{subtitle}</p>
                    </div>
                  </div>

                  <div className="eb-plan-card-right">
                    <span className="eb-plan-price">{formatMoney(tier.price)}</span>
                    <span className="eb-plan-price-unit">Per Person</span>
                  </div>
                </div>

                {/* Expanded Details Section: Features List, Divider, Bottom Row */}
                {isSelected && (
                  <div className="eb-plan-expanded-content">
                    {/* Features List (Inclusions / Perks) */}
                    <div className="eb-plan-features-list">
                      {perksList.length > 0 ? (
                        <>
                          {visiblePerks.map((perk, i) => (
                            <div key={`perk-${i}`} className="eb-plan-feature-item">
                              <span className="eb-plan-feature-icon">
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                  <circle cx="10" cy="10" r="9" stroke="#1d72fe" strokeWidth="1.8" />
                                  <path d="M6 10.2L8.7 13L14 7.5" stroke="#1d72fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                              <span className="eb-plan-feature-text">{perk}</span>
                            </div>
                          ))}

                          {hasManyPerks && (
                            <button
                              type="button"
                              className="eb-plan-read-more-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedIncludes((prev) => ({
                                  ...prev,
                                  [tier.key]: !prev[tier.key],
                                }));
                              }}
                            >
                              {isExpandedPerks ? (
                                <>
                                  <span>Read less</span>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="18 15 12 9 6 15" />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  <span>+{perksList.length - 2} more included • Read more</span>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
                                </>
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="eb-plan-feature-item">
                            <span className="eb-plan-feature-icon">
                              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="9" stroke="#1d72fe" strokeWidth="1.8" />
                                <path d="M6 10.2L8.7 13L14 7.5" stroke="#1d72fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            <span className="eb-plan-feature-text">Official Event Entry & Rider Access Pass</span>
                          </div>
                          <div className="eb-plan-feature-item">
                            <span className="eb-plan-feature-icon">
                              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="9" stroke="#1d72fe" strokeWidth="1.8" />
                                <path d="M6 10.2L8.7 13L14 7.5" stroke="#1d72fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            <span className="eb-plan-feature-text">Route Briefing & Marshal Support</span>
                          </div>
                          <div className="eb-plan-feature-item">
                            <span className="eb-plan-feature-icon">
                              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                <circle cx="10" cy="10" r="9" stroke="#1d72fe" strokeWidth="1.8" />
                                <path d="M6 10.2L8.7 13L14 7.5" stroke="#1d72fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                            <span className="eb-plan-feature-text">Instant Digital QR Ticket with Verification</span>
                          </div>
                        </>
                      )}

                      {/* Exclusions if present */}
                      {excList.length > 0 && (
                        <div className="eb-plan-subgroup eb-plan-exclusions-block">
                          <div className="eb-plan-subgroup-label">Exclusions:</div>
                          {visibleExcludes.map((exc, i) => (
                            <div key={`exc-${i}`} className="eb-plan-feature-item is-exclusion">
                              <span className="eb-plan-feature-icon is-exclusion">
                                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                  <circle cx="10" cy="10" r="9" stroke="#ff0000ff" strokeWidth="1.8" />
                                  <path d="M7 7L13 13M13 7L7 13" stroke="#ff0000ff" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                              </span>
                              <span className="eb-plan-feature-text is-exclusion">{exc}</span>
                            </div>
                          ))}

                          {hasManyExcludes && (
                            <button
                              type="button"
                              className="eb-plan-read-more-btn is-exclusion"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedExcludes((prev) => ({
                                  ...prev,
                                  [tier.key]: !prev[tier.key],
                                }));
                              }}
                            >
                              {isExpandedExc ? (
                                <>
                                  <span>Read less</span>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="18 15 12 9 6 15" />
                                  </svg>
                                </>
                              ) : (
                                <>
                                  <span>+{excList.length - 2} more excluded • Read more</span>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9" />
                                  </svg>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Description note if long */}
                      {tier.description && tier.perks && tier.perks.length > 0 && !tier.perks.includes(tier.description) && (
                        <p className="eb-plan-desc-note">{tier.description}</p>
                      )}
                    </div>

                    {/* Divider line */}
                    <div className="eb-plan-divider" />

                    {/* Bottom Row: Users icon + Label on Left | Quantity Counter Pill on Right */}
                    <div className="eb-plan-bottom-row" onClick={(e) => e.stopPropagation()}>
                      <div className="eb-plan-users-meta">
                        <div className="eb-plan-users-icon-wrap">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                        </div>
                        <div className="eb-plan-users-text">
                          <strong className="eb-plan-users-title">Attendees</strong>
                          <span className="eb-plan-users-sub">
                            {tier.availableSeats ? `Max ${maxAllowed} passes • ${tier.availableSeats} available` : `Starting at ${count} pass`}
                          </span>
                        </div>
                      </div>

                      <div className="eb-plan-counter-pill">
                        <button
                          type="button"
                          className="eb-plan-counter-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCount(tier.key, Math.max(1, count - 1));
                          }}
                          disabled={count <= 1}
                          aria-label="Decrease attendees"
                        >
                          −
                        </button>
                        <span className="eb-plan-counter-value">{count}</span>
                        <button
                          type="button"
                          className="eb-plan-counter-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCount(tier.key, Math.min(maxAllowed, count + 1));
                          }}
                          disabled={count >= maxAllowed}
                          aria-label="Increase attendees"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className="eb-no-packages">
            <strong>Tickets are not available yet</strong>
            <span>The host has not published a ticket package for this event.</span>
          </div>
        )}
      </div>
    </section>
  );
}

// function CategoryBookingBrief({ event }) {
//   const [expanded, setExpanded] = useState(false);
//   const { config, details } = getCategoryDetails(event);
//   const bikeReq = resolveBikeRequirements(event);
//   const hasBike = Boolean(bikeReq && (bikeReq.bikeType || bikeReq.brand || bikeReq.model || bikeReq.engineCC));

//   if (!config && !hasBike) return null;

//   const keyBikeSummary = [
//     bikeReq?.bikeType,
//     bikeReq?.brand,
//     bikeReq?.model,
//     bikeReq?.engineCC ? (String(bikeReq.engineCC).toLowerCase().includes('cc') ? bikeReq.engineCC : `${bikeReq.engineCC} cc`) : null
//   ].filter(Boolean).join(' • ');

//   return (
//     <section className="eb-category-brief">
//       <div
//         className="eb-category-brief__bar"
//         onClick={() => setExpanded(!expanded)}
//         role="button"
//         tabIndex={0}
//       >
//         <div className="eb-category-brief__info">
//           <span className="eb-category-brief__tag">📋 {config?.category || 'Ride'} Requirements</span>
//           {keyBikeSummary && <strong className="eb-category-brief__summary">{keyBikeSummary}</strong>}
//         </div>
//         <button type="button" className="eb-category-brief__toggle" aria-expanded={expanded}>
//           {expanded ? 'Hide details ▴' : 'View details ▾'}
//         </button>
//       </div>
//       {expanded && (
//         <div className="eb-category-brief__grid">
//           {hasBike && (
//             <>
//               {bikeReq.bikeType && <div><span>Bike Type</span><strong>{bikeReq.bikeType}</strong></div>}
//               {bikeReq.brand && <div><span>Required Brand</span><strong>{bikeReq.brand}</strong></div>}
//               {bikeReq.model && <div><span>Required Model</span><strong>{bikeReq.model}</strong></div>}
//               {bikeReq.engineCC && (
//                 <div>
//                   <span>Minimum CC</span>
//                   <strong>{String(bikeReq.engineCC).toLowerCase().includes('cc') ? bikeReq.engineCC : `${bikeReq.engineCC} cc`}</strong>
//                 </div>
//               )}
//             </>
//           )}
//           {details.map((field) => {
//             const isLongText = typeof field.value === 'string' && field.value.length > 60;
//             return (
//               <div key={field.id} className={isLongText ? 'eb-category-item--wide' : ''}>
//                 <span>{field.label}</span>
//                 <strong>{formatCategoryValue(field.value, field)}</strong>
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </section>
//   );
// }

function AttendeesStep({
  totalTickets,
  attendees,
  updateAttendee,
  contact,
  setContact,
  emergency,
  setEmergency,
  bookingForSelf,
  onBookingForSelf,
  user,
}) {
  const handleBuyerChange = (field, value) => {
    setContact((prev) => ({ ...prev, [field]: value }));

    // If booking for self, sync primary attendee details automatically
    if (bookingForSelf) {
      if (field === 'name') updateAttendee(0, 'name', value);
      if (field === 'phone') updateAttendee(0, 'phone', value);
      if (field === 'email') updateAttendee(0, 'email', value);
    }
  };

  return (
    <div className="eb-attendees-step">
      {/* ── 1. Buyer Information Section ── */}
      <div className="eb-step-section">
        <h2 className="eb-buyer-title">Edit buyer information</h2>

        <div className="eb-buyer-card">
          <Field label="Full name">
            <input
              type="text"
              value={contact.name}
              onChange={(e) => handleBuyerChange('name', e.target.value)}
              placeholder="Full name"
              autoComplete="name"
            />
          </Field>

          <Field label="Mobile number" isLocked={true}>
            <input
              type="tel"
              value={contact.phone}
              onChange={(e) => handleBuyerChange('phone', e.target.value)}
              placeholder="Mobile number"
              autoComplete="tel"
              maxLength={15}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={contact.email}
              onChange={(e) => handleBuyerChange('email', e.target.value)}
              placeholder="Email"
              autoComplete="email"
            />
          </Field>

          <Field label="Emergency contact person">
            <input
              type="text"
              value={emergency.name}
              onChange={(e) => setEmergency((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Parent / Spouse / Friend"
            />
          </Field>

          <Field label="Emergency contact number">
            <input
              type="tel"
              value={emergency.phone}
              onChange={(e) => setEmergency((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Emergency contact number"
              maxLength={15}
            />
          </Field>
        </div>
      </div>

      {/* ── 2. Self Booking Toggle ── */}
      <label className={`eb-self-booking-toggle ${bookingForSelf ? 'is-active' : ''}`}>
        <input
          type="checkbox"
          checked={bookingForSelf}
          onChange={(event) => onBookingForSelf(event.target.checked)}
        />
        <div className="eb-self-booking-toggle__text">
          <strong>Booking for myself</strong>
          <small>
            {user
              ? 'Using your saved account details for buyer and primary rider.'
              : 'Sign in to use your saved profile details automatically.'}
          </small>
        </div>
      </label>

      {/* ── 3. Rider / Attendee Details Section ── */}
      <div className="eb-step-section eb-step-section--attendees">
        <div className="eb-step-section-head">
          <h2 className="eb-buyer-title">
            {totalTickets > 1 ? `Rider details (${totalTickets} attendees)` : 'Rider details'}
          </h2>
          <span className="eb-section-subtitle">
            Attendee names should match the government ID shown at check-in.
          </span>
        </div>

        <div className="eb-attendee-stack">
          {Array.from({ length: totalTickets }, (_, index) => {
            const attendee = attendees[index] || makeAttendee(index);
            const isSelf = index === 0 && bookingForSelf;

            return (
              <article key={index} className="eb-attendee-card">
                <div className="eb-attendee-card__header">
                  <div className="eb-attendee-card__badge">
                    <FaIdCard />
                    <strong>{isSelf ? 'Attendee 1 — You' : `Attendee ${index + 1}`}</strong>
                  </div>
                  {isSelf && <span className="eb-attendee-pill">Primary Rider</span>}
                </div>

                <div className="eb-attendee-grid">
                  <Field label="Full name">
                    <input
                      type="text"
                      value={attendee.name}
                      onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                      placeholder="Rider name"
                    />
                  </Field>

                  <Field label="Mobile number" isLocked={isSelf}>
                    <input
                      type="tel"
                      value={attendee.phone}
                      onChange={(e) => updateAttendee(index, 'phone', e.target.value)}
                      placeholder="Mobile number"
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      type="email"
                      value={attendee.email}
                      onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                      placeholder="Ticket email"
                    />
                  </Field>

                  <Field label="Age">
                    <input
                      type="text"
                      value={attendee.age}
                      onChange={(e) => updateAttendee(index, 'age', e.target.value.replace(/\D/g, ''))}
                      placeholder="18+"
                      maxLength={3}
                    />
                  </Field>

                  <Field label="Gender">
                    <select
                      value={attendee.gender}
                      onChange={(e) => updateAttendee(index, 'gender', e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </Field>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RideSetupStep({
  event,
  joinAs,
  setJoinAs,
  bike,
  setBike,
  preferences,
  setPreferences,
  selectedTiers,
  userBikes = [],
  requiresVehicle = true,
}) {
  const bikeReq = resolveBikeRequirements(event);
  const hasRequirement = Boolean(bikeReq);

  const reqCC = bikeReq?.engineCC ? parseInt(String(bikeReq.engineCC).replace(/\D/g, ''), 10) : 0;
  const userCC = parseInt(
    String(bike.engineCC || (bike.model ? (bike.model.match(/\b\d{3,4}\b/) || [])[0] : '') || 0).replace(/\D/g, ''),
    10
  );
  const ccBelow = reqCC > 0 && userCC > 0 && userCC < reqCC;

  // derive joinAs from selected ticket types: default to biker unless ticket is explicitly pillion/passenger/spectator
  useEffect(() => {
    if (selectedTiers && selectedTiers.length > 0) {
      const isAllPillionOrSpectator = selectedTiers.every(isPillionOrSpectatorTier);
      if (isAllPillionOrSpectator) {
        const isSpectator = selectedTiers.every((t) => {
          const str = `${t.ticketFor || ''} ${t.name || ''} ${t.packageName || ''}`.toLowerCase();
          return str.includes('spectator') || str.includes('visitor') || str.includes('audience') || str.includes('guest') || str.includes('fan');
        });
        setJoinAs(isSpectator ? 'spectator' : 'pillion');
      } else {
        setJoinAs('biker');
      }
    } else {
      setJoinAs('biker');
    }
  }, [selectedTiers, setJoinAs]);

  const showVehicleSetup = requiresVehicle && joinAs === 'biker';

  return (
    <section className="eb-panel">
      <div className="eb-panel__head">
        <div>
          <p className="eb-kicker">{showVehicleSetup ? 'Ride setup' : 'Preferences'}</p>
          <h2>
            {showVehicleSetup
              ? 'Vehicle setup'
              : joinAs === 'spectator'
              ? 'Spectator preferences'
              : 'Pillion preferences'}
          </h2>
        </div>
        <span>
          {showVehicleSetup
            ? 'This helps Nitroxx plan marshals, ride safety, and rider grouping.'
            : 'Let Nitroxx know if you have any special requirements or notes.'}
        </span>
      </div>

      {/* ── Case 1: Event has Bike Requirements (Only for Bikers) ── */}
      {showVehicleSetup && hasRequirement && (
        <div className="eb-bike-req-banner">
          <div className="eb-bike-req-banner__header">
            <span className="eb-bike-req-pill">Event Bike Criteria</span>
            <h4>Organizer Required Bike Specification</h4>
            <p>
              This ride requires the specified bike, or an <strong>equal / upper model</strong> with matching or higher engine capacity.
            </p>
          </div>

          <div className="eb-bike-req-chips">
            {bikeReq.brand && (
              <div className="eb-bike-req-chip">
                <span className="eb-bike-req-chip__label">Brand</span>
                <strong className="eb-bike-req-chip__val">{bikeReq.brand}</strong>
              </div>
            )}
            {bikeReq.model && (
              <div className="eb-bike-req-chip">
                <span className="eb-bike-req-chip__label">Min Model</span>
                <strong className="eb-bike-req-chip__val">{bikeReq.model} (or upper model)</strong>
              </div>
            )}
            {reqCC > 0 && (
              <div className="eb-bike-req-chip">
                <span className="eb-bike-req-chip__label">Min Capacity</span>
                <strong className="eb-bike-req-chip__val">≥ {reqCC} cc</strong>
              </div>
            )}
            {bikeReq.bikeType && (
              <div className="eb-bike-req-chip">
                <span className="eb-bike-req-chip__label">Type</span>
                <strong className="eb-bike-req-chip__val">{bikeReq.bikeType}</strong>
              </div>
            )}
            {bikeReq.criteria && (
              <div className="eb-bike-req-chip eb-bike-req-chip--full">
                <span className="eb-bike-req-chip__label">Notes</span>
                <strong className="eb-bike-req-chip__val">{bikeReq.criteria}</strong>
              </div>
            )}
          </div>

          {/* Requirement Compliance: Option to tick "Yes I have" or "I have upper CC / model of bike" */}
          <div className="eb-bike-eligibility-group">
            <p className="eb-eligibility-heading">Tick your bike eligibility:</p>

            <label className={`eb-eligibility-card ${bike.eligibilityType === 'exact' ? 'is-selected' : ''}`}>
              <input
                type="radio"
                name="bikeEligibility"
                value="exact"
                checked={bike.eligibilityType === 'exact'}
                onChange={() => {
                  setBike((prev) => ({
                    ...prev,
                    eligibilityType: 'exact',
                    requirementConfirmed: true,
                    brand: prev.brand || bikeReq.brand || '',
                    model: prev.model || bikeReq.model || '',
                    engineCC: prev.engineCC || (reqCC > 0 ? String(reqCC) : ''),
                  }));
                }}
              />
              <div className="eb-eligibility-card__text">
                <div className="eb-eligibility-card__title-row">
                  <span className="eb-eligibility-tick-box">
                    {bike.eligibilityType === 'exact' ? '✓' : ''}
                  </span>
                  <strong>Yes, I have the required bike</strong>
                </div>
                <small>
                  I have the {[bikeReq.brand, bikeReq.model].filter(Boolean).join(' ') || 'required bike'}{reqCC > 0 ? ` (${reqCC} cc)` : ''} specified for this event.
                </small>
              </div>
            </label>

            <label className={`eb-eligibility-card ${bike.eligibilityType === 'upper' ? 'is-selected' : ''}`}>
              <input
                type="radio"
                name="bikeEligibility"
                value="upper"
                checked={bike.eligibilityType === 'upper'}
                onChange={() => {
                  setBike((prev) => ({
                    ...prev,
                    eligibilityType: 'upper',
                    requirementConfirmed: true,
                  }));
                }}
              />
              <div className="eb-eligibility-card__text">
                <div className="eb-eligibility-card__title-row">
                  <span className="eb-eligibility-tick-box">
                    {bike.eligibilityType === 'upper' ? '✓' : ''}
                  </span>
                  <strong>I have an upper CC / higher model of bike</strong>
                </div>
                <small>
                  My bike has higher engine displacement ({reqCC > 0 ? `> ${reqCC} cc` : 'higher capacity'}) or is an upper model capable of this event.
                </small>
              </div>
            </label>
          </div>

          {userCC > 0 && reqCC > 0 && (
            <div style={{ marginTop: '12px' }}>
              {ccBelow && bike.eligibilityType === 'exact' ? (
                <div className="eb-compliance-alert eb-compliance-alert--warn">
                  ⚠️ Entered engine capacity ({userCC}cc) is below the required minimum of {reqCC}cc. If your motorcycle has higher specifications, tick &quot;I have an upper CC / higher model of bike&quot;.
                </div>
              ) : userCC >= reqCC ? (
                <div className="eb-compliance-alert eb-compliance-alert--success">
                  ✓ Engine capacity ({userCC}cc) meets or exceeds requirement ({reqCC}cc).
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Garage Quick Select (Only for Bikers) */}
      {showVehicleSetup && userBikes && userBikes.length > 0 && (
        <div className="eb-garage-selector">
          <p className="eb-garage-title">Select from your garage:</p>
          <div className="eb-garage-chips">
            {userBikes.map((ub, idx) => {
              const bBrand = ub.brand || ub.make || '';
              const bModel = ub.model || ub.bikeModel || '';
              const bReg = ub.regNumber || ub.registration || ub.registrationNumber || '';
              const bCC = ub.cc || ub.engineCC || ub.capacity || '';
              const isSelected = bike.registration === bReg && bike.model === bModel;

              return (
                <button
                  key={ub.id || idx}
                  type="button"
                  className={`eb-garage-chip ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => {
                    setBike((prev) => ({
                      ...prev,
                      brand: bBrand,
                      model: bModel,
                      registration: formatVehicleNumber(bReg),
                      engineCC: bCC ? String(bCC) : prev.engineCC,
                      requirementConfirmed: true,
                    }));
                  }}
                >
                  <strong>{bBrand} {bModel}</strong>
                  <span>{bReg} {bCC ? `(${bCC}cc)` : ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Vehicle Form Grid (Only for Bikers) */}
      {showVehicleSetup && (
        <div className="eb-form-grid eb-form-grid--wide">
          <Field label="Bike brand">
            <input
              value={bike.brand}
              onChange={(e) => setBike({ ...bike, brand: e.target.value })}
              placeholder={hasRequirement && bikeReq.brand ? `e.g. ${bikeReq.brand}` : 'Royal Enfield, BMW, KTM'}
            />
          </Field>
          <Field label="Model">
            <input
              value={bike.model}
              onChange={(e) => setBike({ ...bike, model: e.target.value })}
              placeholder={hasRequirement && bikeReq.model ? `e.g. ${bikeReq.model} or higher` : 'Himalayan, GS 310, Duke'}
            />
          </Field>
          <Field label="Engine Capacity (CC)">
            <input
              type="text"
              value={bike.engineCC || ''}
              onChange={(e) => setBike({ ...bike, engineCC: e.target.value.replace(/\D/g, '') })}
              placeholder={reqCC > 0 ? `Min ${reqCC} cc` : 'e.g. 450'}
            />
          </Field>
          <Field
            label="Registration number"
            error={bike.registration && !isValidRegistrationNumber(bike.registration) ? "Enter valid vehicle number (e.g. MP04XX1231)" : null}
          >
            <input
              value={bike.registration}
              onChange={(e) => setBike({ ...bike, registration: formatVehicleNumber(e.target.value) })}
              placeholder="e.g. MP04XX1231"
              maxLength={10}
              autoCapitalize="characters"
            />
          </Field>
          <Field label="Riding experience">
            <select
              value={preferences.experience}
              onChange={(e) => setPreferences({ ...preferences, experience: e.target.value })}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
              <option>Professional</option>
            </select>
          </Field>
          <Field label="Preferred pace">
            <select
              value={preferences.pace}
              onChange={(e) => setPreferences({ ...preferences, pace: e.target.value })}
            >
              <option>Relaxed</option>
              <option>Balanced</option>
              <option>Sport</option>
            </select>
          </Field>
        </div>
      )}

      {/* Preferences for Pillion Riders (NO Vehicle) */}
      {!showVehicleSetup && joinAs === 'pillion' && (
        <div className="eb-form-grid eb-form-grid--wide">
          <Field label="Preferred pace (Optional)">
            <select
              value={preferences.pace}
              onChange={(e) => setPreferences({ ...preferences, pace: e.target.value })}
            >
              <option>Relaxed</option>
              <option>Balanced</option>
              <option>Sport</option>
            </select>
          </Field>
        </div>
      )}

      <Field label="Special request">
        <textarea
          value={preferences.notes}
          onChange={(e) => setPreferences({ ...preferences, notes: e.target.value })}
          placeholder="Accessibility needs, group name, medical note, arrival delay..."
        />
      </Field>
    </section>
  );
}

function AddOnsStep({ selectedAddOns, toggleAddOn, preferences, setPreferences, availableAddOns }) {
  return (
    <section className="eb-panel">
      <div className="eb-panel__head">
        <p className="eb-kicker">Make it complete</p>
        <h2>Add-ons and required consents</h2>
        <span>Optional extras are charged per booking.</span>
      </div>
      <div className="eb-addons">
        {availableAddOns.length > 0 ? availableAddOns.map((addOn) => (
          <button
            type="button"
            key={addOn.key}
            className={`eb-addon${selectedAddOns.includes(addOn.key) ? ' is-selected' : ''}`}
            onClick={() => toggleAddOn(addOn.key)}
          >
            <span className="eb-addon__check">{selectedAddOns.includes(addOn.key) ? <FaCheck /> : null}</span>
            <strong>{addOn.title}</strong>
            <small>{addOn.text}</small>
            <b>{formatMoney(addOn.price)}</b>
          </button>
        )) : <p style={{ color: '#66707d', gridColumn: '1/-1' }}>No add-ons available for this event.</p>}
      </div>
      <div className="eb-consents">
        {/* <label>
          <input
            type="checkbox"
            checked={preferences.helmetConfirmed}
            onChange={(e) => setPreferences({ ...preferences, helmetConfirmed: e.target.checked })}
          />
          I confirm every rider will wear a certified helmet and follow marshal instructions.
        </label> */}
        <label>
          <input
            type="checkbox"
            checked={preferences.termsAccepted}
            onChange={(e) => setPreferences({ ...preferences, termsAccepted: e.target.checked })}
          />
          I accept Nitroxx event terms, cancellation rules, and safety waiver.
        </label>
        <label>
          <input
            type="checkbox"
            checked={preferences.whatsappUpdates}
            onChange={(e) => setPreferences({ ...preferences, whatsappUpdates: e.target.checked })}
          />
          I Accept All the Terms & Conditions of Event Organiser
        </label>
      </div>
    </section>
  );
}

function PaymentStep({
  event,
  summary,
  contact,
  setContact,
  emergency,
  setEmergency,
  profile,
  user,
  tiers,
  counts,
  selectedAddOns,
  availableAddOns,
  couponInput,
  setCouponInput,
  appliedCoupon,
  applyCoupon,
  removeCoupon,
  couponError,
  setStep,
  onPay,
  submitting,
}) {
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [showEditBuyerModal, setShowEditBuyerModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editEmergencyName, setEditEmergencyName] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');

  const buyerName =
    contact?.name ||
    profile?.fullName ||
    profile?.name ||
    profile?.displayName ||
    user?.displayName ||
    user?.fullName ||
    'Raj';
  const rawPhone =
    contact?.phone ||
    profile?.phoneNumber ||
    profile?.phone ||
    user?.phoneNumber ||
    user?.phone ||
    '';
  const formattedPhone = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : `+91 ${rawPhone}`) : '+91 8869959066';
  const buyerEmail =
    contact?.email ||
    profile?.email ||
    user?.email ||
    'developersucks@gmail.com';
  const userLocation =
    profile?.state ||
    profile?.city ||
    event?.state ||
    event?.city ||
    'Andaman and Nicobar Islands';

  useEffect(() => {
    setEditName(buyerName);
    setEditEmail(buyerEmail);
    setEditEmergencyName(emergency?.name || '');
    setEditEmergencyPhone(emergency?.phone || '');
  }, [buyerName, buyerEmail, emergency, showEditBuyerModal]);

  const handleSaveBuyer = () => {
    if (setContact) {
      setContact((prev) => ({
        ...prev,
        name: editName.trim() || prev.name,
        email: editEmail.trim() || prev.email,
      }));
    }
    if (setEmergency) {
      setEmergency({
        name: editEmergencyName.trim(),
        phone: editEmergencyPhone.trim(),
      });
    }
    setShowEditBuyerModal(false);
  };

  const eventThumb =
    event?.bannerUrl ||
    event?.imageUrl ||
    event?.image ||
    event?.bannerImage ||
    event?.banner ||
    event?.coverImage ||
    event?.ticketTemplateUrl ||
    event?.media?.primaryImage ||
    (Array.isArray(event?.images) && event.images[0]) ||
    '/assets/images/mandu-fort-ride.png';

  const displayDate = useMemo(() => {
    if (event?.dateTimeText) return event.dateTimeText;
    if (event?.dateText && event?.time) return `${event.dateText} | ${event.time}`;
    if (event?.dateText) return event.dateText;
    const rawDate = event?.startDate || event?.date;
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const m = months[d.getMonth()];
          const day = d.getDate();
          let timeStr = event?.time || '';
          if (!timeStr) {
            const h = d.getHours();
            const mins = d.getMinutes();
            const ampm = h >= 12 ? 'PM' : 'AM';
            const hr = h % 12 || 12;
            timeStr = mins > 0 ? `${hr}:${mins < 10 ? '0' : ''}${mins} ${ampm}` : `${hr}${ampm}`;
          }
          return `${m} ${day}${timeStr ? ` | ${timeStr}` : ''}`;
        }
      } catch (_) {}
    }
    return 'November 7 | 11AM';
  }, [event]);

  const displayLocation = useMemo(() => {
    if (event?.venue && (event?.city || event?.state)) {
      return [event.venue, event.city].filter(Boolean).join(', ');
    }
    return event?.venue || event?.location || event?.city || 'Timezone, Bhopal';
  }, [event]);

  const activeTiers = useMemo(() => {
    return tiers.filter((t) => Number(counts[t.key] || 0) > 0);
  }, [tiers, counts]);

  const activeAddOns = useMemo(() => {
    return availableAddOns.filter((a) => selectedAddOns.includes(a.key));
  }, [availableAddOns, selectedAddOns]);

  return (
    <div className="eb-pay-page">
      <div className="eb-pay-grid">
        {/* ── LEFT COLUMN (Desktop) / STACKED CONTENT (Mobile) ── */}
        <div className="eb-pay-col-main">
          {/* Section: Confirm details and payment (Desktop Title) */}
          <h2 className="eb-pay-sec-title eb-pay-desktop-only">Confirm details and payment</h2>

          {/* Buyer Card (Desktop: At Top; Mobile: Under "INVOICE DETAILS") */}
          <div className="eb-pay-buyer-section">
            <div className="eb-section-divider-bar eb-pay-mobile-only">
              <span>Invoice Details</span>
            </div>

            <div className="eb-pay-buyer-card">
              <div className="eb-pay-buyer-icon">
                <FaRegUser className="eb-pay-user-outline-icon" />
              </div>
              <div className="eb-pay-buyer-body">
                <h4>Buying tickets for <strong>{buyerName}</strong></h4>
                <div className="eb-pay-buyer-sub eb-pay-desktop-only">
                  <span>{formattedPhone} | {buyerEmail} | {userLocation}</span>
                </div>
                <div className="eb-pay-buyer-sub eb-pay-mobile-only">
                  <span>{formattedPhone} {buyerEmail}</span>
                  <span>{userLocation}</span>
                </div>
                {(emergency?.name || emergency?.phone) && (
                  <div className="eb-pay-buyer-emerg">
                    <span className="eb-pay-emerg-label">Emergency contact:</span>
                    <span className="eb-pay-emerg-val">
                      {[emergency.name, emergency.phone].filter(Boolean).join(' • ')}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="eb-pay-edit-btn"
                onClick={() => setShowEditBuyerModal(true)}
                title="Edit buyer details"
                aria-label="Edit buyer details"
              >
                <FaRegEdit />
              </button>
            </div>
          </div>

          {/* ── OFFERS SECTION ── */}
          <div className="eb-pay-offers-section">
            <h3 className="eb-pay-sec-heading eb-pay-desktop-only">Offers</h3>
            <div className="eb-section-divider-bar eb-pay-mobile-only">
              <span>Offers</span>
            </div>

            <div className="eb-pay-card eb-pay-offers-card">
              {/* Featured Offer Row (Desktop) */}
              <div className="eb-pay-offer-item eb-pay-desktop-only">
                <div className="eb-pay-offer-badge">
                  <FaPercentage />
                </div>
                <div className="eb-pay-offer-content">
                  <strong>{appliedCoupon ? `${appliedCoupon.code} Applied` : '30% OFF up to ₹300'}</strong>
                  <p>
                    {appliedCoupon
                      ? `Saved ${formatMoney(summary.discount)} with this code`
                      : 'Save ₹168 with this code'}
                  </p>
                  <button
                    type="button"
                    className="eb-pay-link-btn"
                    onClick={() => setShowCouponInput((prev) => !prev)}
                  >
                    {showCouponInput ? 'Hide offers ▴' : 'View all offers >'}
                  </button>
                </div>
                <div className="eb-pay-offer-action">
                  {appliedCoupon ? (
                    <button
                      type="button"
                      className="eb-pay-pill-btn eb-pay-pill-btn--remove"
                      onClick={removeCoupon}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="eb-pay-pill-btn"
                      onClick={() => {
                        setCouponInput('NITROXX10');
                        applyCoupon();
                      }}
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>

              {/* Offers Row (Mobile - Matches Image 3 & 4) */}
              <div
                className="eb-pay-offer-row eb-pay-offer-row--mob eb-pay-mobile-only"
                onClick={() => {
                  if (appliedCoupon) {
                    removeCoupon();
                  } else {
                    setShowCouponInput((prev) => !prev);
                  }
                }}
              >
                <div className="eb-pay-offer-row__left">
                  <div className="eb-pay-mob-percent-badge">
                    <FaPercentage />
                  </div>
                  <span>{appliedCoupon ? `${appliedCoupon.code} Applied (Tap to remove)` : 'View all offers'}</span>
                </div>
                <FaChevronRight className="eb-pay-chevron" />
              </div>

              {/* Expandable / Manual Coupon Form */}
              {(showCouponInput || couponError) && !appliedCoupon && (
                <div className="eb-pay-coupon-drawer">
                  <div className="eb-pay-coupon-form">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter promo / coupon code"
                    />
                    <button
                      type="button"
                      className="eb-pay-pill-btn"
                      onClick={applyCoupon}
                      disabled={!couponInput.trim()}
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="eb-pay-coupon-err">{couponError}</p>}
                </div>
              )}

              <div className="eb-pay-card-divider" />

              {/* Payment Offers Row */}
              <div
                className="eb-pay-offer-row"
                onClick={() => {
                  setCouponInput('NITROXX10');
                  setShowCouponInput(true);
                }}
              >
                <div className="eb-pay-offer-row__left">
                  <FaCreditCard className="eb-pay-card-icon" />
                  <span>View all payment offers</span>
                </div>
                <FaChevronRight className="eb-pay-chevron" />
              </div>
            </div>
          </div>

          {/* ── PAYMENT SUMMARY SECTION ── */}
          <div className="eb-pay-summary-section">
            <h3 className="eb-pay-sec-heading eb-pay-desktop-only">Payment summary</h3>
            <div className="eb-section-divider-bar eb-pay-mobile-only">
              <span>Payment Summary</span>
            </div>

            <div className="eb-pay-card eb-pay-summary-card">
              <div className="eb-pay-summary-line">
                <span className="eb-pay-summary-label">
                  Order amount <FaChevronDown style={{ fontSize: '10px', marginLeft: '4px' }} />
                </span>
                <span className="eb-pay-summary-val">{formatMoney(summary.ticketTotal + summary.addOnTotal)}</span>
              </div>

              <div className="eb-pay-summary-line">
                <span className="eb-pay-summary-label">Booking fee</span>
                <span className="eb-pay-summary-val">
                  <span className="eb-fee-strikethrough">₹33.6</span>
                  <strong className="eb-fee-free">₹0</strong>
                </span>
              </div>

              {summary.discount > 0 && (
                <div className="eb-pay-summary-line eb-pay-summary-line--discount">
                  <span className="eb-pay-summary-label">Coupon discount</span>
                  <strong className="eb-pay-discount-val">-{formatMoney(summary.discount)}</strong>
                </div>
              )}

              <div className="eb-pay-card-divider" />

              <div className="eb-pay-summary-line eb-pay-summary-line--grand">
                <strong>Grand Total</strong>
                <strong className="eb-pay-grand-total">{formatMoney(summary.total)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Desktop Sidebar & Order Card) / TOP (Mobile) ── */}
        <div className="eb-pay-col-side">
          {/* Event Header (Matches Image 2 & 3: Above the Card on both Desktop & Mobile) */}
          <div className="eb-pay-event-header">
            <img
              src={eventThumb}
              alt={event?.title || 'Event'}
              className="eb-pay-event-thumb"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/assets/images/mandu-fort-ride.png';
              }}
            />
            <div className="eb-pay-event-info">
              <h4>{event?.title || 'Timezone | DB Mall - Bhopal'}</h4>
              <p>{displayLocation}</p>
            </div>
          </div>

          <div className="eb-pay-order-card">
            {/* Date & Time */}
            <div className="eb-pay-date-row">
              <strong>{displayDate}</strong>
            </div>

            <div className="eb-pay-card-divider" />

            {/* Selected Ticket Tiers */}
            <div className="eb-pay-items-list">
              {activeTiers.map((tier) => {
                const count = Number(counts[tier.key] || 0);
                return (
                  <div key={tier.key} className="eb-pay-item-row">
                    <div className="eb-pay-item-desc">
                      <strong>{count} x {tier.name}</strong>
                    </div>
                    <div className="eb-pay-item-pricing">
                      <strong>{formatMoney(tier.price * count)}</strong>
                      <button
                        type="button"
                        className="eb-pay-remove-link"
                        onClick={() => setStep(1)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}

              {activeAddOns.map((addon) => (
                <div key={addon.key} className="eb-pay-item-row">
                  <div className="eb-pay-item-desc">
                    <strong>1 x {addon.title}</strong>
                  </div>
                  <div className="eb-pay-item-pricing">
                    <strong>{formatMoney(addon.price)}</strong>
                  </div>
                </div>
              ))}
            </div>

            <div className="eb-pay-card-divider" />

            {/* M-Ticket Row */}
            <div className="eb-pay-mticket-row">
              <span className="eb-pay-mticket-icon">
                <FaTicketAlt />
              </span>
              <p>
                <strong>M-Ticket:</strong> Entry using the QR code in your app
              </p>
            </div>

            {/* CTA Button (Desktop View) */}
            <div className="eb-pay-desktop-only" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="eb-pay-cta-btn"
                onClick={onPay}
                disabled={submitting}
                aria-label="Pay now"
              >
                <div className="eb-pay-cta-btn__total">
                  <strong>{formatMoney(summary.total)}</strong>
                  <span>TOTAL</span>
                </div>
                <div className="eb-pay-cta-btn__label">
                  {submitting ? 'Processing...' : 'Pay Now'}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Buyer Information Modal (Pixel-Perfect Match with Image 1) ── */}
      {showEditBuyerModal && (
        <div className="eb-modal-overlay" onClick={() => setShowEditBuyerModal(false)}>
          <div className="eb-edit-buyer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="eb-edit-buyer-modal__header">
              <h2>Edit buyer information</h2>
              <button
                type="button"
                className="eb-modal-close-btn"
                onClick={() => setShowEditBuyerModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Rounded Card Enclosing the Fields (Image 1) */}
            <div className="eb-edit-buyer-card">
              <div className="eb-buyer-field-box">
                <label className="eb-buyer-field-label">Full name</label>
                <input
                  type="text"
                  className="eb-buyer-field-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                />
              </div>

              <div className="eb-buyer-field-box eb-buyer-field-box--locked">
                <label className="eb-buyer-field-label">Mobile number</label>
                <input
                  type="tel"
                  className="eb-buyer-field-input"
                  value={rawPhone || '8869959066'}
                  readOnly
                  placeholder="Mobile number"
                  autoComplete="tel"
                />
                <FaLock className="eb-buyer-field-lock" />
              </div>

              <div className="eb-buyer-field-box">
                <label className="eb-buyer-field-label">Email</label>
                <input
                  type="email"
                  className="eb-buyer-field-input"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                />
              </div>

              <div className="eb-buyer-field-box">
                <label className="eb-buyer-field-label">Emergency contact person</label>
                <input
                  type="text"
                  className="eb-buyer-field-input"
                  value={editEmergencyName}
                  onChange={(e) => setEditEmergencyName(e.target.value)}
                  placeholder="e.g. Parent / Spouse / Friend"
                />
              </div>

              <div className="eb-buyer-field-box">
                <label className="eb-buyer-field-label">Emergency contact number</label>
                <input
                  type="tel"
                  className="eb-buyer-field-input"
                  value={editEmergencyPhone}
                  onChange={(e) => setEditEmergencyPhone(e.target.value)}
                  placeholder="Emergency contact number"
                  maxLength={15}
                />
              </div>
            </div>

            <div className="eb-edit-buyer-modal__actions">
              <button
                type="button"
                className="eb-modal-save-btn"
                onClick={handleSaveBuyer}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BookingSummary({
  event,
  summary,
  counts,
  selectedAddOns,
  currentStep,
  availableAddOns,
  onBack,
  onNext,
  submitting,
  totalSteps = STEPS.length,
}) {
  const selected = availableAddOns.filter((item) => selectedAddOns.includes(item.key));
  return (
    <aside className="eb-summary">
      <p className="eb-kicker">Order summary</p>
      <h3>{event.title}</h3>
      <div className="eb-summary__meta">
        <span><FaCalendarAlt />{event.dateTimeText || event.dateText}</span>
        <span><FaMapMarkerAlt />{event.location}</span>
      </div>
      <div className="eb-summary__rows">
        {Object.entries(counts).filter(([, value]) => value > 0).map(([key, value]) => (
          <div key={key}><span>{key} x {value}</span><strong>{formatMoney(summary.tierTotals[key] || 0)}</strong></div>
        ))}
        {selected.map((item) => (
          <div key={item.key}><span>{item.title}</span><strong>{formatMoney(item.price)}</strong></div>
        ))}
        {/* <div><span>Platform and gateway fee</span><strong>{formatMoney(summary.fees)}</strong></div> */}
        {summary.discount > 0 && <div><span>Coupon discount</span><strong>-{formatMoney(summary.discount)}</strong></div>}
      </div>
      <div className="eb-summary__total">
        <span>Total</span>
        <strong>{formatMoney(summary.total)}</strong>
      </div>
      <div className="eb-trust">
        <span><FaShieldAlt />Secure payment</span>
        <span><FaCheck />Instant ticket ID</span>
        <span><FaUserFriends />Host approval tracking</span>
      </div>
      <p className="eb-summary__hint">Step {currentStep} of {totalSteps}</p>
      <div className="eb-summary__actions">
        {currentStep > 1 && (
          <button
            type="button"
            className="eb-summary__btn-back"
            onClick={onBack}
            disabled={submitting}
            aria-label="Previous step"
          >
            <FaArrowLeft style={{ fontSize: '12px' }} />
            <span>Back</span>
          </button>
        )}
        <button
          type="button"
          className="eb-summary__btn-continue"
          onClick={onNext}
          disabled={submitting}
        >
          {submitting
            ? 'Creating booking...'
            : currentStep === totalSteps
            ? `Pay ${formatMoney(summary.total)}`
            : 'Continue'}
        </button>
      </div>
    </aside>
  );
}

const formatLandscapeDateTime = (evt) => {
  if (!evt) return 'Sun, 1 Nov, 5:30 am';

  const rawDate = evt.startDate || evt.date || evt.eventDate || evt.startsAt;
  const rawTime = evt.startTime || evt.time;

  let formattedDate = '';
  if (rawDate) {
    let dateObj = null;
    if (typeof rawDate?.toDate === 'function') {
      dateObj = rawDate.toDate();
    } else if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
      dateObj = rawDate;
    } else if (typeof rawDate === 'string' || typeof rawDate === 'number') {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
      }
    }

    if (dateObj) {
      try {
        const weekday = new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(dateObj);
        const day = dateObj.getDate();
        const month = new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(dateObj);
        formattedDate = `${weekday}, ${day} ${month}`;
      } catch (e) { }
    }
  }

  let formattedTime = '';
  if (rawTime) {
    const timeStr = String(rawTime).trim();
    if (/^\d{1,2}:\d{2}\s*(?:am|pm)?$/i.test(timeStr)) {
      if (/am|pm/i.test(timeStr)) {
        formattedTime = timeStr.toLowerCase();
      } else {
        const parts = timeStr.split(':');
        let h = parseInt(parts[0], 10);
        const m = parts[1].padStart(2, '0');
        const ampm = h >= 12 ? 'pm' : 'am';
        h = h % 12 || 12;
        formattedTime = `${h}:${m} ${ampm}`;
      }
    } else {
      formattedTime = timeStr;
    }
  }

  if (!formattedDate && evt.dateTimeText) {
    return evt.dateTimeText;
  }
  if (!formattedDate && evt.dateText) {
    formattedDate = evt.dateText;
  }

  if (formattedDate && formattedTime) {
    return `${formattedDate}, ${formattedTime}`;
  }
  if (formattedDate) {
    return `${formattedDate}, 5:30 am`;
  }
  if (evt.dateTimeText) {
    return evt.dateTimeText;
  }

  return 'Sun, 1 Nov, 5:30 am';
};

function TicketSuccessModal({
  booking,
  event,
  onClose,
  onNavigateProfile,
}) {
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(true);

  const title = event?.title || event?.name || 'Aravalli Mountain Escape Ride';
  const location =
    event?.venue ||
    event?.location ||
    event?.city ||
    event?.locationName ||
    event?.address ||
    'Celebration Mall Parking , udaipur, rajasthan';

  // Dynamic Date and Time matching "Sun, 1 Nov, 5:30 am"
  const formattedDateTime = formatLandscapeDateTime(event);

  // Dynamic Ticket Count (e.g. "x2")
  const qty =
    (typeof booking === 'object' && (booking?.totalTickets || booking?.tickets || booking?.ticketCount || booking?.attendees?.length)) ||
    2;

  // Dynamic Price (e.g. "₹54,000")
  let rawPrice = null;
  if (typeof booking === 'object' && booking !== null) {
    if (booking.total !== undefined && booking.total !== null && !isNaN(Number(booking.total))) {
      rawPrice = Number(booking.total);
    } else if (booking.amount !== undefined && booking.amount !== null && !isNaN(Number(booking.amount))) {
      rawPrice = Number(booking.amount);
    }
  }
  if (rawPrice === null && event) {
    if (event.price !== undefined && event.price !== null && !isNaN(Number(event.price))) {
      rawPrice = Number(event.price);
    } else if (event.ticketPrice !== undefined && event.ticketPrice !== null && !isNaN(Number(event.ticketPrice))) {
      rawPrice = Number(event.ticketPrice);
    }
  }
  if (rawPrice === null || rawPrice === undefined || isNaN(rawPrice)) {
    rawPrice = 54000;
  }
  const formattedPrice = Number(rawPrice).toLocaleString('en-IN');

  // Dynamic Persons Count (e.g. "x1")
  let persons = 1;
  if (typeof booking === 'object' && booking !== null) {
    if (Array.isArray(booking.attendees) && booking.attendees.length > 0) {
      persons = booking.attendees.length;
    } else if (booking.persons) {
      persons = booking.persons;
    } else if (booking.attendeesCount || booking.attendeeCounts?.adults) {
      persons = booking.attendeesCount || booking.attendeeCounts.adults;
    }
  }

  // Dynamic Background / Banner image from dynamic data
  const bannerImg =
    event?.bannerUrl ||
    event?.banner ||
    event?.bannerImage ||
    event?.image ||
    event?.imageUrl ||
    event?.coverImage ||
    event?.ticketTemplateUrl ||
    event?.media?.primaryImage ||
    (Array.isArray(event?.images) && event.images[0]) ||
    (typeof booking === 'object' && (booking?.event?.bannerUrl || booking?.event?.image || booking?.event?.banner)) ||
    '/assets/images/banner-1.jpeg';

  // Primary single-use ticketCode (e.g. "NTX-SC32-9066")
  const ticketId =
    (typeof booking === 'object' &&
      (booking?.ticketCode ||
        booking?.ticketNumber ||
        (booking?.bookingId ? (String(booking.bookingId).startsWith('NTX-') ? booking.bookingId : `NTX-${booking.bookingId}`) : ''))) ||
    'NTX-SC32-9066';

  // Unique QR check-in payload
  const qrCheckInPayload =
    (typeof booking === 'object' && booking?.qrPayload) ||
    JSON.stringify({
      ticketCode: ticketId,
      bookingId: (typeof booking === 'object' && (booking?.bookingRefId || booking?.id || booking?.bookingId)) || 'NTX-SC32-9066',
      eventId: event?.id || 'event-preview',
      attendeeEmail: (typeof booking === 'object' && (booking?.attendee?.email || booking?.attendees?.[0]?.email)) || 'rider@nitroxxin.in',
      signature: (typeof booking === 'object' && booking?.signature) || 'ntx_verified',
    });

  const qrUrl = getTicketQrUrl(qrCheckInPayload);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyId = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(ticketId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return createPortal(
    <div className="eb-ticket-modal-overlay" role="dialog" aria-modal="true">
      <div className="eb-ticket-modal-backdrop" onClick={onClose} />

      <div className="eb-ticket-modal-container">
        <button
          className="eb-ticket-modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close ticket pass"
        >
          ✕
        </button>

        <div className="eb-ticket-modal-header">
          <div className="eb-ticket-celebrate-pill">
            <FaCheck /> Booking Confirmed
          </div>
          <h3>Your Official Event Pass</h3>
          <p>Show this pass &amp; QR code at the event gate for instant check-in.</p>
        </div>

        {/* The Landscape Ticket Pass matching reference image */}
        <div className="ticket-pass-outer-shell">
          <div className="ticket-landscape-card">
            {/* LEFT MAIN AREA */}
            <div className="ticket-landscape-main">
              {/* Dynamic Banner Image */}
              <div className="ticket-landscape-banner">
                <img
                  src={bannerImg}
                  alt={title}
                  className="ticket-landscape-banner-img"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/images/banner-1.jpeg';
                  }}
                />
              </div>

              {/* Bottom Details Row */}
              <div className="ticket-landscape-details">
                <div className="ticket-landscape-event-info">
                  <h2 className="ticket-landscape-title" title={title}>
                    {title}
                  </h2>
                  <div className="ticket-landscape-meta-item location">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ticket-meta-icon"
                      aria-hidden="true"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{location}</span>
                  </div>
                  <div className="ticket-landscape-meta-item datetime">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="ticket-meta-icon"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{formattedDateTime}</span>
                  </div>
                </div>

                <div className="ticket-landscape-metrics-box">
                  <div className="ticket-metric-item">
                    <span className="metric-label">Tickets</span>
                    <span className="metric-value">x{qty}</span>
                  </div>
                  <div className="ticket-metric-item">
                    <span className="metric-label">Price</span>
                    <span className="metric-value">₹{formattedPrice}</span>
                  </div>
                  <div className="ticket-metric-item">
                    <span className="metric-label">Persons</span>
                    <span className="metric-value">x{persons}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PERFORATION DIVIDER & NOTCHES */}
            <div className="ticket-landscape-divider">
              <span className="ticket-landscape-notch notch-top" aria-hidden="true" />
              <span className="ticket-landscape-notch notch-bottom" aria-hidden="true" />
            </div>

            {/* RIGHT STUB AREA */}
            <div className="ticket-landscape-stub">
              <div className="ticket-stub-header">
                <img
                  src="/assets/images/logo-black.png"
                  alt="Nitroxxin"
                  className="ticket-stub-logo"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/images/logo-white.png';
                  }}
                />
              </div>

              <div className="ticket-stub-qr-wrap">
                <span className="ticket-stub-admit">ADMIT ONE</span>
                {qrLoaded ? (
                  <img
                    src={qrUrl}
                    alt="Scan ticket pass QR code for check-in"
                    className="ticket-stub-qr-img"
                    onError={() => setQrLoaded(false)}
                  />
                ) : (
                  <div className="ticket-stub-qr-fallback">
                    <FaTicketAlt size={36} color="#000000" />
                    <span>{ticketId}</span>
                  </div>
                )}
              </div>

              <div className="ticket-stub-footer">
                <div
                  className="ticket-stub-code-pill"
                  onClick={handleCopyId}
                  title="Click to copy entry code"
                >
                  <span>{ticketId}</span>
                </div>
                <span className="ticket-stub-code-label">ENTRY CODE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="eb-ticket-modal-actions">
          <button
            type="button"
            className="eb-ticket-btn eb-ticket-btn--primary"
            onClick={handlePrint}
          >
            📥 Download / Print
          </button>

          <button
            type="button"
            className="eb-ticket-btn eb-ticket-btn--secondary"
            onClick={onNavigateProfile}
          >
            🎟️ View Bookings
          </button>
        </div>

        <div className="eb-ticket-id-copy-row">
          <span>Ticket ID: <strong>{ticketId}</strong></span>
          <button type="button" onClick={handleCopyId} className="eb-ticket-copy-btn">
            {copied ? '✓ Copied' : 'Copy ID'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function EventBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { events, eventsLoading } = useEventsContext();
  const eventFromContext = events.find((e) => e.id === id);
  const eventFromState = location.state?.event;

  const fallbackQuery = useDocument(COLLECTIONS.events, !eventFromContext && !eventFromState && !eventsLoading ? id : null);

  const event = useMemo(() => {
    const raw = eventFromContext || eventFromState || (fallbackQuery.data ? normalizeEvent(fallbackQuery.data) : null);
    if (!raw) return null;
    const normalized = normalizeEvent(raw);
    const template = normalized.ticketTemplateUrl || location.state?.ticketTemplateUrl || '';
    return {
      ...normalized,
      ticketTemplateUrl: template,
    };
  }, [eventFromContext, eventFromState, fallbackQuery.data, location.state]);

  const loading = eventsLoading || (fallbackQuery.loading && !eventFromContext && !eventFromState);
  const statusInfo = useMemo(() => getEventStatusInfo(event), [event]);

  const { user, profile } = useAuth();
  const { openLogin } = useAuthModal();

  const { data: userBikes } = useCollection(user?.uid ? `users/${user.uid}/bikes` : null);

  const [step, setStep] = useState(1);
  const [counts, setCounts] = useState({});
  const [attendees, setAttendees] = useState([makeAttendee(0)]);
  const [contact, setContact] = useState({ name: '', phone: '', email: '' });
  const [emergency, setEmergency] = useState(() => getBestEmergency(profile));
  const [joinAs, setJoinAs] = useState('biker');
  const [bike, setBike] = useState({ brand: '', model: '', registration: '', engineCC: '', requirementConfirmed: false, eligibilityType: '' });
  const [preferences, setPreferences] = useState({
    experience: 'Intermediate',
    pace: 'Balanced',
    notes: '',
    helmetConfirmed: false,
    termsAccepted: false,
    whatsappUpdates: true,
  });
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [payment, setPayment] = useState({ method: 'upi', reference: '' });
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);

  // for opening ticket popup 
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
  const [showOrderBreakdown, setShowOrderBreakdown] = useState(false);

  const [error, setError] = useState('');
  const [bookingForSelf, setBookingForSelf] = useState(false);

  const tiers = useMemo(() => {
    const source = event?.ticketPackages || event?.packages || event?.ticketTiers || event?.tickets || event?.pricing?.packages || [];
    const packages = Array.isArray(source) ? source : Object.entries(source || {}).map(([id, value]) => ({ id, ...value }));
    return packages.map((item, index) => {
      const benefits = item.benefits || item.perks || item.inclusions || item.inclusion || [];
      const perks = Array.isArray(benefits) ? benefits : String(benefits).split(/[,\n]/).map((value) => value.trim()).filter(Boolean);
      const exclusionsRaw = item.exclusions || item.exclusion || [];
      const exclusions = Array.isArray(exclusionsRaw) ? exclusionsRaw : String(exclusionsRaw).split(/[,\n]/).map((value) => value.trim()).filter(Boolean);
      const availableSeats = Number(item.availableSeats ?? item.seats ?? item.capacity ?? item.quantity ?? 0);
      return {
        key: String(item.id || item.key || item.packageId || `package-${index}`),
        name: item.packageName || item.name || item.title || `Package ${index + 1}`,
        price: Number(item.price ?? item.amount ?? 0),
        availableSeats,
        description: item.shortDescription || item.description || (perks.length ? perks.join(', ') : 'Event access as specified by the host.'),
        perks,
        exclusions,
        ticketFor: item.ticketFor || item.type || '',
      };
    });
  }, [event]);

  const availableAddOns = useMemo(() => {
    const addons = event?.addOns || event?.addons || [];
    return addons.map((item, i) => ({
      key: item.id || item.key || `addon-${i}`,
      title: item.title || item.name || item.addonName,
      price: Number(item.price || item.amount || 0),
      text: item.text || item.description || ''
    }));
  }, [event]);

  useEffect(() => {
    setCounts((current) => tiers.reduce((next, tier, index) => ({ ...next, [tier.key]: current[tier.key] ?? (index === 0 ? 1 : 0) }), {}));
  }, [tiers]);

  const capacity = Number(event?.capacity || event?.ticketCapacity || 0);
  const registered = Number(event?.registeredCount || 0);
  const seatsLeft = capacity ? Math.max(0, capacity - registered) : 999;
  const totalTickets = Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0);

  const selectedTiers = useMemo(() => {
    return tiers.filter((t) => Number(counts[t.key] || 0) > 0);
  }, [tiers, counts]);

  const requiresVehicle = useMemo(() => {
    if (!selectedTiers || selectedTiers.length === 0) return true;
    return selectedTiers.some((tier) => !isPillionOrSpectatorTier(tier));
  }, [selectedTiers]);

  // Reactive sync for joinAs based on chosen ticket tiers
  useEffect(() => {
    if (selectedTiers.length > 0 && selectedTiers.every(isPillionOrSpectatorTier)) {
      const isSpectatorOnly = selectedTiers.every((t) => {
        const str = `${t.ticketFor || ''} ${t.name || ''} ${t.packageName || ''}`.toLowerCase();
        return str.includes('spectator') || str.includes('visitor') || str.includes('audience') || str.includes('guest') || str.includes('fan');
      });
      setJoinAs(isSpectatorOnly ? 'spectator' : 'pillion');
    } else {
      setJoinAs('biker');
    }
  }, [selectedTiers]);

  const currentSteps = useMemo(() => [
    { id: 1, label: 'Ticket' },
    { id: 2, label: 'Details' },
    { id: 3, label: requiresVehicle ? 'Setup' : 'Preferences' },
    { id: 4, label: 'Add Ons' },
    { id: 5, label: 'Payment' },
  ], [requiresVehicle]);

  const handleBookingForSelf = (checked) => {
    if (checked && !user) {
      openLogin();
      return;
    }
    setBookingForSelf(checked);
    if (!checked) return;

    const userPhone = getBestUserPhone(profile, user);
    const userName = profile?.fullName || profile?.name || profile?.displayName || user?.fullName || user?.displayName || '';
    const userEmail = profile?.email || user?.email || '';

    const self = {
      name: userName,
      phone: userPhone,
      email: userEmail,
      age: profile?.age || profile?.dateOfBirth || '',
      gender: profile?.gender || '',
      idType: profile?.idType || 'Aadhaar',
    };

    setContact((prev) => ({
      name: self.name || prev.name,
      phone: self.phone || prev.phone,
      email: self.email || prev.email,
    }));

    setAttendees((current) => [
      { ...(current[0] || makeAttendee(0)), ...self },
      ...current.slice(1),
    ]);

    const emerg = getBestEmergency(profile);
    if (emerg.name || emerg.phone) {
      setEmergency((prev) => ({
        name: emerg.name || prev.name,
        phone: emerg.phone || prev.phone,
      }));
    }

    const bikeData = getBestBikeDetails(profile, userBikes);
    if (bikeData.brand || bikeData.model || bikeData.registration) {
      setBike((prev) => ({
        brand: bikeData.brand || prev.brand,
        model: bikeData.model || prev.model,
        registration: formatVehicleNumber(bikeData.registration || prev.registration),
      }));
    }
  };

  // Auto-prefill contact details when user/profile is loaded
  useEffect(() => {
    if (!user && !profile) return;
    const userPhone = getBestUserPhone(profile, user);
    const userName = profile?.fullName || profile?.name || profile?.displayName || user?.fullName || user?.displayName || '';
    const userEmail = profile?.email || user?.email || '';

    setContact((prev) => ({
      name: prev.name || userName,
      phone: prev.phone || userPhone,
      email: prev.email || userEmail,
    }));

    const emerg = getBestEmergency(profile);
    if (emerg.name || emerg.phone) {
      setEmergency((prev) => ({
        name: prev.name || emerg.name,
        phone: prev.phone || emerg.phone,
      }));
    }
  }, [user, profile]);

  // Reactive sync when profile/user or bikes arrive asynchronously while bookingForSelf is checked
  useEffect(() => {
    if (!bookingForSelf || (!user && !profile)) return;

    const userPhone = getBestUserPhone(profile, user);
    const userName = profile?.fullName || profile?.name || profile?.displayName || user?.fullName || user?.displayName || '';
    const userEmail = profile?.email || user?.email || '';

    if (userPhone || userName || userEmail) {
      setContact((prev) => ({
        name: prev.name || userName,
        phone: prev.phone || userPhone,
        email: prev.email || userEmail,
      }));

      setAttendees((current) => {
        const first = current[0] || makeAttendee(0);
        return [
          {
            ...first,
            name: first.name || userName,
            phone: first.phone || userPhone,
            email: first.email || userEmail,
            age: first.age || profile?.age || profile?.dateOfBirth || '',
            gender: first.gender || profile?.gender || '',
            idType: first.idType || profile?.idType || 'Aadhaar',
          },
          ...current.slice(1),
        ];
      });
    }

    const emerg = getBestEmergency(profile);
    if (emerg.name || emerg.phone) {
      setEmergency((prev) => ({
        name: prev.name || emerg.name,
        phone: prev.phone || emerg.phone,
      }));
    }

    const bikeData = getBestBikeDetails(profile, userBikes);
    if (bikeData.brand || bikeData.model || bikeData.registration) {
      setBike((prev) => ({
        brand: prev.brand || bikeData.brand,
        model: prev.model || bikeData.model,
        registration: formatVehicleNumber(prev.registration || bikeData.registration),
        engineCC: prev.engineCC || bikeData.engineCC || '',
        requirementConfirmed: prev.requirementConfirmed || false,
      }));
    }
  }, [bookingForSelf, profile, user, userBikes]);

  const summary = useMemo(() => {
    const tierTotals = tiers.reduce((next, tier) => ({ ...next, [tier.key]: tier.price * counts[tier.key] }), {});
    const ticketTotal = Object.values(tierTotals).reduce((sum, value) => sum + value, 0);
    const addOnTotal = availableAddOns.filter((item) => selectedAddOns.includes(item.key)).reduce((sum, item) => sum + item.price, 0);
    const fees = 0;

    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.type === 'percentage' || appliedCoupon.discountType === 'percentage') {
        const val = Number(appliedCoupon.value || appliedCoupon.discount || 0);
        discount = Math.round(ticketTotal * (val / 100));
        if (appliedCoupon.max || appliedCoupon.maxDiscount) {
          discount = Math.min(Number(appliedCoupon.max || appliedCoupon.maxDiscount), discount);
        }
      } else {
        discount = Number(appliedCoupon.value || appliedCoupon.discount || appliedCoupon.amount || 0);
      }
    }

    return {
      tierTotals,
      ticketCount: totalTickets,
      ticketTotal,
      addOnTotal,
      fees,
      discount,
      total: Math.max(0, ticketTotal + addOnTotal + fees - discount),
    };
  }, [appliedCoupon, counts, selectedAddOns, tiers, totalTickets, availableAddOns]);

  if (loading) {
    return (
      <div className="eb-page">
        <div className="nx-empty-state nx-empty-state--light">
          <h3>Loading booking</h3>
          <p>Fetching event ticketing data from Firestore.</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="eb-page">
        <div className="nx-empty-state nx-empty-state--light">
          <h3>Event not available</h3>
          <p>This event is not published or could not be found in Firestore.</p>
          <button className="eb-btn eb-btn--primary" type="button" onClick={() => navigate('/events')}>Browse Events</button>
        </div>
      </div>
    );
  }

  const setCount = (key, value) => {
    setCounts((prev) => ({ ...prev, [key]: value }));
    const nextTotal = Object.entries({ ...counts, [key]: value }).reduce((sum, [, count]) => sum + Number(count || 0), 0);
    setAttendees((prev) => Array.from({ length: Math.max(1, nextTotal) }, (_, index) => prev[index] || makeAttendee(index)));
  };

  const updateAttendee = (index, field, value) => {
    setAttendees((prev) => {
      const next = [...prev];
      next[index] = { ...(next[index] || makeAttendee(index)), [field]: value };
      return next;
    });
  };

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    const eventCoupons = event?.coupons || [];
    const validCoupon = eventCoupons.find(c => String(c.code || c.couponCode).toUpperCase() === code);

    if (validCoupon) {
      if (validCoupon.available !== undefined && Number(validCoupon.available) <= 0) {
        setCouponError('This coupon is fully claimed.');
        return;
      }
      setAppliedCoupon(validCoupon);
      setCouponError('');
    } else if (code === 'NITROXX10') {
      setAppliedCoupon({ code: 'NITROXX10', type: 'percentage', value: 10, max: 1000 });
      setCouponError('');
    } else {
      setCouponError('Invalid or unavailable coupon code');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const toggleAddOn = (key) => {
    setSelectedAddOns((prev) => prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]);
  };

  const validateStep = () => {
    if (step === 1 && totalTickets < 1) return 'Select at least one ticket.';
    if (step === 2) {
      if (!contact.name || !contact.phone || !contact.email) return 'Add booking contact name, phone, and email.';
      if (!emergency.name && !emergency.phone) {
        return 'Please enter an emergency contact person or phone number.';
      }
      if (attendees.slice(0, totalTickets).some((item, index) => !item?.name || !item?.phone || (!item?.age && !(index === 0 && bookingForSelf)))) {
        return 'Each attendee needs name, phone, and age.';
      }
    }
    if (step === 3 && requiresVehicle && joinAs === 'biker') {
      if (!bike.brand || !bike.model || !bike.registration) {
        return 'Please enter your bike brand, model, and registration number.';
      }

      if (!isValidRegistrationNumber(bike.registration)) {
        return 'Please enter a valid motorcycle registration number (e.g. MP04XX1231).';
      }

      const bikeReq = resolveBikeRequirements(event);
      const hasReq = Boolean(bikeReq);

      if (hasReq) {
        if (!bike.eligibilityType && !bike.requirementConfirmed) {
          return `Please confirm your bike eligibility: tick "Yes, I have the required bike" or "I have an upper CC / higher model of bike".`;
        }

        const reqCC = parseInt(String(bikeReq.engineCC || 0).replace(/\D/g, ''), 10);
        const userCC = parseInt(
          String(bike.engineCC || (bike.model ? (bike.model.match(/\b\d{3,4}\b/) || [])[0] : '') || 0).replace(/\D/g, ''),
          10
        );

        if (bike.eligibilityType === 'exact' && reqCC > 0 && userCC > 0 && userCC < reqCC) {
          return `Your entered engine capacity (${userCC}cc) is lower than the required minimum of ${reqCC}cc. If your bike has higher specs, tick "I have an upper CC / higher model of bike".`;
        }
      }
    }
    if (step === 4 && !preferences.termsAccepted) {
      return 'Please accept the event terms and conditions.';
    }
    return '';
  };

  const next = async () => {
    const validation = validateStep();
    if (validation) {
      setError(validation);
      return;
    }
    setError('');
    if (step < STEPS.length) {
      setStep((current) => current + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!user) {
      openLogin();
      return;
    }

    const payablePaise = Math.round(Number(summary.total || 0) * 100);

    const executeBooking = async (paymentDetails = {}) => {
      setSubmitting(true);
      setIsGeneratingTicket(true);
      try {
        const attendeeTiers = [];
        tiers.forEach((tier) => {
          const count = Number(counts[tier.key] || 0);
          for (let i = 0; i < count; i++) {
            attendeeTiers.push(tier);
          }
        });

        const preparedAttendees = attendees.slice(0, totalTickets).map((item, idx) => {
          const tier = attendeeTiers[idx] || tiers[0] || {};
          const isPillionOrSpec = isPillionOrSpectatorTier(tier);
          const tierStr = `${tier.ticketFor || ''} ${tier.name || ''} ${tier.packageName || ''}`.toLowerCase();
          const autoJoinAs = isPillionOrSpec
            ? (tierStr.includes('spectator') || tierStr.includes('visitor') || tierStr.includes('audience') || tierStr.includes('guest') || tierStr.includes('fan') ? 'spectator' : 'pillion')
            : 'biker';

          return {
            ...item,
            joinAs: item.joinAs || (idx === 0 ? joinAs : autoJoinAs),
            ticketTier: tier.name || 'General Pass',
            ticketTierKey: tier.key || '',
          };
        });

        const bookingResult = await bookEvent({
          user,
          profile,
          event,
          attendeeCounts: {
            adults: totalTickets,
            children: 0,
            pets: 0,
            bags: 0,
          },
          attendees: preparedAttendees,
          bikeDetails: requiresVehicle && joinAs === 'biker' ? [{ ...bike, joinAs }] : [],
          joinAs,
          total: summary.total,
          addOns: availableAddOns.filter((item) => selectedAddOns.includes(item.key)),
          fees: { convenience: summary.fees, discount: summary.discount },
          bookingContact: contact,
          emergencyContact: emergency,
          preferences,
          payment: {
            ...payment,
            ...paymentDetails,
            method: paymentDetails.method || "Razorpay Online",
            status: "paid",
            amount: summary.total,
          },
          notes: preferences.notes,
        });
        const confirmedBookingId = bookingResult?.bookingId || `BKG-${Date.now().toString(36).toUpperCase()}`;
        const confirmedBookingDocId = bookingResult?.id || bookingResult?.bookingDocId || `bkg_${Date.now()}`;
        const confirmedTicketCode = bookingResult?.ticketCode || '';
        const confirmedQrPayload = bookingResult?.qrPayload || '';
        const confirmedSignature = bookingResult?.signature || '';

        // Cache confirmed booking into localStorage so JoinedEvents displays immediately
        try {
          const cached = JSON.parse(localStorage.getItem('nx_user_bookings') || '[]');
          const newBookingEntry = {
            id: confirmedBookingDocId,
            bookingId: confirmedBookingId,
            bookingRefId: confirmedBookingDocId,
            eventId: event?.id,
            title: event?.title || event?.name || 'Nitroxx Motorsports Event',
            eventTitle: event?.title || event?.name || 'Nitroxx Motorsports Event',
            date: event?.startDate || event?.date || new Date().toISOString(),
            startDate: event?.startDate || event?.date || new Date().toISOString(),
            dateText: event?.dateText || event?.dateTimeText || '',
            time: event?.time || '',
            location: event?.venue || event?.location || event?.city || 'Venue TBA',
            venue: event?.venue || event?.location || '',
            city: event?.city || '',
            banner: event?.image || event?.bannerImage || event?.banner || '',
            image: event?.image || event?.banner || '',
            hostName: event?.hostName || event?.organizerName || 'Nitroxx Community',
            total: summary.total,
            price: summary.total,
            totalTickets,
            ticketCode: confirmedTicketCode,
            qrPayload: confirmedQrPayload,
            signature: confirmedSignature,
            attendees: preparedAttendees,
            bike,
            status: 'confirmed',
            createdAt: new Date().toISOString(),
          };
          const filtered = cached.filter((b) => b.bookingId !== confirmedBookingId && b.id !== confirmedBookingDocId);
          localStorage.setItem('nx_user_bookings', JSON.stringify([newBookingEntry, ...filtered]));
        } catch (_) {}

        setSubmitting(false);
        setIsGeneratingTicket(false);
        setBookingConfirmation({
          bookingId: confirmedBookingId,
          bookingRefId: confirmedBookingDocId,
          ticketCode: confirmedTicketCode,
          qrPayload: confirmedQrPayload,
          signature: confirmedSignature,
          totalTickets,
          total: summary.total,
          event,
          attendees: preparedAttendees,
          attendee: contact,
          photoURL: profile?.profilePhoto || profile?.photoURL || user?.photoURL || user?.profilePhoto || '',
          bike,
        });
      } catch (err) {
        setError(err.message || 'Booking failed. Please try again.');
        setSubmitting(false);
        setIsGeneratingTicket(false);
      }
    };

    // Check if event is open for booking
    if (!statusInfo.canBook) {
      setError(`Cannot book tickets: ${statusInfo.message}`);
      return;
    }

    // Free event pass (total is 0)
    if (summary.total <= 0) {
      await executeBooking({
        method: "Free Pass",
        paymentId: `free_pass_${Date.now()}`,
        status: "paid",
      });
      return;
    }

    // Check if Razorpay SDK is available
    if (typeof window === "undefined" || !window.Razorpay) {
      setError("Payment gateway is loading. Please check your internet connection.");
      return;
    }

    // Launch Razorpay payment gateway on click of booking
    setSubmitting(true);
    setError("");

    try {
      const options = {
        key: "rzp_test_RvsB2MOcwdhZtz",
        amount: payablePaise,
        currency: "INR",
        name: "Nitroxxin Events",
        description: `Booking pass for ${event.title || "Motorcycle Event"}`,
        handler: async (response) => {
          await executeBooking({
            method: "Razorpay Online",
            paymentId: response.razorpay_payment_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
            status: "paid",
          });
        },
        prefill: {
          name: contact.name || profile?.fullName || user?.displayName || "Rider",
          email: contact.email || user?.email || "",
          contact: contact.phone || user?.phoneNumber || "",
        },
        theme: {
          color: "#ff2244",
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            console.log("Event booking payment modal dismissed");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setSubmitting(false);
        const errMsg = response.error?.description || "Payment failed. Please try again.";
        setError(errMsg);
        alert(`Payment failed: ${errMsg}`);
      });

      rzp.open();
    } catch (payInitErr) {
      setSubmitting(false);
      setError(payInitErr.message || "Could not launch payment gateway.");
    }
  };

  const previous = () => {
    setError('');
    if (step === 1) {
      const targetEventUrl =
        location.state?.fromPath ||
        (location.pathname.startsWith('/events/') ? `/events/${id}` : `/event/${id}`);

      if (location.state?.fromDetail && window.history.length > 1) {
        navigate(-1);
      } else {
        navigate(targetEventUrl, { replace: true, state: { fromBooking: true } });
      }
    } else {
      setStep((current) => current - 1);
    }
  };

  const renderStep = () => {
    if (step === 1) return <TicketStep counts={counts} setCount={setCount} tiers={tiers} seatsLeft={seatsLeft} />;
    if (step === 2) {
      return (
        <AttendeesStep
          totalTickets={totalTickets}
          attendees={attendees}
          updateAttendee={updateAttendee}
          contact={contact}
          setContact={setContact}
          emergency={emergency}
          setEmergency={setEmergency}
          bookingForSelf={bookingForSelf}
          onBookingForSelf={handleBookingForSelf}
          user={user}
        />
      );
    }
    if (step === 3) {
      return (
        <RideSetupStep
          event={event}
          joinAs={joinAs}
          setJoinAs={setJoinAs}
          bike={bike}
          setBike={setBike}
          preferences={preferences}
          setPreferences={setPreferences}
          selectedTiers={selectedTiers}
          userBikes={userBikes}
          requiresVehicle={requiresVehicle}
        />
      );
    }
    if (step === 4) {
      return (
        <AddOnsStep
          selectedAddOns={selectedAddOns}
          toggleAddOn={toggleAddOn}
          preferences={preferences}
          setPreferences={setPreferences}
          availableAddOns={availableAddOns}
        />
      );
    }
    return (
      <PaymentStep
        event={event}
        summary={summary}
        contact={contact}
        setContact={setContact}
        emergency={emergency}
        setEmergency={setEmergency}
        profile={profile}
        user={user}
        tiers={tiers}
        counts={counts}
        selectedAddOns={selectedAddOns}
        availableAddOns={availableAddOns}
        couponInput={couponInput}
        setCouponInput={setCouponInput}
        appliedCoupon={appliedCoupon}
        applyCoupon={applyCoupon}
        removeCoupon={removeCoupon}
        couponError={couponError}
        setStep={setStep}
        onPay={next}
        submitting={submitting}
      />
    );
  };

  if (!loading && event && !statusInfo.canBook) {
    return (
      <div className="eb-page">
        <BookingHeader event={event} seatsLeft={seatsLeft} onBack={previous} />
        <div className="eb-shell" style={{ display: 'flex', justifyContent: 'center', padding: '40px 16px' }}>
          <div className="eb-blocked-card">
            <div className={`eb-blocked-badge ${statusInfo.badgeClass}`}>
              <span className="ed-status-tag-dot" />
              {statusInfo.badgeText}
            </div>
            <h2 className="eb-blocked-title">
              {statusInfo.isCompleted ? "This Event is Completed" : "Registration Not Available"}
            </h2>
            <p className="eb-blocked-desc">{statusInfo.message}</p>
            <div style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="ed-book-btn"
                onClick={previous}
              >
                Back to Event
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`eb-page ${step === currentSteps.length ? 'eb-page--payment' : ''}`}>
      {step === currentSteps.length ? (
        <div className="eb-pay-top-bar">
          <button
            type="button"
            className="eb-pay-back-pill"
            onClick={previous}
            aria-label="Go back to previous step"
          >
            <FaArrowLeft style={{ fontSize: '12px' }} />
            <span>Back</span>
          </button>
        </div>
      ) : (
        <BookingHeader
          event={event}
          seatsLeft={seatsLeft}
          onBack={previous}
          step={step}
          setStep={setStep}
          steps={currentSteps}
        />
      )}
      <div className="eb-shell">
        <div className={`eb-content ${step === currentSteps.length ? 'eb-content--full' : ''}`}>
          <main>
            {/* {step === 1 && <CategoryBookingBrief event={event} />} */}
            {renderStep()}
            {error && <p className="eb-error">{error}</p>}
          </main>
          {step < currentSteps.length && (
            <BookingSummary
              event={event}
              summary={summary}
              counts={counts}
              selectedAddOns={selectedAddOns}
              currentStep={step}
              availableAddOns={availableAddOns}
              onBack={previous}
              onNext={next}
              submitting={submitting}
              totalSteps={currentSteps.length}
            />
          )}
        </div>
      </div>

      {/* ── Fixed Bottom Bar with Order Summary Tab & Action Buttons ── */}
      {step < currentSteps.length ? (
        <div className="eb-fixed-bottom-bar">
          <div
            className="eb-fixed-bar__summary-tab"
            onClick={() => setShowOrderBreakdown((prev) => !prev)}
            role="button"
            tabIndex={0}
            aria-label="Toggle order breakdown"
          >
            <div className="eb-fixed-bar__summary-text">
              <strong className="eb-fixed-bar__price">{formatMoney(summary.total)}</strong>
              <span className="eb-fixed-bar__sub">
                {summary.ticketCount} {summary.ticketCount === 1 ? 'ticket' : 'tickets'} • {showOrderBreakdown ? 'Hide details ▾' : 'View details ▴'}
              </span>
            </div>
          </div>

          <div className="eb-fixed-bar__actions">
            <button
              type="button"
              className="eb-fixed-bar__btn eb-fixed-bar__btn--back"
              onClick={previous}
              aria-label="Go back"
            >
              <FaArrowLeft style={{ fontSize: '12px', color: 'white' }} />
            </button>

            <button
              type="button"
              className="eb-fixed-bar__btn eb-fixed-bar__btn--continue"
              onClick={next}
              disabled={submitting || (step === 1 && summary.ticketCount === 0)}
              aria-label="Continue booking"
            >
              <span>
                {submitting
                  ? 'Creating booking...'
                  : 'Continue'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="eb-pay-mobile-fixed-bar eb-pay-mobile-only">
          <button
            type="button"
            className="eb-pay-cta-btn"
            onClick={next}
            disabled={submitting}
            aria-label="Pay now"
          >
            <div className="eb-pay-cta-btn__total">
              <strong>{formatMoney(summary.total)}</strong>
              <span>TOTAL</span>
            </div>
            <div className="eb-pay-cta-btn__label">
              {submitting ? 'Processing...' : 'Pay Now'}
            </div>
          </button>
        </div>
      )}

      {/* ── Slide-up Order Breakdown Sheet ── */}
      {showOrderBreakdown && (
        <div className="eb-breakdown-overlay" onClick={() => setShowOrderBreakdown(false)}>
          <div className="eb-breakdown-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="eb-breakdown-sheet__header">
              <div>
                <p className="eb-kicker" style={{ margin: 0 }}>Order Summary</p>
                <h4>{event.title}</h4>
              </div>
              <button
                type="button"
                className="eb-breakdown-sheet__close"
                onClick={() => setShowOrderBreakdown(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="eb-breakdown-sheet__body">
              <div className="eb-summary__meta" style={{ paddingBottom: '12px' }}>
                <span><FaCalendarAlt />{event.dateTimeText || event.dateText}</span>
                <span><FaMapMarkerAlt />{event.location}</span>
              </div>

              <div className="eb-summary__rows">
                {Object.entries(counts).filter(([, value]) => value > 0).map(([key, value]) => (
                  <div key={key}>
                    <span>{key} × {value}</span>
                    <strong>{formatMoney(summary.tierTotals[key] || 0)}</strong>
                  </div>
                ))}
                {availableAddOns.filter((item) => selectedAddOns.includes(item.key)).map((item) => (
                  <div key={item.key}>
                    <span>{item.title}</span>
                    <strong>{formatMoney(item.price)}</strong>
                  </div>
                ))}
                {summary.discount > 0 && (
                  <div style={{ color: '#0a8f5a' }}>
                    <span>Coupon discount</span>
                    <strong>-{formatMoney(summary.discount)}</strong>
                  </div>
                )}
                {summary.fees > 0 && (
                  <div>
                    <span>Convenience / Taxes</span>
                    <strong>{formatMoney(summary.fees)}</strong>
                  </div>
                )}
              </div>

              <div className="eb-summary__total" style={{ marginTop: '16px', paddingTop: '14px' }}>
                <span>Total Amount</span>
                <strong>{formatMoney(summary.total)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {isGeneratingTicket && (
        <div className="eb-ticket-generating-overlay" role="dialog" aria-modal="true">
          <div className="eb-ticket-generating-card">
            <div className="eb-ticket-generating-spinner-wrap">
              <div className="eb-ticket-generating-ring" />
              <div className="eb-ticket-generating-icon">
                <FaTicketAlt />
              </div>
            </div>
            <h3>Securing Your Official Pass...</h3>
            <p>Minting single-use cryptographic QR code and registering entry with Nitroxx Gateways.</p>
            <div className="eb-ticket-generating-steps">
              <div className="eb-generating-step done">✓ Payment verified</div>
              <div className="eb-generating-step active">⏳ Generating single-use cryptographic token</div>
              <div className="eb-generating-step">○ Registering pass with Gate Scanner</div>
            </div>
          </div>
        </div>
      )}

      {bookingConfirmation && (
        <TicketSuccessModal
          booking={bookingConfirmation}
          event={event}
          onClose={() => {
            setBookingConfirmation(null);
            try {
              sessionStorage.setItem('nx_last_site_path', `/events/${id}`);
              sessionStorage.setItem('nx_booked_event_id', String(id));
            } catch (e) { }
            navigate('/profile/joined-events', { replace: true, state: { fromBooking: true } });
          }}
          onNavigateProfile={() => {
            setBookingConfirmation(null);
            try {
              sessionStorage.setItem('nx_last_site_path', `/events/${id}`);
              sessionStorage.setItem('nx_booked_event_id', String(id));
            } catch (e) { }
            navigate('/profile/joined-events', { replace: true, state: { fromBooking: true } });
          }}
        />
      )}
    </div>
  );
}
