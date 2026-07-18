import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { useDocument } from '../../../hooks/useFirestore';
import { COLLECTIONS } from '../../../services/firebase';
import { normalizeEvent } from '../../../services/normalizers';
import { useEventsContext } from '../../../context/EventsContext';
import { bookEvent } from '../../../services/commerceService';
import { useAuth } from '../../../context/AuthContext';
import { useAuthModal } from '../../../components/AuthModal/useAuthModal';
import { formatCategoryValue, getCategoryDetails } from '../eventCategoryConfig';

const STEPS = [
  { id: 1, label: 'Tickets', icon: FaTicketAlt },
  { id: 2, label: 'Riders', icon: FaUserFriends },
  { id: 3, label: 'Ride setup', icon: FaMotorcycle },
  { id: 4, label: 'Add-ons', icon: FaShieldAlt },
  { id: 5, label: 'Pay', icon: FaCreditCard },
];

const JOIN_OPTIONS = [
  { key: 'biker', title: 'Biker', text: 'I am riding my motorcycle to the event.' },
  { key: 'pillion', title: 'Pillion', text: 'I need to be paired with an approved rider.' },
  // { key: 'group', title: 'Group ride', text: 'I am booking for a riding crew.' },
];

const ADD_ONS = [
  { key: 'helmet', title: 'Helmet on rent', price: 250, text: 'Sanitized full-face helmet at the venue.' },
  { key: 'jacket', title: 'Riding jacket', price: 450, text: 'Armored jacket rental for the event window.' },
  { key: 'meal', title: 'Meal pass', price: 399, text: 'Dinner, hydration refill, and energy bar.' },
  { key: 'insurance', title: 'Ride protection', price: 199, text: 'Basic accidental assistance and priority support.' },
];

const makeAttendee = (index = 0) => ({
  name: index === 0 ? '' : '',
  phone: '',
  email: '',
  age: '',
  gender: '',
  idType: 'Aadhaar',
  idLast4: '',
});

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
  if (!config) return null;
  return <section className="eb-category-brief">
    <div><p className="eb-kicker">Before you book</p><h3>{config.category} details</h3></div>
    {details.length ? <div className="eb-category-brief__grid">{details.map((field) =>
      <div key={field.id}><span>{field.label}</span><strong>{formatCategoryValue(field.value, field)}</strong></div>
    )}</div> : <p>The organizer will share category-specific instructions before the event.</p>}
  </section>;
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
                <Field label="ID last 4 digits">
                  <input value={attendee.idLast4} onChange={(e) => updateAttendee(index, 'idLast4', e.target.value)} placeholder="1234" />
                </Field>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function RideSetupStep({ joinAs, setJoinAs, bike, setBike, preferences, setPreferences }) {
  return (
    <section className="eb-panel">
      <div className="eb-panel__head">
        <p className="eb-kicker">Ride setup</p>
        <h2>Tell us how you are joining</h2>
        <span>This helps Nitroxx plan parking, marshals, and rider grouping.</span>
      </div>
      <div className="eb-option-grid">
        {JOIN_OPTIONS.map((option) => (
          <button
            type="button"
            key={option.key}
            className={`eb-option${joinAs === option.key ? ' is-selected' : ''}`}
            onClick={() => setJoinAs(option.key)}
          >
            <FaMotorcycle />
            <strong>{option.title}</strong>
            <span>{option.text}</span>
          </button>
        ))}
      </div>
      <div className="eb-form-grid eb-form-grid--wide">
        <Field label="Bike brand">
          <input value={bike.brand} onChange={(e) => setBike({ ...bike, brand: e.target.value })} placeholder="Royal Enfield, BMW, KTM" />
        </Field>
        <Field label="Model">
          <input value={bike.model} onChange={(e) => setBike({ ...bike, model: e.target.value })} placeholder="Himalayan, GS 310, Duke" />
        </Field>
        <Field label="Registration number">
          <input value={bike.registration} onChange={(e) => setBike({ ...bike, registration: e.target.value.toUpperCase() })} placeholder="DL 01 XX 0000" />
        </Field>
        <Field label="Riding experience">
          <select value={preferences.experience} onChange={(e) => setPreferences({ ...preferences, experience: e.target.value })}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
            <option>Professional</option>
          </select>
        </Field>
        <Field label="Preferred pace">
          <select value={preferences.pace} onChange={(e) => setPreferences({ ...preferences, pace: e.target.value })}>
            <option>Relaxed</option>
            <option>Balanced</option>
            <option>Sport</option>
          </select>
        </Field>
        <Field label="Parking need">
          <select value={preferences.parking} onChange={(e) => setPreferences({ ...preferences, parking: e.target.value })}>
            <option>Bike parking</option>
            <option>Car parking</option>
            <option>No parking required</option>
          </select>
        </Field>
      </div>
      <Field label="Special request">
        <textarea value={preferences.notes} onChange={(e) => setPreferences({ ...preferences, notes: e.target.value })} placeholder="Accessibility needs, group name, medical note, arrival delay..." />
      </Field>
    </section>
  );
}

function AddOnsStep({ selectedAddOns, toggleAddOn, preferences, setPreferences }) {
  return (
    <section className="eb-panel">
      <div className="eb-panel__head">
        <p className="eb-kicker">Make it complete</p>
        <h2>Add-ons and required consents</h2>
        <span>Optional extras are charged per booking.</span>
      </div>
      <div className="eb-addons">
        {ADD_ONS.map((addOn) => (
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
        ))}
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

function PaymentStep({ payment, setPayment, coupon, setCoupon, summary, event }) {
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
              <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="NITROXX10" />
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
            <div><dt>Add-ons</dt><dd>{formatMoney(summary.addOnTotal)}</dd></div>
            <div><dt>Convenience</dt><dd>{formatMoney(summary.fees)}</dd></div>
            <div><dt>Discount</dt><dd>-{formatMoney(summary.discount)}</dd></div>
            <div className="eb-final-card__total"><dt>Amount payable</dt><dd>{formatMoney(summary.total)}</dd></div>
          </dl>
        </article>
      </div>
    </section>
  );
}

function BookingSummary({ event, summary, counts, selectedAddOns, currentStep }) {
  const selected = ADD_ONS.filter((item) => selectedAddOns.includes(item.key));
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

export default function EventBooking() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { events, eventsLoading } = useEventsContext();
  const eventFromContext = events.find((e) => e.id === id);

  const fallbackQuery = useDocument(COLLECTIONS.events, !eventFromContext && !eventsLoading ? id : null);

  const event = useMemo(() => eventFromContext || (fallbackQuery.data ? normalizeEvent(fallbackQuery.data) : null), [eventFromContext, fallbackQuery.data]);
  const loading = eventsLoading || (fallbackQuery.loading && !eventFromContext);

  const { user, profile } = useAuth();
  const { openLogin } = useAuthModal();

  const [step, setStep] = useState(1);
  const [counts, setCounts] = useState({});
  const [attendees, setAttendees] = useState([makeAttendee(0)]);
  const [contact, setContact] = useState({ name: '', phone: '', email: '' });
  const [emergency, setEmergency] = useState({ name: '', phone: '' });
  const [joinAs, setJoinAs] = useState('biker');
  const [bike, setBike] = useState({ brand: '', model: '', registration: '' });
  const [preferences, setPreferences] = useState({
    experience: 'Intermediate',
    pace: 'Balanced',
    parking: 'Bike parking',
    notes: '',
    helmetConfirmed: false,
    termsAccepted: false,
    whatsappUpdates: true,
  });
  const [selectedAddOns, setSelectedAddOns] = useState(['insurance']);
  const [payment, setPayment] = useState({ method: 'upi', reference: '' });
  const [coupon, setCoupon] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
      };
    });
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
    const self = {
      name: profile?.fullName || profile?.displayName || user?.displayName || '',
      phone: profile?.phone || user?.phoneNumber || '',
      email: profile?.email || user?.email || '',
      age: profile?.age || profile?.dateOfBirth || '',
      gender: profile?.gender || '',
      idType: profile?.idType || 'Aadhaar',
      idLast4: profile?.idLast4 || '',
    };
    setContact({ name: self.name, phone: self.phone, email: self.email });
    setAttendees((current) => [{ ...(current[0] || makeAttendee(0)), ...self }, ...current.slice(1)]);
  };

  const summary = useMemo(() => {
    const tierTotals = tiers.reduce((next, tier) => ({ ...next, [tier.key]: tier.price * counts[tier.key] }), {});
    const ticketTotal = Object.values(tierTotals).reduce((sum, value) => sum + value, 0);
    const addOnTotal = ADD_ONS.filter((item) => selectedAddOns.includes(item.key)).reduce((sum, item) => sum + item.price, 0);
    const fees = Math.round((ticketTotal + addOnTotal) * 0.025) + 49;
    const discount = coupon === 'NITROXX10' ? Math.min(1000, Math.round(ticketTotal * 0.1)) : 0;
    return {
      tierTotals,
      ticketCount: totalTickets,
      ticketTotal,
      addOnTotal,
      fees,
      discount,
      total: Math.max(0, ticketTotal + addOnTotal + fees - discount),
    };
  }, [coupon, counts, selectedAddOns, tiers, totalTickets]);

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
    if (step === 3 && joinAs !== 'pillion' && (!bike.brand || !bike.model || !bike.registration)) {
      return 'Add bike brand, model, and registration number.';
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
    setSubmitting(true);
    try {
      await bookEvent({
        user,
        profile,
        event,
        attendeeCounts: {
          adults: totalTickets,
          children: 0,
          pets: 0,
          bags: 0,
        },
        attendees: attendees.slice(0, totalTickets),
        bikeDetails: [{ ...bike, joinAs }],
        joinAs,
        total: summary.total,
        ticketPlan: { counts, tiers: tiers.map(({ key, name, price, availableSeats }) => ({ key, name, price, availableSeats })) },
        addOns: ADD_ONS.filter((item) => selectedAddOns.includes(item.key)),
        fees: { convenience: summary.fees, discount: summary.discount },
        bookingContact: contact,
        emergencyContact: emergency,
        preferences,
        payment,
        notes: preferences.notes,
      });
      navigate('/profile/events');
    } catch (err) {
      setError(err.message || 'Booking failed. Please try again.');
      setSubmitting(false);
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
          joinAs={joinAs}
          setJoinAs={setJoinAs}
          bike={bike}
          setBike={setBike}
          preferences={preferences}
          setPreferences={setPreferences}
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
        />
      );
    }
    return <PaymentStep payment={payment} setPayment={setPayment} coupon={coupon} setCoupon={setCoupon} summary={summary} event={event} />;
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
          />
        </div>
      </div>
    </div>
  );
}
