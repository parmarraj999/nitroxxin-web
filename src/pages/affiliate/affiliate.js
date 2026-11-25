import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import './affiliate.css';
import { useAuth } from '../../context/AuthContext';
import { submitPartnerQuery } from '../../services/queryService';
import { uploadPartnerScreenshot } from '../../services/storageService';

const HOW_IT_WORKS_STEPS = [
  {
    id: 'join',
    label: 'Join',
    icon: '/assets/images/icon-1.png',
    alt: 'Join the program',
  },
  {
    id: 'choose',
    label: 'Choose',
    icon: '/assets/images/icon-2.png',
    alt: 'Choose gear and events to promote',
  },
  {
    id: 'track',
    label: 'Track',
    icon: '/assets/images/icon-3.png',
    alt: 'Track clicks and referrals in real time',
  },
  {
    id: 'earn',
    label: 'Earn',
    icon: '/assets/images/icon-4.png',
    alt: 'Earn commissions on every successful sale',
  },
];

const BENEFIT_STATS = [
  {
    label: 'Events',
    value: '500+',
    description:
      'Promote curated rides, rallies, track days, and motorsport events hosted across top cities.',
  },
  {
    label: 'Products',
    value: '1200+',
    description:
      'Share authentic helmets, armored jackets, riding boots, and performance gear from trusted brands.',
  },
  {
    label: 'Commission',
    value: '4.5%',
    description:
      'Earn competitive 4.5% commission payouts directly on every verified booking and marketplace sale.',
  },
];

const CREATOR_PERKS = [
  'Competitive affiliate commissions',
  'Free gear & sponsor collaboration',
  'Official Nitroxx creator badge',
];

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

/* ── Notched Floating-Label Field (Matches Profile Detail Page) ── */
function NotchedField({
  label,
  required = false,
  subtag = null,
  prefix = null,
  icon = null,
  hint = null,
  error = null,
  isTextarea = false,
  className = '',
  children,
}) {
  return (
    <div className={`aff-notched-field-group ${className}`}>
      <label
        className={`aff-notched-field ${isTextarea ? 'aff-notched-field--textarea' : ''} ${
          error ? 'has-error' : ''
        }`}
      >
        {label && (
          <span className="aff-notched-field__label">
            <span>{label}</span>
            {subtag && <span className="aff-field-subtag">{subtag}</span>}
            {required && <span className="aff-required-star">*</span>}
          </span>
        )}
        <div className="aff-notched-field__control">
          {prefix && <span className="aff-notched-field__prefix">{prefix}</span>}
          {icon && <span className="aff-notched-field__icon">{icon}</span>}
          {children}
        </div>
      </label>
      {hint && <span className="aff-notched-field__hint">{hint}</span>}
      {error && <span className="aff-field-error">{error}</span>}
    </div>
  );
}

export default function Affiliate() {
  const navigate = useNavigate();
  const { user, profile } = useAuth() || {};

  const formSectionRef = useRef(null);
  const nameInputRef = useRef(null);
  const screenshotInputRef = useRef(null);
  const prefilledOnceRef = useRef(false);

  const [creatorData, setCreatorData] = useState({
    name: '',
    instagramUsername: '',
    socialLinks: [''],
    viralVideoLink: '',
    shortDescription: '',
  });

  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isDragOverScreenshot, setIsDragOverScreenshot] = useState(false);
  const [screenshotError, setScreenshotError] = useState(null);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = 'Join Our Affiliate Program - Nitroxx';
  }, []);

  // Pre-fill Full Name once when logged in profile data is available
  useEffect(() => {
    if (prefilledOnceRef.current) return;
    const savedName =
      profile?.fullName || profile?.name || profile?.displayName || user?.fullName || user?.displayName || '';
    if (savedName) {
      setCreatorData((prev) => ({
        ...prev,
        name: prev.name || savedName,
      }));
      prefilledOnceRef.current = true;
    }
  }, [profile, user]);

  // Close lightbox modal on Escape key
  useEffect(() => {
    if (!showScreenshotModal) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowScreenshotModal(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showScreenshotModal]);

  const scrollToForm = () => {
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        nameInputRef.current?.focus({ preventScroll: true });
      }, 450);
    }
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

  const handleScreenshotSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setScreenshotError('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setScreenshotError('Screenshot size exceeds 15MB. Please choose a smaller image.');
      return;
    }

    setScreenshotError(null);
    setScreenshotFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleScreenshotInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleScreenshotSelect(file);
  };

  const handleRemoveScreenshot = (e) => {
    if (e) e.stopPropagation();
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setScreenshotError(null);
    if (screenshotInputRef.current) {
      screenshotInputRef.current.value = '';
    }
  };

  const handleScreenshotDrop = (e) => {
    e.preventDefault();
    setIsDragOverScreenshot(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleScreenshotSelect(file);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let uploadedScreenshotUrl = null;
      if (screenshotFile) {
        try {
          uploadedScreenshotUrl = await uploadPartnerScreenshot(user?.uid || 'guest', screenshotFile);
        } catch (uploadErr) {
          console.warn('Firebase Storage screenshot upload failed, using data URL fallback:', uploadErr);
          uploadedScreenshotUrl = screenshotPreview;
        }
      }

      const activeSocials = (creatorData.socialLinks || [])
        .map((s) => s.trim())
        .filter(Boolean);

      const cleanName = (creatorData.name || '').trim();
      const cleanInstagram = (creatorData.instagramUsername || '').trim();
      const cleanViral = (creatorData.viralVideoLink || '').trim();
      const cleanDesc = (creatorData.shortDescription || '').trim();

      const queryPayload = {
        type: 'affiliate',
        role: 'affiliate',
        partnerType: 'creator',
        partnerTitle: 'Creator Affiliate Program',
        badge: 'Creators & Influencers',
        name: cleanName,
        instagramUsername: cleanInstagram,
        instagramDashboardScreenshot: uploadedScreenshotUrl || null,
        socialLinks: activeSocials,
        viralVideoLink: cleanViral,
        shortDescription: cleanDesc,
        userId: user?.uid || null,
        userEmail: profile?.email || user?.email || null,
        userName: cleanName || profile?.fullName || user?.displayName || null,
        userPhone: profile?.phone || user?.phone || user?.phoneNumber || null,
        details: {
          name: cleanName,
          instagramUsername: cleanInstagram,
          instagramDashboardScreenshot: uploadedScreenshotUrl || null,
          screenshotFileName: screenshotFile?.name || null,
          socialLinks: activeSocials,
          viralVideoLink: cleanViral,
          shortDescription: cleanDesc,
        },
      };

      await submitPartnerQuery(queryPayload);
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting affiliate application:', err);
      setSubmitError('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmitted(false);
    setSubmitError(null);
    setCreatorData({
      name: '',
      instagramUsername: '',
      socialLinks: [''],
      viralVideoLink: '',
      shortDescription: '',
    });
    handleRemoveScreenshot();
  };

  return (
    <div className="aff-page">
      <div className="aff-container">
        {/* ═══ 1. HERO SECTION ═══ */}
        <section className="aff-hero">
          <h1 className="aff-hero-title">Join Our Affiliate Program</h1>

          <div className="aff-hero-banner-wrap">
            <img
              src="/assets/images/affiliate-banner.png"
              alt="Nitroxx Affiliate Creators Showcase"
              className="aff-hero-banner-img"
              decoding="async"
            />
          </div>

          <button
            type="button"
            className="aff-hero-cta-btn"
            onClick={scrollToForm}
          >
            Join For Free
          </button>
        </section>

        {/* ═══ 2. HOW IT WORKS SECTION ═══ */}
        <section className="aff-how-section">
          <span className="aff-eyebrow">How It Works</span>

          <div className="aff-steps-grid">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div key={step.id} className="aff-step-card">
                <div className="aff-step-icon-box">
                  <img
                    src={step.icon}
                    alt={step.alt}
                    className="aff-step-icon-img"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <span className="aff-step-pill">{step.label}</span>
              </div>
            ))}
          </div>

          <p className="aff-how-desc">
            Getting started with our affiliate program is easy:{' '}
            <strong>Join</strong> for free in minutes,{' '}
            <strong>choose</strong> the products you want to promote with your unique link,{' '}
            <strong>track</strong> your clicks and referrals in real time, and{' '}
            <strong>earn</strong> commissions on every successful sale.
          </p>
        </section>

        {/* ═══ 3. BENEFITS SECTION ═══ */}
        <section className="aff-benefits-section">
          <span className="aff-eyebrow">Benefits</span>

          <div className="aff-benefits-inner">
            <h2 className="aff-benefits-heading">
              Why Choose to
              <br />
              Work with Us
            </h2>

            <div className="aff-stats-grid">
              {BENEFIT_STATS.map((stat) => (
                <div key={stat.label} className="aff-stat-card">
                  <span className="aff-stat-label">{stat.label}</span>
                  <div className="aff-stat-value">{stat.value}</div>
                  <p className="aff-stat-desc">{stat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 4. CREATOR AFFILIATE APPLICATION FORM ═══ */}
        <section
          id="affiliate-apply-form"
          ref={formSectionRef}
          className="aff-form-section"
        >
          <span className="aff-eyebrow">Apply Now</span>

          <div className="aff-form-header">
            <h2 className="aff-form-title">Creator Affiliate Application</h2>
            <p className="aff-form-subtitle">
              Collaborate with Nitroxx as a moto vlogger, racer, or creator. Submit your details below to join free.
            </p>
          </div>

          <div className="aff-form-card">
            {submitError && (
              <div className="aff-error-banner">{submitError}</div>
            )}

            {!submitted ? (
              <form className="aff-form" onSubmit={handleFormSubmit}>
                {/* Perks Strip */}
                <div className="aff-perks-strip">
                  {CREATOR_PERKS.map((perk, idx) => (
                    <div key={idx} className="aff-perk-pill">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>

                {/* Row 1: Full Name & Instagram Username */}
                <div className="aff-form-row-2">
                  <NotchedField label="Full name" required>
                    <input
                      ref={nameInputRef}
                      id="aff-creator-name"
                      type="text"
                      name="name"
                      className="aff-notched-input"
                      required
                      placeholder="e.g. Alex Rivera"
                      value={creatorData.name}
                      onChange={handleCreatorChange}
                    />
                  </NotchedField>

                  <NotchedField
                    label="Instagram username"
                    subtag="Social"
                    prefix="@"
                    required
                  >
                    <input
                      id="aff-creator-instagram"
                      type="text"
                      name="instagramUsername"
                      className="aff-notched-input"
                      required
                      placeholder="username"
                      value={creatorData.instagramUsername}
                      onChange={(e) => {
                        const cleanVal = e.target.value.replace(/^@+/, '');
                        setCreatorData((prev) => ({ ...prev, instagramUsername: cleanVal }));
                      }}
                    />
                  </NotchedField>
                </div>

                {/* Instagram Professional Dashboard Screenshot Upload */}
                <div className="aff-screenshot-group">
                  <div className="aff-screenshot-header">
                    <div className="aff-screenshot-label-left">
                      <span className="aff-screenshot-label-text">
                        Instagram professional dashboard screenshot
                      </span>
                      <span className="aff-field-subtag">Current Stats</span>
                    </div>
                    {screenshotPreview && (
                      <span className="aff-attached-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Screenshot Attached
                      </span>
                    )}
                  </div>

                  <p className="aff-screenshot-hint">
                    Upload a screenshot from your Instagram app showing your Professional Dashboard insights (Accounts Reached, Engaged &amp; Total Followers).
                  </p>

                  <input
                    ref={screenshotInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="aff-hidden-input"
                    onChange={handleScreenshotInputChange}
                  />

                  <div className="aff-screenshot-card">
                    {screenshotPreview ? (
                      <>
                        <div
                          className="aff-preview-thumb-wrap"
                          onClick={() => setShowScreenshotModal(true)}
                          title="Click to view full screenshot"
                        >
                          <img
                            src={screenshotPreview}
                            alt="Instagram Professional Dashboard Screenshot"
                            className="aff-preview-thumb-img"
                          />
                          <span className="aff-tap-preview-pill">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Tap to preview
                          </span>
                        </div>

                        <div className="aff-preview-meta">
                          <div className="aff-preview-file-info">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e1306c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                            </svg>
                            <span className="aff-preview-file-name" title={screenshotFile?.name}>
                              {screenshotFile?.name || 'dashboard_screenshot.jpg'}
                            </span>
                            {screenshotFile?.size && (
                              <span className="aff-preview-file-size">
                                ({(screenshotFile.size / (1024 * 1024)).toFixed(2)} MB)
                              </span>
                            )}
                          </div>

                          <div className="aff-preview-actions">
                            <button
                              type="button"
                              className="aff-preview-btn aff-preview-btn--change"
                              onClick={() => screenshotInputRef.current?.click()}
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              className="aff-preview-btn aff-preview-btn--remove"
                              onClick={handleRemoveScreenshot}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div
                        className={`aff-dropzone ${isDragOverScreenshot ? 'is-dragover' : ''} ${screenshotError ? 'has-error' : ''}`}
                        onClick={() => screenshotInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragOverScreenshot(true);
                        }}
                        onDragLeave={() => setIsDragOverScreenshot(false)}
                        onDrop={handleScreenshotDrop}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            screenshotInputRef.current?.click();
                          }
                        }}
                      >
                        <div className="aff-dropzone-icon">
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                          </svg>
                        </div>
                        <span className="aff-dropzone-title">
                          Upload Instagram Professional Dashboard Screenshot
                        </span>
                        <span className="aff-dropzone-desc">
                          Attach screenshot showing accounts reached, engaged &amp; follower analytics
                        </span>
                        <span className="aff-dropzone-formats">
                          Supports PNG, JPG, JPEG, WEBP (Max 15MB)
                        </span>
                      </div>
                    )}
                  </div>

                  {screenshotError && (
                    <span className="aff-field-error">{screenshotError}</span>
                  )}
                </div>

                {/* Viral Video Link */}
                <NotchedField
                  label="Viral video link"
                  hint="Best-performing Reel, Short, or Video (optional)"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  }
                >
                  <input
                    id="aff-creator-viral"
                    type="url"
                    name="viralVideoLink"
                    className="aff-notched-input"
                    placeholder="https://instagram.com/reel/... or https://youtube.com/shorts/..."
                    value={creatorData.viralVideoLink}
                    onChange={handleCreatorChange}
                  />
                </NotchedField>

                {/* Social Media Profile URLs (Multiple) */}
                <div className="aff-social-group">
                  <div className="aff-social-header">
                    <span className="aff-screenshot-label-text">Social media profile URLs</span>
                    <span className="aff-screenshot-hint">YouTube, TikTok, X, Twitch, etc.</span>
                  </div>

                  <div className="aff-social-list">
                    {creatorData.socialLinks.map((url, idx) => (
                      <div key={idx} className="aff-social-row">
                        <NotchedField
                          label={`Profile URL ${idx + 1}`}
                          icon={getSocialIcon(url)}
                        >
                          <input
                            type="url"
                            className="aff-notched-input"
                            placeholder={
                              idx === 0
                                ? 'https://youtube.com/@channel or tiktok.com/@user'
                                : 'https://...'
                            }
                            aria-label={`Profile URL ${idx + 1}`}
                            value={url}
                            onChange={(e) => handleSocialLinkChange(idx, e.target.value)}
                          />
                        </NotchedField>

                        {creatorData.socialLinks.length > 1 && (
                          <button
                            type="button"
                            className="aff-remove-social-btn"
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
                      className="aff-add-social-btn"
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

                {/* Short Description */}
                <NotchedField
                  label="Short description"
                  required
                  isTextarea
                  hint="Content style, motorcycle build/riding niche & reach"
                >
                  <div className="aff-notched-textarea-wrap">
                    <textarea
                      id="aff-creator-desc"
                      name="shortDescription"
                      className="aff-notched-textarea"
                      rows="3"
                      maxLength={500}
                      required
                      placeholder="Tell us about your content, motorcycle riding style, current audience reach, and how you want to collaborate with Nitroxx..."
                      value={creatorData.shortDescription}
                      onChange={handleCreatorChange}
                    />
                    <span className="aff-textarea-counter">
                      {creatorData.shortDescription.length} / 500
                    </span>
                  </div>
                </NotchedField>

                {/* Submit Bar */}
                <div className="aff-form-actions">
                  <span className="aff-form-note">
                    Free to join • Reviewed within 24–48 hours
                  </span>

                  <button
                    type="submit"
                    className="aff-submit-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="aff-btn-spinner" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <span>Submit Application</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Success Confirmation */
              <div className="aff-success-box">
                <div className="aff-success-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <h3 className="aff-success-title">Application Received!</h3>
                <p className="aff-success-desc">
                  Thank you for applying to join the{' '}
                  <strong>Nitroxx Creator Affiliate Program</strong>. Our partnerships team will review your application and get in touch within 24–48 hours.
                </p>

                <div className="aff-success-details">
                  <div>
                    <span>Name:</span> {creatorData.name || 'N/A'}
                  </div>
                  <div>
                    <span>Instagram:</span>{' '}
                    {creatorData.instagramUsername ? `@${creatorData.instagramUsername}` : 'N/A'}
                  </div>
                  <div>
                    <span>Track:</span> Creators &amp; Influencers
                  </div>
                  {screenshotPreview && (
                    <div>
                      <span>Stats Screenshot:</span> Attached (Verified)
                    </div>
                  )}
                  <div>
                    <span>Social Profiles:</span>{' '}
                    {creatorData.socialLinks.filter((l) => l.trim().length > 0).length || 0} linked
                  </div>
                  {creatorData.viralVideoLink && (
                    <div style={{ wordBreak: 'break-all' }}>
                      <span>Viral Video:</span> {creatorData.viralVideoLink}
                    </div>
                  )}
                </div>

                <div className="aff-success-actions">
                  <button
                    type="button"
                    className="aff-secondary-pill-btn"
                    onClick={handleResetForm}
                  >
                    Submit Another
                  </button>
                  <button
                    type="button"
                    className="aff-submit-btn"
                    onClick={() => navigate('/')}
                  >
                    Explore Nitroxx
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Lightbox Fullscreen Preview for Instagram Screenshot */}
      {showScreenshotModal &&
        screenshotPreview &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="aff-lightbox-overlay"
            onClick={() => setShowScreenshotModal(false)}
          >
            <div
              className="aff-lightbox-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aff-lightbox-header">
                <span className="aff-lightbox-title">
                  Instagram Professional Dashboard Screenshot
                </span>
                <button
                  type="button"
                  className="aff-lightbox-close-btn"
                  onClick={() => setShowScreenshotModal(false)}
                  aria-label="Close preview"
                >
                  ✕
                </button>
              </div>
              <div className="aff-lightbox-img-wrap">
                <img
                  src={screenshotPreview}
                  alt="Instagram Stats Dashboard Full Screenshot"
                  className="aff-lightbox-img"
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
