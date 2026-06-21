import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './EventBooking.css';
import { useDocument } from '../../../hooks/useFirestore';
import { COLLECTIONS } from '../../../services/firebase';
import { normalizeEvent } from '../../../services/normalizers';
import { bookEvent } from '../../../services/commerceService';
import { useAuth } from '../../../context/AuthContext';
import { useAuthModal } from '../../../components/AuthModal/useAuthModal';

const TOTAL_STEPS = 5;

const EVENT_DATA = {
  title: 'Live Concert of Seedhe Maut',
  date: 'Sat, 23 May, 8:00 PM',
  location: 'Jawaharlal Nehru Stadium, New Delhi',
  price: 7500,
  image: 'https://i.pinimg.com/736x/f4/19/f9/f419f9ee2c94bf67c5ccb2985295db2f.jpg',
};

const ATTENDEE_TYPES = [
  { key: 'adults', label: 'Adults', sublabel: 'Age 15 or above', min: 1 },
  { key: 'children', label: 'Childrens', sublabel: 'Age 5 - 15', min: 0 },
  { key: 'pets', label: 'Pets', sublabel: 'Bigger than 5kg', min: 0 },
  { key: 'bags', label: 'Any Bag or Belongings', sublabel: 'How much luggage you have', min: 0 },
];

const JOIN_OPTIONS = [
  {
    key: 'biker',
    label: 'Biker',
    image: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
  },
  {
    key: 'pillion',
    label: 'Pillion',
    image: 'https://cdn-icons-png.flaticon.com/512/2920/2920277.png',
  },
];

function Counter({ value, onChange, min = 0 }) {
  return (
    <div className="eb-counter">
      <button
        type="button"
        className="eb-counter__btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease"
      >
        −
      </button>
      <span className="eb-counter__value">{value}</span>
      <button
        type="button"
        className="eb-counter__btn"
        onClick={() => onChange(value + 1)}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

function BookingHeader({ event }) {
  return (
    <header className="eb-header">
      <div className="eb-header__text">
        <h1 className="eb-header__title">{event.title}</h1>
        <p className="eb-header__meta">
          <span className="eb-header__date">{event.dateTimeText || event.date}</span>
          <span className="eb-header__sep">|</span>
          <span className="eb-header__location">{event.location}</span>
        </p>
      </div>
      <div className="eb-header__avatar" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
        </svg>
      </div>
    </header>
  );
}

function ProgressBar({ currentStep }) {
  return (
    <div className="eb-progress">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div
          key={i}
          className={`eb-progress__segment${i < currentStep ? ' eb-progress__segment--active' : ''}`}
        />
      ))}
    </div>
  );
}

function NavButtons({ onBack, onNext, nextLabel = 'Next', nextDisabled = false }) {
  return (
    <div className="eb-nav">
      <button type="button" className="eb-nav__btn eb-nav__btn--back" onClick={onBack}>
        Back
      </button>
      <button
        type="button"
        className="eb-nav__btn eb-nav__btn--next"
        onClick={onNext}
        disabled={nextDisabled}
      >
        {nextLabel}
      </button>
    </div>
  );
}

function StepAttendees({ counts, onChange }) {
  return (
    <div className="eb-step eb-step--attendees">
      <div className="eb-step__content">
        <div className="eb-attendee-list">
          {ATTENDEE_TYPES.map(({ key, label, sublabel, min }) => (
            <div key={key} className="eb-attendee-row">
              <div className="eb-attendee-row__info">
                <p className="eb-attendee-row__label">{label}</p>
                <p className="eb-attendee-row__sublabel">{sublabel}</p>
              </div>
              <Counter
                value={counts[key]}
                onChange={(val) => onChange(key, val)}
                min={min}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="eb-step__illustration">
        <img
          src="https://cdn-icons-png.flaticon.com/512/4143/4143600.png"
          alt=""
          className="eb-illustration"
        />
      </div>
    </div>
  );
}

function StepAdultDetails({ adults, details, onChange }) {
  return (
    <div className="eb-step eb-step--details">
      <div className="eb-step__content">
        <h2 className="eb-step__heading">{adults} Adults Details</h2>
        <div className="eb-person-forms">
          {Array.from({ length: adults }, (_, i) => (
            <div key={i} className="eb-person-form">
              <p className="eb-person-form__label">{i + 1} Person</p>
              <input
                type="text"
                className="eb-input"
                placeholder="Name"
                value={details[i]?.name || ''}
                onChange={(e) => onChange(i, 'name', e.target.value)}
              />
              <input
                type="tel"
                className="eb-input"
                placeholder="Contact Number"
                value={details[i]?.contact || ''}
                onChange={(e) => onChange(i, 'contact', e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="eb-step__illustration">
        <img
          src="https://cdn-icons-png.flaticon.com/512/4143/4143600.png"
          alt=""
          className="eb-illustration"
        />
      </div>
    </div>
  );
}

function StepJoinAs({ selected, onSelect }) {
  return (
    <div className="eb-step eb-step--join">
      <div className="eb-step__content eb-step__content--full">
        <h2 className="eb-step__heading">Join Event As A:</h2>
        <div className="eb-join-cards">
          {JOIN_OPTIONS.map(({ key, label, image }) => (
            <button
              key={key}
              type="button"
              className={`eb-join-card${selected === key ? ' eb-join-card--selected' : ''}`}
              onClick={() => onSelect(key)}
            >
              <img src={image} alt="" className="eb-join-card__img" />
              <span className="eb-join-card__label">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepBikeDetails({ adults, details, onChange }) {
  return (
    <div className="eb-step eb-step--details">
      <div className="eb-step__content">
        <h2 className="eb-step__heading">Bike Details</h2>
        <div className="eb-person-forms">
          {Array.from({ length: adults }, (_, i) => (
            <div key={i} className="eb-person-form">
              <p className="eb-person-form__label">{i + 1} Person</p>
              <input
                type="text"
                className="eb-input"
                placeholder="Name"
                value={details[i]?.name || ''}
                onChange={(e) => onChange(i, 'name', e.target.value)}
              />
              <input
                type="tel"
                className="eb-input"
                placeholder="Contact Number"
                value={details[i]?.contact || ''}
                onChange={(e) => onChange(i, 'contact', e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="eb-step__illustration">
        <img
          src="https://cdn-icons-png.flaticon.com/512/2972/2972185.png"
          alt=""
          className="eb-illustration eb-illustration--bike"
        />
      </div>
    </div>
  );
}

function StepPayment({ counts, joinAs, event }) {
  const basePrice = Number(event.price || EVENT_DATA.price || 0);
  const ticketTotal = counts.adults * basePrice;
  const childTotal = counts.children * (basePrice * 0.5);
  const petFee = counts.pets * 200;
  const bagFee = counts.bags * 100;
  const total = ticketTotal + childTotal + petFee + bagFee;

  return (
    <div className="eb-step eb-step--payment">
      <div className="eb-payment-grid">
        <div className="eb-payment-detail">
          <h2 className="eb-step__heading">Payment Detail</h2>
          <div className="eb-payment-card">
            <div className="eb-payment-card__event">
              <img src={event.image || EVENT_DATA.image} alt="" className="eb-payment-card__thumb" />
              <p className="eb-payment-card__title">{event.title}</p>
            </div>
            <div className="eb-payment-card__fields">
              <input type="text" className="eb-input" placeholder="Card Number" />
              <div className="eb-payment-card__row">
                <input type="text" className="eb-input" placeholder="MM / YY" />
                <input type="text" className="eb-input" placeholder="CVV" />
              </div>
              <input type="text" className="eb-input" placeholder="Name on Card" />
            </div>
          </div>
        </div>
        <div className="eb-summary">
          <h2 className="eb-step__heading">Summary</h2>
          <div className="eb-summary-card">
            <div className="eb-summary-row">
              <span>Adults × {counts.adults}</span>
              <span>₹{ticketTotal.toLocaleString('en-IN')}</span>
            </div>
            {counts.children > 0 && (
              <div className="eb-summary-row">
                <span>Children × {counts.children}</span>
                <span>₹{childTotal.toLocaleString('en-IN')}</span>
              </div>
            )}
            {counts.pets > 0 && (
              <div className="eb-summary-row">
                <span>Pets × {counts.pets}</span>
                <span>₹{petFee.toLocaleString('en-IN')}</span>
              </div>
            )}
            {counts.bags > 0 && (
              <div className="eb-summary-row">
                <span>Bags × {counts.bags}</span>
                <span>₹{bagFee.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="eb-summary-row">
              <span>Join as</span>
              <span className="eb-summary-capitalize">{joinAs}</span>
            </div>
            <div className="eb-summary-divider" />
            <div className="eb-summary-row eb-summary-row--total">
              <span>Total</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data } = useDocument(COLLECTIONS.events, id);
  const event = data ? normalizeEvent(data) : { id, ...EVENT_DATA, dateTimeText: EVENT_DATA.date };
  const { user, profile } = useAuth();
  const { openLogin } = useAuthModal();
  const [step, setStep] = useState(1);
  const [counts, setCounts] = useState({ adults: 2, children: 1, pets: 0, bags: 0 });
  const [adultDetails, setAdultDetails] = useState([]);
  const [bikeDetails, setBikeDetails] = useState([]);
  const [joinAs, setJoinAs] = useState('biker');

  const handleCountChange = (key, value) => {
    setCounts((prev) => ({ ...prev, [key]: value }));
  };

  const handleAdultDetailChange = (index, field, value) => {
    setAdultDetails((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleBikeDetailChange = (index, field, value) => {
    setBikeDetails((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const goBack = () => {
    if (step === 1) {
      navigate(`/events/${id}`);
    } else {
      setStep((s) => s - 1);
    }
  };

  const bookingTotal = () => {
    const basePrice = Number(event.price || EVENT_DATA.price || 0);
    return counts.adults * basePrice + counts.children * (basePrice * 0.5) + counts.pets * 200 + counts.bags * 100;
  };

  const goNext = async () => {
    if (step === TOTAL_STEPS) {
      if (!user) {
        openLogin();
        return;
      }
      await bookEvent({
        user,
        profile,
        event,
        attendeeCounts: counts,
        attendees: adultDetails,
        bikeDetails,
        joinAs,
        total: bookingTotal(),
      });
      navigate('/profile/events');
      return;
    }
    setStep((s) => s + 1);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <StepAttendees counts={counts} onChange={handleCountChange} />;
      case 2:
        return (
          <StepAdultDetails
            adults={counts.adults}
            details={adultDetails}
            onChange={handleAdultDetailChange}
          />
        );
      case 3:
        return <StepJoinAs selected={joinAs} onSelect={setJoinAs} />;
      case 4:
        return (
          <StepBikeDetails
            adults={counts.adults}
            details={bikeDetails}
            onChange={handleBikeDetailChange}
          />
        );
      case 5:
        return <StepPayment counts={counts} joinAs={joinAs} event={event} />;
      default:
        return null;
    }
  };

  return (
    <div className="eb-page">
      <div className="eb-inner">
        <BookingHeader event={event} />
        <div className="eb-divider" />
        <main className="eb-main">
          {renderStep()}
          <NavButtons
            onBack={goBack}
            onNext={goNext}
            nextLabel={step === TOTAL_STEPS ? 'Pay Now' : 'Next'}
          />
        </main>
        <div className="eb-progress-wrap">
          <ProgressBar currentStep={step} />
        </div>
      </div>
    </div>
  );
}
