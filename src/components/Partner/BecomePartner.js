import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './BecomePartner.css';
import { useAuth } from '../../context/AuthContext';
import { submitPartnerQuery } from '../../services/queryService';

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
    title: 'As an Event Host / Organizer',
    sublabel: 'Host rides, track days & rallies',
    badge: 'Event Host & Organizer',
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

// Number of events per month options for Event Host / Organizer
const EVENT_FREQUENCY_OPTIONS = [
  '1 - 2 events / month',
  '3 - 5 events / month',
  '6 - 10 events / month',
  '10+ events / month',
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

// Helper to detect platform and return corresponding SVG icon
function getSocialIcon(url = '') {
  const lower = (url || '').toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#ff0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  if (lower.includes('tiktok.com')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#00f2fe">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.88 2.89 2.89 0 0 1-2.89-2.88 2.89 2.89 0 0 1 2.89-2.88c.36 0 .7.06 1.01.18V9.43a6.34 6.34 0 0 0-1.01-.08A6.34 6.34 0 0 0 3 15.69a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.82 1.56V6.85a4.85 4.85 0 0 1-.91-.16z" />
      </svg>
    );
  }
  if (lower.includes('instagram.com')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e1306c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  }
  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#ffffff">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  if (lower.includes('facebook.com')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877f2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  if (lower.includes('twitch.tv')) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="#9146ff">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export default function BecomePartner({ theme = 'dark', className = '' }) {
  const { user } = useAuth() || {};
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(PARTNER_OPTIONS[0]);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Form state matching reference image fields (for Brand & Organizer)
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

  // Creator Affiliate Program form state
  const [creatorData, setCreatorData] = useState({
    name: '',
    instagramUsername: '',
    socialLinks: [''],
    viralVideoLink: '',
    shortDescription: '',
  });

  // Event Host / Organizer form state
  const [organizerData, setOrganizerData] = useState({
    companyName: '',
    legalName: '',
    phone: '',
    email: '',
    streetAddress: '',
    city: '',
    state: '',
    country: '',
    eventsPerMonth: '1 - 2 events / month',
    socialLinks: [''],
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
    setSubmitError(null);
    setIsFormOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'briefDescription' && value.length > 500) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreatorChange = (e) => {
    const { name, value } = e.target;
    if (name === 'shortDescription' && value.length > 500) return;
    setCreatorData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialLinkChange = (index, value) => {
    setCreatorData((prev) => {
      const nextLinks = [...prev.socialLinks];
      nextLinks[index] = value;
      return { ...prev, socialLinks: nextLinks };
    });
  };

  const handleAddSocialLink = () => {
    if (creatorData.socialLinks.length >= 8) return;
    setCreatorData((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, ''],
    }));
  };

  const handleRemoveSocialLink = (index) => {
    setCreatorData((prev) => {
      const nextLinks = prev.socialLinks.filter((_, i) => i !== index);
      return {
        ...prev,
        socialLinks: nextLinks.length > 0 ? nextLinks : [''],
      };
    });
  };

  // Organizer change handlers
  const handleOrganizerChange = (e) => {
    const { name, value } = e.target;
    setOrganizerData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOrganizerSocialChange = (index, value) => {
    setOrganizerData((prev) => {
      const nextLinks = [...prev.socialLinks];
      nextLinks[index] = value;
      return { ...prev, socialLinks: nextLinks };
    });
  };

  const handleAddOrganizerSocial = () => {
    if (organizerData.socialLinks.length >= 8) return;
    setOrganizerData((prev) => ({
      ...prev,
      socialLinks: [...prev.socialLinks, ''],
    }));
  };

  const handleRemoveOrganizerSocial = (index) => {
    setOrganizerData((prev) => {
      const nextLinks = prev.socialLinks.filter((_, i) => i !== index);
      return {
        ...prev,
        socialLinks: nextLinks.length > 0 ? nextLinks : [''],
      };
    });
  };

  const handleSaveAndClose = () => {
    if (selectedOption.id === 'creator') {
      console.log('Creator draft saved:', {
        type: selectedOption.id,
        ...creatorData,
      });
    } else if (selectedOption.id === 'organizer') {
      console.log('Event Host draft saved:', {
        type: selectedOption.id,
        ...organizerData,
      });
    } else {
      console.log('Partner draft saved:', {
        type: selectedOption.id,
        ...formData,
      });
    }
    setIsFormOpen(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let queryPayload = {};

      if (selectedOption.id === 'creator') {
        // Affiliate Program (Creator)
        const activeSocials = (creatorData.socialLinks || [])
          .map((s) => s.trim())
          .filter(Boolean);

        queryPayload = {
          type: 'affiliate',
          role: 'affiliate',
          partnerType: 'creator',
          partnerTitle: selectedOption.title,
          badge: selectedOption.badge,
          name: (creatorData.name || '').trim(),
          instagramUsername: (creatorData.instagramUsername || '').trim(),
          socialLinks: activeSocials,
          viralVideoLink: (creatorData.viralVideoLink || '').trim(),
          shortDescription: (creatorData.shortDescription || '').trim(),
          userId: user?.uid || null,
          userEmail: user?.email || null,
          userName: (creatorData.name || '').trim() || user?.displayName || null,
          userPhone: user?.phoneNumber || null,
          details: {
            name: (creatorData.name || '').trim(),
            instagramUsername: (creatorData.instagramUsername || '').trim(),
            socialLinks: activeSocials,
            viralVideoLink: (creatorData.viralVideoLink || '').trim(),
            shortDescription: (creatorData.shortDescription || '').trim(),
          },
        };
      } else if (selectedOption.id === 'organizer') {
        // Event Host / Organizer
        const activeSocials = (organizerData.socialLinks || [])
          .map((s) => s.trim())
          .filter(Boolean);

        queryPayload = {
          type: 'host',
          role: 'host',
          partnerType: 'organizer',
          partnerTitle: selectedOption.title,
          badge: selectedOption.badge,
          companyName: (organizerData.companyName || '').trim(),
          legalName: (organizerData.legalName || '').trim(),
          phone: (organizerData.phone || '').trim(),
          email: (organizerData.email || '').trim(),
          streetAddress: (organizerData.streetAddress || '').trim(),
          city: (organizerData.city || '').trim(),
          state: (organizerData.state || '').trim(),
          country: organizerData.country || '',
          eventsPerMonth: organizerData.eventsPerMonth || '',
          socialLinks: activeSocials,
          userId: user?.uid || null,
          userEmail: (organizerData.email || '').trim() || user?.email || null,
          userName: (organizerData.legalName || '').trim() || (organizerData.companyName || '').trim() || user?.displayName || null,
          userPhone: (organizerData.phone || '').trim() || user?.phoneNumber || null,
          details: {
            companyName: (organizerData.companyName || '').trim(),
            legalName: (organizerData.legalName || '').trim(),
            phone: (organizerData.phone || '').trim(),
            email: (organizerData.email || '').trim(),
            streetAddress: (organizerData.streetAddress || '').trim(),
            city: (organizerData.city || '').trim(),
            state: (organizerData.state || '').trim(),
            country: organizerData.country || '',
            eventsPerMonth: organizerData.eventsPerMonth || '',
            socialLinks: activeSocials,
          },
        };
      } else {
        // Brand Partner
        queryPayload = {
          type: 'brand',
          role: 'brand',
          partnerType: 'brand',
          partnerTitle: selectedOption.title,
          badge: selectedOption.badge,
          legalBusinessName: (formData.legalBusinessName || '').trim(),
          businessWebsite: (formData.businessWebsite || '').trim(),
          industry: formData.industry || '',
          employeeCount: formData.employeeCount || '',
          primaryCountry: formData.primaryCountry || '',
          companyRegNumber: (formData.companyRegNumber || '').trim(),
          annualRevenueRange: formData.annualRevenueRange || '',
          briefDescription: (formData.briefDescription || '').trim(),
          userId: user?.uid || null,
          userEmail: user?.email || null,
          userName: (formData.legalBusinessName || '').trim() || user?.displayName || null,
          userPhone: user?.phoneNumber || null,
          details: {
            legalBusinessName: (formData.legalBusinessName || '').trim(),
            businessWebsite: (formData.businessWebsite || '').trim(),
            industry: formData.industry || '',
            employeeCount: formData.employeeCount || '',
            primaryCountry: formData.primaryCountry || '',
            companyRegNumber: (formData.companyRegNumber || '').trim(),
            annualRevenueRange: formData.annualRevenueRange || '',
            briefDescription: (formData.briefDescription || '').trim(),
          },
        };
      }

      await submitPartnerQuery(queryPayload);
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting application into query collection:', err);
      setSubmitError('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
                  <div className="bp-modal-title-group">
                    <p className="bp-modal-title">{selectedOption.title}</p>
                    <span className="bp-modal-track-badge">
                      <span className="bp-modal-track-dot" />
                      {selectedOption.badge}
                    </span>
                  </div>

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
                {submitError && (
                  <div className="bp-form-error-banner">{submitError}</div>
                )}
                {!submitted ? (
                  selectedOption.id === 'creator' ? (
                    /* ── CREATOR AFFILIATE PROGRAM FORM ── */
                    <form className="bp-form-content" onSubmit={handleFormSubmit}>
                      {/* Creator Perks Strip */}
                      {selectedOption.highlights && (
                        <div className="bp-creator-perks-strip">
                          {selectedOption.highlights.map((h, i) => (
                            <div key={i} className="bp-creator-perk-item">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff2d20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Row 1: Full Name & Instagram Username */}
                      <div className="bp-field-row-2">
                        {/* Field 1: Name */}
                        <div className="bp-field-group">
                          <label htmlFor="bp-creator-name" className="bp-field-label">
                            Name <span className="bp-required-star">*</span>
                          </label>
                          <input
                            id="bp-creator-name"
                            type="text"
                            name="name"
                            className="bp-field-input"
                            required
                            placeholder="e.g. Alex Rivera"
                            value={creatorData.name}
                            onChange={handleCreatorChange}
                          />
                        </div>

                        {/* Field 2: Instagram Username (Social Media) */}
                        <div className="bp-field-group">
                          <label htmlFor="bp-creator-instagram" className="bp-field-label">
                            Instagram Username <span className="bp-field-subtag">(Social Media)</span> <span className="bp-required-star">*</span>
                          </label>
                          <div className="bp-input-prefix-wrap">
                            <span className="bp-input-prefix">@</span>
                            <input
                              id="bp-creator-instagram"
                              type="text"
                              name="instagramUsername"
                              className="bp-field-input bp-field-input--prefixed"
                              required
                              placeholder="username"
                              value={creatorData.instagramUsername}
                              onChange={(e) => {
                                const cleanVal = e.target.value.replace(/^@+/, '');
                                setCreatorData((prev) => ({ ...prev, instagramUsername: cleanVal }));
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Field 3: Social Media Profile URLs (Multiple) */}
                      <div className="bp-field-group">
                        <div className="bp-label-with-hint">
                          <label className="bp-field-label">
                            Social Media Profile URLs <span className="bp-field-subtag">(Multiple)</span>
                          </label>
                          <span className="bp-field-hint">YouTube, TikTok, X, Twitch, etc.</span>
                        </div>

                        <div className="bp-social-links-list">
                          {creatorData.socialLinks.map((url, idx) => (
                            <div key={idx} className="bp-social-link-row">
                              <div className="bp-social-link-input-wrap">
                                <span className="bp-social-platform-icon" title="Detected platform">
                                  {getSocialIcon(url)}
                                </span>
                                <input
                                  type="url"
                                  className="bp-field-input bp-social-input"
                                  placeholder={idx === 0 ? "https://youtube.com/@channel or tiktok.com/@user" : "https://..."}
                                  value={url}
                                  onChange={(e) => handleSocialLinkChange(idx, e.target.value)}
                                />
                              </div>
                              {creatorData.socialLinks.length > 1 && (
                                <button
                                  type="button"
                                  className="bp-remove-social-btn"
                                  onClick={() => handleRemoveSocialLink(idx)}
                                  title="Remove profile link"
                                  aria-label="Remove profile link"
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {creatorData.socialLinks.length < 8 && (
                          <button
                            type="button"
                            className="bp-add-social-btn"
                            onClick={handleAddSocialLink}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span>Add another profile URL</span>
                          </button>
                        )}
                      </div>

                      {/* Field 4: Viral Video Link */}
                      <div className="bp-field-group">
                        <div className="bp-label-with-hint">
                          <label htmlFor="bp-creator-viral" className="bp-field-label">
                            Viral Video Link
                          </label>
                          <span className="bp-field-hint">Best-performing Reel, Short, or Video</span>
                        </div>
                        <div className="bp-input-with-icon">
                          <span className="bp-input-icon">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          </span>
                          <input
                            id="bp-creator-viral"
                            type="url"
                            name="viralVideoLink"
                            className="bp-field-input bp-field-input--with-icon"
                            placeholder="https://instagram.com/reel/... or https://youtube.com/shorts/..."
                            value={creatorData.viralVideoLink}
                            onChange={handleCreatorChange}
                          />
                        </div>
                      </div>

                      {/* Field 5: Short Description */}
                      <div className="bp-field-group">
                        <div className="bp-label-with-hint">
                          <label htmlFor="bp-creator-desc" className="bp-field-label">
                            Short Description <span className="bp-required-star">*</span>
                          </label>
                          <span className="bp-field-hint">Content style, audience & motorcycle niche</span>
                        </div>
                        <div className="bp-textarea-wrapper">
                          <textarea
                            id="bp-creator-desc"
                            name="shortDescription"
                            className="bp-field-textarea"
                            rows="4"
                            maxLength={500}
                            required
                            placeholder="Tell us about your content, motorcycle build/riding style, current audience reach, and how you want to collaborate with Nitroxx..."
                            value={creatorData.shortDescription}
                            onChange={handleCreatorChange}
                          />
                          <span className="bp-char-counter">
                            {creatorData.shortDescription.length} / 500
                          </span>
                        </div>
                      </div>

                      {/* Bottom Action Row */}
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
                          <button
                            type="submit"
                            className="bp-btn-next"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Submitting...' : 'Submit Application \u203a'}
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : selectedOption.id === 'organizer' ? (
                    /* ── EVENT HOST / ORGANIZER FORM ── */
                    <form className="bp-form-content" onSubmit={handleFormSubmit}>
                      {/* Organizer Perks Strip */}
                      {selectedOption.highlights && (
                        <div className="bp-creator-perks-strip">
                          {selectedOption.highlights.map((h, i) => (
                            <div key={i} className="bp-creator-perk-item">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff2d20" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Row 1: Company Name & Legal Name */}
                      <div className="bp-field-row-2">
                        <div className="bp-field-group">
                          <label htmlFor="bp-org-company" className="bp-field-label">
                            Company Name <span className="bp-required-star">*</span>
                          </label>
                          <input
                            id="bp-org-company"
                            type="text"
                            name="companyName"
                            className="bp-field-input"
                            required
                            placeholder="e.g. Apex Moto Club"
                            value={organizerData.companyName}
                            onChange={handleOrganizerChange}
                          />
                        </div>

                        <div className="bp-field-group">
                          <label htmlFor="bp-org-legal" className="bp-field-label">
                            Legal Name <span className="bp-required-star">*</span>
                          </label>
                          <input
                            id="bp-org-legal"
                            type="text"
                            name="legalName"
                            className="bp-field-input"
                            required
                            placeholder="e.g. Apex Motorsports Pvt. Ltd."
                            value={organizerData.legalName}
                            onChange={handleOrganizerChange}
                          />
                        </div>
                      </div>

                      {/* Row 2: Phone Number & Email */}
                      <div className="bp-field-row-2">
                        <div className="bp-field-group">
                          <label htmlFor="bp-org-phone" className="bp-field-label">
                            Phone Number <span className="bp-required-star">*</span>
                          </label>
                          <div className="bp-input-with-icon">
                            <span className="bp-input-icon">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                              </svg>
                            </span>
                            <input
                              id="bp-org-phone"
                              type="tel"
                              name="phone"
                              className="bp-field-input bp-field-input--with-icon"
                              required
                              placeholder="+91 98765 43210 or +1 (555) 019-2834"
                              value={organizerData.phone}
                              onChange={handleOrganizerChange}
                            />
                          </div>
                        </div>

                        <div className="bp-field-group">
                          <label htmlFor="bp-org-email" className="bp-field-label">
                            Email <span className="bp-required-star">*</span>
                          </label>
                          <div className="bp-input-with-icon">
                            <span className="bp-input-icon">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="4" width="20" height="16" rx="2" />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                              </svg>
                            </span>
                            <input
                              id="bp-org-email"
                              type="email"
                              name="email"
                              className="bp-field-input bp-field-input--with-icon"
                              required
                              placeholder="contact@apexmoto.com"
                              value={organizerData.email}
                              onChange={handleOrganizerChange}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Address Line (Headquarters / Venue) */}
                      <div className="bp-field-group">
                        <div className="bp-label-with-hint">
                          <label htmlFor="bp-org-street" className="bp-field-label">
                            Address <span className="bp-field-subtag">(Headquarters / Venue)</span>
                          </label>
                          <span className="bp-field-hint">Street or registered building (optional)</span>
                        </div>
                        <input
                          id="bp-org-street"
                          type="text"
                          name="streetAddress"
                          className="bp-field-input"
                          placeholder="e.g. 104 Circuit Drive, Sector 5"
                          value={organizerData.streetAddress}
                          onChange={handleOrganizerChange}
                        />
                      </div>

                      {/* Address: City, State, Country/County */}
                      <div className="bp-field-row-3">
                        <div className="bp-field-group">
                          <label htmlFor="bp-org-city" className="bp-field-label">
                            City <span className="bp-required-star">*</span>
                          </label>
                          <input
                            id="bp-org-city"
                            type="text"
                            name="city"
                            className="bp-field-input"
                            required
                            placeholder="e.g. Austin"
                            value={organizerData.city}
                            onChange={handleOrganizerChange}
                          />
                        </div>

                        <div className="bp-field-group">
                          <label htmlFor="bp-org-state" className="bp-field-label">
                            State <span className="bp-required-star">*</span>
                          </label>
                          <input
                            id="bp-org-state"
                            type="text"
                            name="state"
                            className="bp-field-input"
                            required
                            placeholder="e.g. Texas"
                            value={organizerData.state}
                            onChange={handleOrganizerChange}
                          />
                        </div>

                        <div className="bp-field-group">
                          <label htmlFor="bp-org-country" className="bp-field-label">
                            Country / County <span className="bp-required-star">*</span>
                          </label>
                          <input
                            id="bp-org-country"
                            type="text"
                            name="country"
                            list="bp-country-suggestions"
                            className="bp-field-input"
                            required
                            placeholder="e.g. USA / Travis County"
                            value={organizerData.country}
                            onChange={handleOrganizerChange}
                          />
                          <datalist id="bp-country-suggestions">
                            <option value="India" />
                            <option value="USA" />
                            <option value="United Kingdom" />
                            <option value="Germany" />
                            <option value="Italy" />
                            <option value="Japan" />
                            <option value="Australia" />
                            <option value="UAE" />
                            <option value="Canada" />
                          </datalist>
                        </div>
                      </div>

                      {/* No. of Events per Month */}
                      <div className="bp-field-group">
                        <div className="bp-label-with-hint">
                          <label htmlFor="bp-org-events-month" className="bp-field-label">
                            No. of Events per Month <span className="bp-required-star">*</span>
                          </label>
                          <span className="bp-field-hint">Average monthly rides & track meets</span>
                        </div>
                        <div className="bp-select-wrapper">
                          <select
                            id="bp-org-events-month"
                            name="eventsPerMonth"
                            className="bp-field-select"
                            value={organizerData.eventsPerMonth}
                            onChange={handleOrganizerChange}
                            required
                          >
                            {EVENT_FREQUENCY_OPTIONS.map((freq, idx) => (
                              <option key={idx} value={freq}>{freq}</option>
                            ))}
                          </select>
                          <svg className="bp-select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </div>
                      </div>

                      {/* Social Media Links (Multiple) */}
                      <div className="bp-field-group">
                        <div className="bp-label-with-hint">
                          <label className="bp-field-label">
                            Social Media Links <span className="bp-field-subtag">(Multiple)</span>
                          </label>
                          <span className="bp-field-hint">Instagram, Facebook, YouTube, X, etc.</span>
                        </div>

                        <div className="bp-social-links-list">
                          {organizerData.socialLinks.map((url, idx) => (
                            <div key={idx} className="bp-social-link-row">
                              <div className="bp-social-link-input-wrap">
                                <span className="bp-social-platform-icon" title="Detected platform">
                                  {getSocialIcon(url)}
                                </span>
                                <input
                                  type="url"
                                  className="bp-field-input bp-social-input"
                                  placeholder={idx === 0 ? "https://instagram.com/apexmoto or https://facebook.com/..." : "https://..."}
                                  value={url}
                                  onChange={(e) => handleOrganizerSocialChange(idx, e.target.value)}
                                />
                              </div>
                              {organizerData.socialLinks.length > 1 && (
                                <button
                                  type="button"
                                  className="bp-remove-social-btn"
                                  onClick={() => handleRemoveOrganizerSocial(idx)}
                                  title="Remove profile link"
                                  aria-label="Remove profile link"
                                >
                                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>

                        {organizerData.socialLinks.length < 8 && (
                          <button
                            type="button"
                            className="bp-add-social-btn"
                            onClick={handleAddOrganizerSocial}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span>Add another social profile URL</span>
                          </button>
                        )}
                      </div>

                      {/* Bottom Action Row */}
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
                          <button
                            type="submit"
                            className="bp-btn-next"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Submitting...' : 'Submit Application \u203a'}
                          </button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    /* ── BRAND BUSINESS PARTNER FORM ── */
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
                          <button
                            type="submit"
                            className="bp-btn-next"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? 'Submitting...' : 'Submit Application \u203a'}
                          </button>
                        </div>
                      </div>
                    </form>
                  )
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

                    {selectedOption.id === 'creator' ? (
                      <div className="bp-success-details">
                        <div><span>Name:</span> {creatorData.name || 'N/A'}</div>
                        <div><span>Instagram:</span> {creatorData.instagramUsername ? `@${creatorData.instagramUsername}` : 'N/A'}</div>
                        <div><span>Track:</span> {selectedOption.badge}</div>
                        <div><span>Social Profiles:</span> {creatorData.socialLinks.filter(l => l.trim().length > 0).length || 0} linked</div>
                        {creatorData.viralVideoLink && (
                          <div style={{ wordBreak: 'break-all' }}><span>Viral Video:</span> {creatorData.viralVideoLink}</div>
                        )}
                      </div>
                    ) : selectedOption.id === 'organizer' ? (
                      <div className="bp-success-details">
                        <div><span>Company:</span> {organizerData.companyName || 'N/A'}</div>
                        <div><span>Legal Name:</span> {organizerData.legalName || 'N/A'}</div>
                        <div><span>Contact:</span> {organizerData.email} • {organizerData.phone}</div>
                        <div><span>Location:</span> {[organizerData.city, organizerData.state, organizerData.country].filter(Boolean).join(', ') || 'N/A'}</div>
                        <div><span>Events / Month:</span> {organizerData.eventsPerMonth || 'N/A'}</div>
                        <div><span>Social Profiles:</span> {organizerData.socialLinks.filter(l => l.trim().length > 0).length || 0} linked</div>
                      </div>
                    ) : (
                      <div className="bp-success-details">
                        <div><span>Company:</span> {formData.legalBusinessName || 'N/A'}</div>
                        <div><span>Website:</span> {formData.businessWebsite || 'N/A'}</div>
                        <div><span>Track:</span> {selectedOption.badge}</div>
                        <div><span>Country:</span> {formData.primaryCountry}</div>
                      </div>
                    )}

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
