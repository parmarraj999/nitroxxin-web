import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaCheck,
  FaCreditCard,
  FaIdCard,
  FaMapMarkerAlt,
  FaMotorcycle,
  FaShieldAlt,
  FaTicketAlt,
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
import { formatCategoryValue, getCategoryDetails } from '../eventCategoryConfig';
import { getTicketQrUrl } from '../../../utils/ticketSecurity';

const STEPS = [
  { id: 1, label: 'Tickets', icon: FaTicketAlt },
  { id: 2, label: 'Riders', icon: FaUserFriends },
  { id: 3, label: 'Ride setup', icon: FaMotorcycle },
  { id: 4, label: 'Add-ons', icon: FaShieldAlt },
  { id: 5, label: 'Pay', icon: FaCreditCard },
];

// const JOIN_OPTIONS = [
//   { key: 'biker', title: 'Biker', text: 'I am riding my motorcycle to the event.' },
//   { key: 'pillion', title: 'Pillion', text: 'I need to be paired with an approved rider.' },
//   // { key: 'group', title: 'Group ride', text: 'I am booking for a riding crew.' },
// ];



/**
 * Validates motorcycle / vehicle registration number against Indian RTO standards:
 * - Standard state series: 2-letter State code + 1-2 digit RTO + optional 1-3 series letters + 1-4 digit number
 *   (e.g. MH 02 AB 1234, DL 01 1234, DL 1C A 1234, KA 05 MB 9876, HR 26 DQ 5551)
 * - Bharat (BH) series: 2-digit year + BH + 1-4 digit number + 1-2 letters
 *   (e.g. 22 BH 1234 AA)
 */
export const isValidRegistrationNumber = (reg) => {
  if (!reg || typeof reg !== 'string') return false;
  const clean = reg.replace(/[\s.-]/g, '').toUpperCase();
  const standardPattern = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{1,4}$/;
  const bhSeriesPattern = /^[0-9]{2}BH[0-9]{1,4}[A-Z]{1,2}$/;
  return (standardPattern.test(clean) || bhSeriesPattern.test(clean)) && clean.length >= 6 && clean.length <= 12;
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
    (typeof prof?.emergencyContact === 'string' && isNaN(Number(prof.emergencyContact)) ? prof.emergencyContact : '') ||
    '';
  const rawPhone =
    prof?.emergencyNumber ||
    prof?.emergencyPhone ||
    prof?.emergencyContactPhone ||
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
      registration:
        primary.regNumber ||
        primary.registration ||
        primary.registrationNumber ||
        primary.plateNumber ||
        '',
      engineCC: primary.cc || primary.engineCC || primary.capacity || '',
    };
  }

  return {
    brand: prof?.bikeBrand || prof?.motorcycleBrand || '',
    model: prof?.bikeModel || prof?.motorcycleModel || '',
    registration: prof?.bikeRegistration || prof?.regNumber || prof?.vehicleNumber || '',
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

const formatMoney = (amount) => `Rs. ${Math.round(Number(amount || 0)).toLocaleString('en-IN')}`;

function Field({ label, children }) {
  return (
    <label className="eb-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Counter({ value, min = 0, max = 20, onChange }) {
  return (
    <div className="eb-counter">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        -
      </button>
      <span>{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
        +
      </button>
    </div>
  );
}

function BookingHeader({ event, seatsLeft, onBack }) {
  return (
    <header className="eb-hero">
      <button className="eb-back" type="button" onClick={onBack} aria-label="Back to event">
        <FaArrowLeft />
      </button>
      {event.image ? <img className="eb-hero__image" src={event.image} alt={event.title} /> : null}
      <div className="eb-hero__shade" />
      <div className="eb-hero__content">
        <p className="eb-kicker">Nitroxx secure checkout</p>
        <h1>{event.title}</h1>
        <div className="eb-hero__meta">
          <span><FaCalendarAlt />{event.dateTimeText || event.dateText}</span>
          <span><FaMapMarkerAlt />{event.location}</span>
          <span><FaTicketAlt />{seatsLeft} seats left</span>
        </div>
      </div>
    </header>
  );
}

function Stepper({ step }) {
  return (
    <nav className="eb-stepper" aria-label="Booking progress">
      {STEPS.map(({ id, label, icon: Icon }) => (
        <div key={id} className={`eb-stepper__item${step === id ? ' is-active' : ''}${step > id ? ' is-done' : ''}`}>
          <span>{step > id ? <FaCheck /> : <Icon />}</span>
          <strong>{label}</strong>
        </div>
      ))}
    </nav>
  );
}

function TicketStep({ counts, setCount, tiers, seatsLeft }) {
  return (
    <section className="eb-panel">
      <div className="eb-panel__head">
        <p className="eb-kicker">Choose tickets</p>
        <h2>Select passes for your booking</h2>
        <span>{seatsLeft} seats available in this batch</span>
      </div>
      <div className="eb-ticket-list">
        {tiers.length ? tiers.map((tier) => (
          <article key={tier.key} className="eb-ticket">
            <div>
              <p className="eb-ticket__name">{tier.name}</p>
              <p className="eb-ticket__desc">{tier.description}</p>
              {tier.perks?.length > 0 && (
                <div className="eb-ticket__details-group">
                  <span className="eb-ticket__details-title">Includes:</span>
                  <div className="eb-ticket__chips" style={{ marginTop: '4px' }}>
                    {tier.perks.map((perk, i) => <span key={`inc-${i}`}>{perk}</span>)}
                  </div>
                </div>
              )}
              {tier.exclusions?.length > 0 && (
                <div className="eb-ticket__details-group">
                  <span className="eb-ticket__details-title">Excludes:</span>
                  <div className="eb-ticket__chips" style={{ marginTop: '4px' }}>
                    {tier.exclusions.map((exc, i) => <span key={`exc-${i}`} className="eb-chip--exc">{exc}</span>)}
                  </div>
                </div>
              )}
            </div>
            <div className="eb-ticket__action">
              <strong>{formatMoney(tier.price)}</strong>
              <Counter value={counts[tier.key] || 0} onChange={(value) => setCount(tier.key, value)} max={Math.min(seatsLeft, tier.availableSeats)} />
            </div>
          </article>
        )) : <div className="eb-no-packages"><strong>Tickets are not available yet</strong><span>The host has not published a ticket package for this event.</span></div>}
      </div>
    </section>
  );
}

function CategoryBookingBrief({ event }) {
  const { config, details } = getCategoryDetails(event);
  const bikeReq = resolveBikeRequirements(event);
  const hasBike = Boolean(bikeReq && (bikeReq.bikeType || bikeReq.brand || bikeReq.model || bikeReq.engineCC));

  if (!config && !hasBike) return null;

  return (
    <section className="eb-category-brief">
      <div>
        <p className="eb-kicker">Before you book</p>
        <h3>{config?.category || 'Ride'} requirements & details</h3>
      </div>
      <div className="eb-category-brief__grid">
        {hasBike && (
          <>
            {bikeReq.bikeType && <div><span>Bike Type</span><strong>{bikeReq.bikeType}</strong></div>}
            {bikeReq.brand && <div><span>Required Brand</span><strong>{bikeReq.brand}</strong></div>}
            {bikeReq.model && <div><span>Required Model</span><strong>{bikeReq.model}</strong></div>}
            {bikeReq.engineCC && (
              <div>
                <span>Minimum CC</span>
                <strong>{String(bikeReq.engineCC).toLowerCase().includes('cc') ? bikeReq.engineCC : `${bikeReq.engineCC} cc`}</strong>
              </div>
            )}
          </>
        )}
        {details.map((field) => {
          const isLongText = typeof field.value === 'string' && field.value.length > 60;
          return (
            <div key={field.id} className={isLongText ? 'eb-category-item--wide' : ''}>
              <span>{field.label}</span>
              <strong>{formatCategoryValue(field.value, field)}</strong>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AttendeesStep({ totalTickets, attendees, updateAttendee, contact, setContact, emergency, setEmergency, bookingForSelf, onBookingForSelf, user }) {
  return (
    <section className="eb-panel">
      <div className="eb-panel__head">
        <p className="eb-kicker">Rider information</p>
        <h2>Attendee and contact details</h2>
        <span>Names should match the ID shown at check-in.</span>
      </div>
      <label className="eb-self-booking">
        <input type="checkbox" checked={bookingForSelf} onChange={(event) => onBookingForSelf(event.target.checked)} />
        <span><strong>Booking for myself</strong><small>{user ? 'Use my saved profile for attendee 1 and booking contact.' : 'Sign in to use your saved profile details.'}</small></span>
      </label>
      <div className="eb-form-grid eb-form-grid--wide">
        <Field label="Booking contact name">
          <input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} placeholder="Full name" />
        </Field>
        <Field label="Booking contact phone">
          <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} placeholder="10 digit mobile" />
        </Field>
        <Field label="Email for tickets">
          <input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="you@example.com" />
        </Field>
        <Field label="Emergency contact">
          <input value={emergency.name} onChange={(e) => setEmergency({ ...emergency, name: e.target.value })} placeholder="Contact person" />
        </Field>
        <Field label="Emergency phone">
          <input value={emergency.phone} onChange={(e) => setEmergency({ ...emergency, phone: e.target.value })} placeholder="Emergency mobile" />
        </Field>
      </div>
      <div className="eb-attendee-stack">
        {Array.from({ length: totalTickets }, (_, index) => {
          const attendee = attendees[index] || makeAttendee(index);
          return (
            <article key={index} className="eb-attendee">
              <div className="eb-attendee__title">
                <FaIdCard />
                <strong>{index === 0 && bookingForSelf ? 'Attendee 1 — You' : `Attendee ${index + 1}`}</strong>
              </div>
              <div className="eb-form-grid">
                <Field label="Full name">
                  <input value={attendee.name} onChange={(e) => updateAttendee(index, 'name', e.target.value)} placeholder="Rider name" />
                </Field>
                <Field label="Phone">
                  <input value={attendee.phone} onChange={(e) => updateAttendee(index, 'phone', e.target.value)} placeholder="Mobile number" />
                </Field>
                <Field label="Email">
                  <input value={attendee.email} onChange={(e) => updateAttendee(index, 'email', e.target.value)} placeholder="Ticket email" />
                </Field>
                <Field label="Age">
                  <input value={attendee.age} onChange={(e) => updateAttendee(index, 'age', e.target.value)} placeholder="18+" />
                </Field>
                <Field label="Gender">
                  <select value={attendee.gender} onChange={(e) => updateAttendee(index, 'gender', e.target.value)}>
                    <option value="">Select</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Non-binary</option>
                    <option>Prefer not to say</option>
                  </select>
                </Field>
              </div>
            </article>
          );
        })}
      </div>
    </section>
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
}) {
  const bikeReq = resolveBikeRequirements(event);
  const hasRequirement = Boolean(bikeReq);

  const reqCC = bikeReq?.engineCC ? parseInt(String(bikeReq.engineCC).replace(/\D/g, ''), 10) : 0;
  const userCC = parseInt(
    String(bike.engineCC || (bike.model ? (bike.model.match(/\b\d{3,4}\b/) || [])[0] : '') || 0).replace(/\D/g, ''),
    10
  );
  const ccBelow = reqCC > 0 && userCC > 0 && userCC < reqCC;

  // derive joinAs from selected ticket types: default to biker unless ticket is explicitly pillion/passenger
  useEffect(() => {
    if (selectedTiers && selectedTiers.length > 0) {
      const isExplicitPillion = selectedTiers.every((tier) => {
        const type = (tier.ticketFor || tier.name || '').toLowerCase();
        return (type.includes('pillion') || type.includes('passenger') || type.includes('spectator')) &&
          !type.includes('rider') && !type.includes('driver') && !type.includes('biker');
      });
      setJoinAs(isExplicitPillion ? 'pillion' : 'biker');
    } else {
      setJoinAs('biker');
    }
  }, [selectedTiers, setJoinAs]);

  return (
    <section className="eb-panel">
      <div className="eb-panel__head">
        <div>
          <p className="eb-kicker">Ride setup</p>
          <h2>{joinAs === 'biker' ? 'Vehicle setup' : 'Rider preferences'}</h2>
        </div>
        <span>This helps Nitroxx plan marshals, ride safety, and rider grouping.</span>
      </div>

      {/* ── Case 1: Event has Bike Requirements ── */}
      {hasRequirement && joinAs === 'biker' && (
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

      {/* Garage Quick Select (if user has saved bikes) */}
      {joinAs === 'biker' && userBikes && userBikes.length > 0 && (
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
                      registration: bReg.toUpperCase(),
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

      {joinAs === 'biker' && (
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
          <Field label="Registration number">
            <input
              value={bike.registration}
              onChange={(e) => setBike({ ...bike, registration: e.target.value.toUpperCase() })}
              placeholder="e.g. MH 02 AB 1234"
            />
            {bike.registration && !isValidRegistrationNumber(bike.registration) && (
              <span style={{ color: '#f87171', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                Enter valid number plate (e.g. MH 02 AB 1234 or 22 BH 1234 AA)
              </span>
            )}
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

      {/* Special request */}

      {joinAs !== 'biker' && (
        <div className="eb-form-grid eb-form-grid--wide">
          <Field label="Riding experience (Optional)">
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
        <label>
          <input
            type="checkbox"
            checked={preferences.helmetConfirmed}
            onChange={(e) => setPreferences({ ...preferences, helmetConfirmed: e.target.checked })}
          />
          I confirm every rider will wear a certified helmet and follow marshal instructions.
        </label>
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
          Send ticket, route, and gate updates on WhatsApp.
        </label>
      </div>
    </section>
  );
}

function PaymentStep({ payment, setPayment, couponInput, setCouponInput, appliedCoupon, applyCoupon, removeCoupon, couponError, summary, event }) {
  return (
    <section className="eb-panel">
      <div className="eb-panel__head">
        <p className="eb-kicker">Payment</p>
        <h2>Review and pay securely</h2>
        <span>Secure payment details are stored with the booking for dashboard reconciliation.</span>
      </div>
      <div className="eb-payment-layout">
        <div className="eb-payment-methods">
          {[
            { key: 'upi', label: 'UPI', icon: FaWallet },
            { key: 'card', label: 'Card', icon: FaCreditCard },
            { key: 'wallet', label: 'Wallet', icon: FaWallet },
          ].map(({ key, label, icon: Icon }) => (
            <button
              type="button"
              key={key}
              className={`eb-pay-option${payment.method === key ? ' is-selected' : ''}`}
              onClick={() => setPayment({ ...payment, method: key })}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
          <div className="eb-form-grid">
            <Field label={payment.method === 'upi' ? 'UPI ID' : 'Payment reference'}>
              <input value={payment.reference} onChange={(e) => setPayment({ ...payment, reference: e.target.value })} placeholder="name@upi or card reference" />
            </Field>
            <Field label="Coupon code">
              {appliedCoupon ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, padding: '11px 13px', border: '1px solid #0a8f5a', borderRadius: '8px', background: '#e8f7ee', color: '#0a6f45', fontWeight: 'bold' }}>
                    {appliedCoupon.code} Applied
                  </div>
                  <button type="button" onClick={removeCoupon} className="eb-btn eb-btn--ghost" style={{ minWidth: 'auto', padding: '0 16px' }}>Remove</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input style={{ flex: 1, minHeight: '46px' }} value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="Enter code" />
                  <button type="button" onClick={applyCoupon} className="eb-btn eb-btn--primary" style={{ minWidth: 'auto', padding: '0 16px' }}>Apply</button>
                </div>
              )}
              {couponError && <span style={{ color: '#b42318', fontSize: '13px', marginTop: '4px' }}>{couponError}</span>}
            </Field>
          </div>
        </div>
        <article className="eb-final-card">
          {event.image ? <img src={event.image} alt={event.title} /> : null}
          <div>
            <strong>{event.title}</strong>
            <span>{event.dateTimeText || event.dateText}</span>
            <span>{event.location}</span>
          </div>
          <dl>
            <div><dt>Tickets</dt><dd>{summary.ticketCount}</dd></div>
            <div><dt>Ticket total</dt><dd>{formatMoney(summary.ticketTotal)}</dd></div>
            {summary.addOnTotal > 0 && <div><dt>Add-ons</dt><dd>{formatMoney(summary.addOnTotal)}</dd></div>}
            {summary.fees > 0 && <div><dt>Convenience</dt><dd>{formatMoney(summary.fees)}</dd></div>}
            {summary.discount > 0 && <div><dt>Discount</dt><dd>-{formatMoney(summary.discount)}</dd></div>}
            <div className="eb-final-card__total"><dt>Amount payable</dt><dd>{formatMoney(summary.total)}</dd></div>
          </dl>
        </article>
      </div>
    </section>
  );
}

function BookingSummary({ event, summary, counts, selectedAddOns, currentStep, availableAddOns }) {
  const selected = availableAddOns.filter((item) => selectedAddOns.includes(item.key));
  console.log(summary)
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
      <p className="eb-summary__hint">Step {currentStep} of {STEPS.length}</p>
    </aside>
  );
}

const formatTicketDate = (dateVal) => {
  if (!dateVal) return '--/--';
  try {
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    }
  } catch (e) {}
  const match = String(dateVal).match(/\b(\d{1,2})[/.-](\d{1,2})\b/);
  if (match) {
    return `${match[1].padStart(2, '0')}/${match[2].padStart(2, '0')}`;
  }
  return String(dateVal).slice(0, 5);
};

const formatTicketTime = (timeVal, dateTimeText) => {
  if (timeVal) {
    const str = String(timeVal).trim();
    if (/^\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?$/i.test(str)) {
      if (/am|pm/i.test(str)) return str.toUpperCase();
      const parts = str.split(':');
      let h = parseInt(parts[0], 10);
      const m = parts[1].padStart(2, '0');
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
    }
    return str;
  }
  if (dateTimeText) {
    const match = String(dateTimeText).match(/\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\b/i);
    if (match) return match[0].toUpperCase();
  }
  return '10:00 AM';
};

function NitroxxTicketsLogo({ className = '', style = {} }) {
  return (
    <div className={`nitroxx-tickets-brand-lockup ${className}`} style={style}>
      <div className="nitroxx-brand-title-row">
        <span className="nitroxx-brand-word">Nitro</span>
        <svg
          className="nitroxx-xx-vector"
          viewBox="0 0 64 28"
          width="56"
          height="24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Left X with gear/circle in center */}
          <path d="M4 3L26 25" stroke="#000000" strokeWidth="4.8" strokeLinecap="round" />
          <path d="M26 3L4 25" stroke="#000000" strokeWidth="4.8" strokeLinecap="round" />
          <circle cx="15" cy="14" r="5" fill="#ffffff" stroke="#000000" strokeWidth="2.4" />
          <circle cx="15" cy="14" r="1.8" fill="#000000" />
          {/* Right X overlapping */}
          <path d="M24 3L46 25" stroke="#000000" strokeWidth="4.8" strokeLinecap="round" />
          <path d="M46 3L24 25" stroke="#000000" strokeWidth="4.8" strokeLinecap="round" />
        </svg>
      </div>
      <span className="nitroxx-tickets-word">Tickets</span>
    </div>
  );
}

function TicketSuccessModal({
  booking,
  event,
  onClose,
  onNavigateProfile,
}) {
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(true);

  const title = event?.title || event?.name || 'Ride Pass';
  const location = event?.venue || event?.location || event?.city || 'Gateway of India, Colaba';

  // Format Date (e.g., "08/12")
  const dateFormatted = formatTicketDate(event?.startDate || event?.date || event?.dateText);

  // Format Time (e.g., "02:00 PM")
  const timeFormatted = formatTicketTime(event?.startTime || event?.time, event?.dateTimeText || event?.dateText);

  // Ticket Count (e.g., "x2")
  const qty = booking?.totalTickets || 1;

  // Background resolution: use ticketTemplateUrl from event data or fallback colorful pastel gradient
  const activeTemplateUrl =
    event?.ticketTemplateUrl ||
    booking?.ticketTemplateUrl ||
    event?.templateUrl ||
    event?.ticketTemplate?.url ||
    event?.ticketTemplate?.imageUrl ||
    '';

  const backgroundStyle = activeTemplateUrl
    ? {
        backgroundImage: `url(${activeTemplateUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : {
        background: 'linear-gradient(160deg, #b388ff 0%, #80d8ff 35%, #ff80ab 70%, #ffd180 100%)',
      };

  // Primary single-use ticketCode
  const ticketId =
    booking?.ticketCode ||
    booking?.ticketNumber ||
    (booking?.bookingId ? `NTX-${booking.bookingId}` : `NTX-${Date.now().toString(36).toUpperCase()}`);

  // Unique QR check-in payload
  const qrCheckInPayload =
    booking?.qrPayload ||
    JSON.stringify({
      ticketCode: ticketId,
      bookingId: booking?.bookingRefId || booking?.id || booking?.bookingId || '',
      eventId: event?.id || '',
      attendeeEmail: booking?.attendee?.email || '',
      signature: booking?.signature || '',
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

        {/* The Exact Vertical Ticket Pass matching reference image */}
        <div className="ticket-pass-outer-shell">
          <div className="vertical-image-ticket-card" style={backgroundStyle}>
            {/* TOP SCALLOP BITES (7 SEMICIRCLE CUTOUTS) */}
            <div className="ticket-scallops-bar top" aria-hidden="true">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className="scallop-cutout-bite" />
              ))}
            </div>

            {/* TOP SECTION (ABOVE DASHED LINE): NITROXX TICKETS LOGO */}
            <div className="ticket-top-stub-area">
              <NitroxxTicketsLogo />
            </div>

            {/* HORIZONTAL DASHED FOLD / TEAR LINE */}
            <div className="ticket-dashed-fold-divider" aria-hidden="true" />

            {/* MAIN TICKET BODY */}
            <div className="ticket-main-content-area">
              {/* EVENT TITLE */}
              <h1 className="ticket-bold-event-title">{title}</h1>

              {/* EVENT LOCATION / VENUE */}
              <div className="ticket-venue-location-text">{location}</div>

              {/* HORIZONTAL SOLID RULE */}
              <div className="ticket-solid-divider" />

              {/* 3-COLUMN METRICS: DATE | TIME | TICKETS */}
              <div className="ticket-metrics-three-cols">
                <div className="ticket-metric-col">
                  <span className="metric-label">Date</span>
                  <span className="metric-value">{dateFormatted}</span>
                </div>
                <div className="ticket-metric-col">
                  <span className="metric-label">Time</span>
                  <span className="metric-value">{timeFormatted}</span>
                </div>
                <div className="ticket-metric-col">
                  <span className="metric-label">Tickets</span>
                  <span className="metric-value">x{qty}</span>
                </div>
              </div>

              {/* HORIZONTAL SOLID RULE */}
              <div className="ticket-solid-divider" />

              {/* QR CODE SECTION WITH VERTICAL ROTATED TEXT */}
              <div className="ticket-qr-action-section">
                <div className="ticket-vertical-scan-text">
                  SCAN THIS QR WHEN ENTER
                </div>

                <div className="ticket-qr-frame">
                  {qrLoaded ? (
                    <div
                      className="ticket-qr-white-card"
                      style={{
                        background: '#ffffff',
                        padding: '12px',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                        minWidth: '240px',
                        minHeight: '240px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <img
                        src={qrUrl}
                        alt="Scan ticket pass QR code for check-in"
                        className="ticket-rendered-qr-img"
                        style={{
                          width: '216px',
                          height: '216px',
                          display: 'block',
                          imageRendering: 'pixelated',
                        }}
                        onError={() => setQrLoaded(false)}
                      />
                    </div>
                  ) : (
                    <div
                      className="ticket-qr-fallback-box"
                      style={{
                        background: '#ffffff',
                        padding: '24px 16px',
                        borderRadius: '12px',
                        minWidth: '240px',
                        minHeight: '240px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <FaTicketAlt size={48} color="#000000" />
                      <span className="ticket-pass-id-fallback" style={{ color: '#000000', fontWeight: '800' }}>
                        {ticketId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Fallback Single-Use Ticket Code for Manual Typing */}
              <div
                className="ticket-code-manual-fallback"
                style={{
                  marginTop: '12px',
                  padding: '8px 14px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                }}
              >
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>
                    Gate Code (Single-Use)
                  </span>
                  <strong style={{ fontFamily: 'monospace', fontSize: '15px', color: '#0f172a', letterSpacing: '0.8px' }}>
                    {ticketId}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={handleCopyId}
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* BOTTOM SCALLOP BITES (7 SEMICIRCLE CUTOUTS) */}
            <div className="ticket-scallops-bar bottom" aria-hidden="true">
              {Array.from({ length: 7 }).map((_, i) => (
                <span key={i} className="scallop-cutout-bite" />
              ))}
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

  const { user, profile } = useAuth();
  const { openLogin } = useAuthModal();

  const { data: userBikes } = useCollection(user?.uid ? `users/${user.uid}/bikes` : null);

  const [step, setStep] = useState(1);
  const [counts, setCounts] = useState({});
  const [attendees, setAttendees] = useState([makeAttendee(0)]);
  const [contact, setContact] = useState({ name: '', phone: '', email: '' });
  const [emergency, setEmergency] = useState({ name: '', phone: '' });
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
  const [bookingConfirmation, setBookingConfirmation] = useState(null);
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
        registration: (bikeData.registration || prev.registration).toUpperCase(),
      }));
    }
  };

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
        registration: (prev.registration || bikeData.registration).toUpperCase(),
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
      if (!emergency.name || !emergency.phone) return 'Add an emergency contact.';
      if (attendees.slice(0, totalTickets).some((item, index) => !item?.name || !item?.phone || (!item?.age && !(index === 0 && bookingForSelf)))) {
        return 'Each attendee needs name, phone, and age.';
      }
    }
    if (step === 3 && joinAs !== 'pillion') {
      if (!bike.brand || !bike.model || !bike.registration) {
        return 'Please enter your bike brand, model, and registration number.';
      }

      if (!isValidRegistrationNumber(bike.registration)) {
        return 'Please enter a valid motorcycle registration number (e.g. MH 02 AB 1234 or 22 BH 1234 AA).';
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
    if (step === 4 && (!preferences.helmetConfirmed || !preferences.termsAccepted)) {
      return 'Confirm helmet safety and accept event terms.';
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
          const tierType = (tier.ticketFor || tier.name || '').toLowerCase();
          const autoJoinAs = (tierType.includes('pillion') || tierType.includes('passenger'))
            ? 'pillion'
            : (tierType.includes('spectator') ? 'spectator' : 'biker');

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
          bikeDetails: [{ ...bike, joinAs }],
          joinAs,
          total: summary.total,
          ticketPlan: {
            counts,
            tiers: tiers.map(({ key, name, price, availableSeats }) => ({ key, name, price, availableSeats })),
          },
          addOns: availableAddOns.filter((item) => selectedAddOns.includes(item.key)),
          fees: { convenience: summary.fees, discount: summary.discount },
          bookingContact: contact,
          emergencyContact: emergency,
          preferences,
          payment: {
            ...payment,
            ...paymentDetails,
            method: paymentDetails.method || "Razorpay Online",
            paymentStatus: "paid",
            amount: summary.total,
          },
          notes: preferences.notes,
        });
        setSubmitting(false);
        setIsGeneratingTicket(false);
        setBookingConfirmation({
          bookingId: bookingResult?.bookingId || `BKG-${Date.now().toString(36).toUpperCase()}`,
          bookingRefId: bookingResult?.id || '',
          ticketCode: bookingResult?.ticketCode || '',
          qrPayload: bookingResult?.qrPayload || '',
          signature: bookingResult?.signature || '',
          totalTickets,
          total: summary.total,
          event,
          attendees: preparedAttendees,
          attendee: contact,
          userPhoto: profile?.profilePhoto || profile?.photoURL || user?.photoURL || user?.profilePhoto || '',
          bike,
        });
      } catch (err) {
        setError(err.message || 'Booking failed. Please try again.');
        setSubmitting(false);
        setIsGeneratingTicket(false);
      }
    };

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
          name: contact.name || profile?.fullName || user.displayName || "Rider",
          email: contact.email || user.email || "",
          contact: contact.phone || user.phoneNumber || "",
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
    if (step === 1) navigate(`/events/${id}`);
    else setStep((current) => current - 1);
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
          selectedTiers={tiers.filter((t) => counts[t.key] > 0)}
          userBikes={userBikes}
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
    return <PaymentStep payment={payment} setPayment={setPayment} couponInput={couponInput} setCouponInput={setCouponInput} appliedCoupon={appliedCoupon} applyCoupon={applyCoupon} removeCoupon={removeCoupon} couponError={couponError} summary={summary} event={event} />;
  };

  return (
    <div className="eb-page">
      <BookingHeader event={event} seatsLeft={seatsLeft} onBack={previous} />
      <div className="eb-shell">
        <Stepper step={step} />
        <div className="eb-content">
          <main>
            {step === 1 && <CategoryBookingBrief event={event} />}
            {renderStep()}
            {error && <p className="eb-error">{error}</p>}
            <div className="eb-actions">
              <button type="button" className="eb-btn eb-btn--ghost" onClick={previous}>
                Back
              </button>
              <button type="button" className="eb-btn eb-btn--primary" onClick={next} disabled={submitting}>
                {submitting ? 'Creating booking...' : step === STEPS.length ? `Pay ${formatMoney(summary.total)}` : 'Continue'}
              </button>
            </div>
          </main>
          <BookingSummary
            event={event}
            summary={summary}
            counts={counts}
            selectedAddOns={selectedAddOns}
            currentStep={step}
            availableAddOns={availableAddOns}
          />
        </div>
      </div>

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
            navigate('/profile/joined-events');
          }}
          onNavigateProfile={() => {
            setBookingConfirmation(null);
            navigate('/profile/joined-events');
          }}
        />
      )}
    </div>
  );
}
