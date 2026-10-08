import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './BecomePartner.css';

// ── 3 Partnership Options ──
export const PARTNER_OPTIONS = [
  {
    id: 'brand',
    title: 'As a Brand',
    sublabel: 'Sell gear, apparel & bike parts',
    badge: 'Brand & Retailer',
    shortDesc: 'Sell your gear, apparel, bike parts & accessories on Nitroxx Marketplace.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    highlights: ['Access thousands of verified riders', 'Dedicated brand storefront', 'Logistics & payment support'],
  },
  {
    id: 'organizer',
    title: 'As an Event Organizer',
    sublabel: 'Host rides, track days & rallies',
    badge: 'Rallies & Track Days',
    shortDesc: 'Host, list and manage motorcycle rides, rallies, track days & motorsport events.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    ),
    highlights: ['Ticketing & instant rider registrations', 'Live emergency & route tracking', 'Automated rider waivers & check-ins'],
  },
  {
    id: 'creator',
    title: 'Creator Affiliate Program',
    sublabel: 'Collaborate, monetize & earn',
    badge: 'Creators & Influencers',
    shortDesc: 'Partner with Nitroxx as a moto vlogger, racer, or influencer to earn & collaborate.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
      </svg>
    ),
    highlights: ['Competitive affiliate commissions', 'Free gear & sponsor collaboration', 'Official Nitroxx creator badge'],
  },
];

// Industry options for dropdown
const INDUSTRY_OPTIONS = [
  'Motorcycle Accessories & Gear',
  'Helmets & Rider Safety',
  'Performance Parts & Exhausts',
  'Events, Tours & Rallies',
  'Media, Content Creation & Influencer',
  'Automotive Electronics & Tech',
  'E-Commerce & Retail Distribution',
  'Other',
];

// Operating country options
const COUNTRY_OPTIONS = [
  { code: 'USA', label: 'USA', flag: '🇺🇸' },
  { code: 'India', label: 'India', flag: '🇮🇳' },
  { code: 'United Kingdom', label: 'United Kingdom', flag: '🇬🇧' },
  { code: 'Germany', label: 'Germany', flag: '🇩🇪' },
  { code: 'Italy', label: 'Italy', flag: '🇮🇹' },
  { code: 'Japan', label: 'Japan', flag: '🇯🇵' },
  { code: 'Australia', label: 'Australia', flag: '🇦🇺' },
  { code: 'UAE', label: 'UAE', flag: '🇦🇪' },
  { code: 'Other', label: 'Other', flag: '🌐' },
];

// Annual revenue range options
const REVENUE_RANGES = [
  'Pre-revenue / Early Stage',
  'Under $100K (< ₹80 Lakhs)',
  '$100K - $500K (₹80L - ₹4 Cr)',
  '$500K - $2M (₹4 Cr - ₹16 Cr)',
  '$2M - $10M (₹16 Cr - ₹80 Cr)',
  '$10M+ (₹80 Cr+)',
];

export default function BecomePartner({ theme = 'dark', className = '' }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(PARTNER_OPTIONS[0]);
  const [submitted, setSubmitted] = useState(false);

  // Form state matching reference image fields
  const [formData, setFormData] = useState({
    legalBusinessName: '',
    businessWebsite: '',
    industry: '',
    employeeCount: '',
    primaryCountry: 'USA',
    companyRegNumber: '',
    annualRevenueRange: '',
    briefDescription: '',
  });

  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        setIsFormOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when form modal is open
  useEffect(() => {
    if (isFormOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSubmitted(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFormOpen]);

  const handleSelectOption = (option) => {
    setSelectedOption(option);
    setIsDropdownOpen(false);
    setSubmitted(false);
    setIsFormOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'briefDescription' && value.length > 500) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAndClose = () => {
    console.log('Partner draft saved:', {
      type: selectedOption.id,
      ...formData,
    });
    setIsFormOpen(false);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    console.log('Partner application submitted:', {
      type: selectedOption.id,
      ...formData,
    });
    setSubmitted(true);
  };

  return (
    <div className={`bp-wrapper bp-wrapper--${theme} ${className}`} ref={dropdownRef}>
      {/* ── Trigger Button in Nav Bar ── */}
      <button
        type="button"
        className={`bp-trigger-btn bp-trigger-btn--${theme} ${isDropdownOpen ? 'is-active' : ''}`}
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isDropdownOpen}
      >
        <span className="bp-trigger-text">Become a Partner</span>
        <svg
          className={`bp-trigger-chevron ${isDropdownOpen ? 'is-open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* ── Dropdown Menu with 3 Options (Frosted Glass Dark UI) ── */}
      {isDropdownOpen && (
        <div className="bp-dropdown-menu">
          <div className="bp-options-list">
            {PARTNER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className="bp-option-item"
                onClick={() => handleSelectOption(option)}
              >
                <span className="bp-option-icon">
                  {option.icon}
                </span>
                <div className="bp-option-text">
                  <span className="bp-option-title">{option.title}</span>
                  {option.sublabel && (
                    <span className="bp-option-sublabel">{option.sublabel}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Application Form Modal (Rendered in document.body via Portal) ── */}
      {isFormOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="bp-modal-overlay" onClick={() => setIsFormOpen(false)}>
            <div
              className="bp-modal-dialog"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              {/* Modal Top Bar: Track Badge & Close */}
              <div className="bp-modal-header">
                <div className="bp-modal-header-top">
                  <p style={{ fontWeight: "600", fontSize: "20px" }}>{selectedOption.title}</p>

                  {/* 3-Option Quick Switcher inside Modal */}
                  {/* <div className="bp-tabs-switcher">
                    {PARTNER_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`bp-tab-btn ${selectedOption.id === opt.id ? 'is-active' : ''}`}
                        onClick={() => {
                          setSelectedOption(opt);
                          setSubmitted(false);
                        }}
                      >
                        {opt.title}
                      </button>
                    ))}
                  </div> */}

                  <button
                    type="button"
                    className="bp-modal-close-btn"
                    onClick={() => setIsFormOpen(false)}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="bp-modal-body">
                {!submitted ? (
                  <form className="bp-form-content" onSubmit={handleFormSubmit}>
                    {/* Field 1: Legal Business Name */}
                    <div className="bp-field-group">
                      <label htmlFor="bp-business-name" className="bp-field-label">
                        Legal Business Name
                      </label>
                      <input
                        id="bp-business-name"
                        type="text"
                        name="legalBusinessName"
                        className="bp-field-input"
                        required
                        placeholder="Acme Corp"
                        value={formData.legalBusinessName}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Field 2: Business Website */}
                    <div className="bp-field-group">
                      <label htmlFor="bp-website" className="bp-field-label">
                        Business Website
                      </label>
                      <input
                        id="bp-website"
                        type="text"
                        name="businessWebsite"
                        className="bp-field-input"
                        placeholder="acme.corp.org"
                        value={formData.businessWebsite}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Field 3: Industry (Dropdown) */}
                    <div className="bp-field-group">
                      <label htmlFor="bp-industry" className="bp-field-label">
                        Industry
                      </label>
                      <div className="bp-select-wrapper">
                        <select
                          id="bp-industry"
                          name="industry"
                          className="bp-field-select"
                          value={formData.industry}
                          onChange={handleFormChange}
                          required
                        >
                          <option value="" disabled>Select industry</option>
                          {INDUSTRY_OPTIONS.map((ind, i) => (
                            <option key={i} value={ind}>{ind}</option>
                          ))}
                        </select>
                        <svg className="bp-select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>
                    </div>

                    {/* Row 4 & 5: Employee Count & Primary Operating Country */}
                    <div className="bp-field-row-2">
                      <div className="bp-field-group">
                        <label htmlFor="bp-employees" className="bp-field-label">
                          Employee Count
                        </label>
                        <input
                          id="bp-employees"
                          type="number"
                          name="employeeCount"
                          className="bp-field-input bp-field-input--stepper"
                          min="1"
                          placeholder="34"
                          value={formData.employeeCount}
                          onChange={handleFormChange}
                        />
                      </div>

                      <div className="bp-field-group">
                        <label htmlFor="bp-country" className="bp-field-label">
                          Primary Operating Country
                        </label>
                        <div className="bp-select-wrapper">
                          <select
                            id="bp-country"
                            name="primaryCountry"
                            className="bp-field-select"
                            value={formData.primaryCountry}
                            onChange={handleFormChange}
                          >
                            {COUNTRY_OPTIONS.map((c) => (
                              <option key={c.code} value={c.label}>
                                {c.flag} {c.label}
                              </option>
                            ))}
                          </select>
                          <svg className="bp-select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Row 6 & 7: Company Registration Number & Annual Revenue Range */}
                    <div className="bp-field-row-2">
                      <div className="bp-field-group">
                        <label htmlFor="bp-reg-num" className="bp-field-label">
                          Company Registration Number
                        </label>
                        <input
                          id="bp-reg-num"
                          type="text"
                          name="companyRegNumber"
                          className="bp-field-input"
                          placeholder="12-3456789"
                          value={formData.companyRegNumber}
                          onChange={handleFormChange}
                        />
                      </div>

                      <div className="bp-field-group">
                        <label htmlFor="bp-revenue" className="bp-field-label">
                          Annual Revenue Range
                        </label>
                        <div className="bp-select-wrapper">
                          <select
                            id="bp-revenue"
                            name="annualRevenueRange"
                            className="bp-field-select"
                            value={formData.annualRevenueRange}
                            onChange={handleFormChange}
                          >
                            <option value="" disabled>Select Revenue Range</option>
                            {REVENUE_RANGES.map((rev, i) => (
                              <option key={i} value={rev}>{rev}</option>
                            ))}
                          </select>
                          <svg className="bp-select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Field 8: Brief Company Description with Character Counter */}
                    <div className="bp-field-group">
                      <label htmlFor="bp-desc" className="bp-field-label">
                        Brief Company Description
                      </label>
                      <div className="bp-textarea-wrapper">
                        <textarea
                          id="bp-desc"
                          name="briefDescription"
                          className="bp-field-textarea"
                          rows="4"
                          maxLength={500}
                          placeholder="We provide scalable cloud infrastructure for modern enterprise teams..."
                          value={formData.briefDescription}
                          onChange={handleFormChange}
                        />
                        <span className="bp-char-counter">
                          {formData.briefDescription.length} / 500
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Row Matching Reference Image */}
                    <div className="bp-bottom-action-bar">
                      <button
                        type="button"
                        className="bp-btn-save-close"
                        onClick={handleSaveAndClose}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                          <polyline points="17 21 17 13 7 13 7 21" />
                          <polyline points="7 3 7 8 15 8" />
                        </svg>
                        <span>Save and close</span>
                      </button>

                      <div className="bp-btn-right-group">
                        <button
                          type="button"
                          className="bp-btn-back"
                          onClick={() => {
                            setIsFormOpen(false);
                            setIsDropdownOpen(true);
                          }}
                        >
                          &lsaquo; Back
                        </button>
                        <button type="submit" className="bp-btn-next">
                          Next &rsaquo;
                        </button>
                      </div>
                    </div>
                  </form>
                ) : (
                  /* Success Confirmation */
                  <div className="bp-success-box">
                    <div className="bp-success-icon-wrap">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <h3 className="bp-success-title">Application Received!</h3>
                    <p className="bp-success-desc">
                      Thank you for applying to partner with Nitroxx{' '}
                      <strong>{selectedOption.title}</strong>. Our partnerships team will review your application and get in touch within 24–48 hours.
                    </p>
                    <div className="bp-success-details">
                      <div><span>Company:</span> {formData.legalBusinessName || 'N/A'}</div>
                      <div><span>Website:</span> {formData.businessWebsite || 'N/A'}</div>
                      <div><span>Track:</span> {selectedOption.badge}</div>
                      <div><span>Country:</span> {formData.primaryCountry}</div>
                    </div>
                    <button
                      type="button"
                      className="bp-btn-next bp-success-close-btn"
                      onClick={() => setIsFormOpen(false)}
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
