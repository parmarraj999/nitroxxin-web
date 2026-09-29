import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import "./AccessoriesHeroSlider.css";

const MARQUEE_TEXTS = [
  "NEW ARRIVALS",
  "WELCOME",
  "NEW ARRIVALS",
  "WELCOME",
  "NEW ARRIVALS",
  "WELCOME",
  "NEW ARRIVALS",
  "WELCOME",
];

const DEFAULT_SLIDES = [
  {
    id: "stop-dressing-broke",
    image: "/assets/images/banner-streetwear-clean.png",
    alt: "Stop Dressing Broke - Upto 50% off",
    badge: "UP TO 70% OFF",
    title: "Stop Dressing Broke",
    tagline: "Upto 50% off",
    link: "#shop",
    hasOverlayText: false,
  },
  {
    id: "streetwear-hd",
    image: "/assets/images/banner-streetwear-hd.jpg",
    alt: "Streetwear & Moto Fusion",
    badge: "NEW DROP",
    title: "STREETWEAR MEETS ASPHALT",
    tagline: "Exclusive Nitroxx Hoodies & Jackets • Upto 50% off",
    link: "#shop",
    hasOverlayText: true,
  },
  {
    id: "rider-gear",
    image: "/assets/images/banner-1.jpeg",
    alt: "Dominate Every Ride",
    badge: "FEATURED",
    title: "DOMINATE EVERY RIDE",
    tagline: "High-Performance Helmets & Protective Riding Gear",
    link: "#shop",
    hasOverlayText: true,
  },
];

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function AccessoriesHeroSlider({ banners = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(null);

  // Combine default slides with dynamic banners from Firestore if present
  const slides = useMemo(() => {
    const dynamicBanners = (banners || [])
      .filter((b) => b && (b.image || b.imageUrl))
      .map((b, idx) => ({
        id: b.id || `dyn-banner-${idx}`,
        image: b.image || b.imageUrl,
        alt: b.title || "Nitroxx accessories banner",
        title: b.title || "",
        tagline: b.subtitle || b.description || "",
        link: b.link || b.redirectUrl || "#shop",
        badge: b.badge || "FEATURED",
        hasOverlayText: Boolean(b.title || b.subtitle),
      }));

    if (dynamicBanners.length > 0) {
      // Primary featured streetwear banner first, then database banners
      return [DEFAULT_SLIDES[0], ...dynamicBanners, DEFAULT_SLIDES[1]];
    }
    return DEFAULT_SLIDES;
  }, [banners]);

  const total = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (total > 0 ? (prev + 1) % total : 0));
  }, [total]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (total > 0 ? (prev - 1 + total) % total : 0));
  }, [total]);

  // Auto-play timer (5 seconds) with pause on hover
  useEffect(() => {
    if (isHovered || total <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isHovered, nextSlide, total]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
  };

  const handleSlideClick = (e, link) => {
    if (link === "#shop") {
      e.preventDefault();
      const shopEl = document.querySelector(".ap-shop-section");
      if (shopEl) {
        shopEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="ap-hero-slider-section">
      {/* ── Marquee Ticker Bar ── */}
      <div className="ap-marquee-bar" aria-label="Announcement ticker">
        <div className="ap-marquee-track">
          <div className="ap-marquee-group">
            {MARQUEE_TEXTS.map((text, idx) => (
              <span key={`mq-1-${idx}`} className="ap-marquee-item">
                {text}
              </span>
            ))}
          </div>
          <div className="ap-marquee-group" aria-hidden="true">
            {MARQUEE_TEXTS.map((text, idx) => (
              <span key={`mq-2-${idx}`} className="ap-marquee-item">
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Slider Container ── */}
      <div
        className="ap-hero-slider"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides Track */}
        <div
          className="ap-hero-slider__track"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {slides.map((slide, index) => {
            const isShopAnchor = slide.link === "#shop";
            return (
              <div key={slide.id || index} className="ap-hero-slide">
                {isShopAnchor ? (
                  <a
                    href="#shop"
                    className="ap-hero-slide__inner"
                    onClick={(e) => handleSlideClick(e, slide.link)}
                  >
                    <img
                      src={slide.image}
                      alt={slide.alt || slide.title || "Banner"}
                      className="ap-hero-slide__image"
                    />
                    {slide.hasOverlayText && (
                      <div className="ap-hero-slide__overlay">
                        <div className="ap-hero-slide__content">
                          {slide.badge && (
                            <span className="ap-hero-slide__badge-pill">
                              {slide.badge}
                            </span>
                          )}
                          <h2 className="ap-hero-slide__title">{slide.title}</h2>
                          {slide.tagline && (
                            <p className="ap-hero-slide__tagline">{slide.tagline}</p>
                          )}
                          <span className="ap-hero-slide__btn">
                            Shop Now
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    )}
                  </a>
                ) : (
                  <Link
                    to={slide.link}
                    className="ap-hero-slide__inner"
                  >
                    <img
                      src={slide.image}
                      alt={slide.alt || slide.title || "Banner"}
                      className="ap-hero-slide__image"
                    />
                    {slide.hasOverlayText && (
                      <div className="ap-hero-slide__overlay">
                        <div className="ap-hero-slide__content">
                          {slide.badge && (
                            <span className="ap-hero-slide__badge-pill">
                              {slide.badge}
                            </span>
                          )}
                          <h2 className="ap-hero-slide__title">{slide.title}</h2>
                          {slide.tagline && (
                            <p className="ap-hero-slide__tagline">{slide.tagline}</p>
                          )}
                          <span className="ap-hero-slide__btn">
                            Shop Now
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    )}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Left / Right Navigation Arrow Buttons ── */}
        {total > 1 && (
          <>
            <button
              className="ap-hero-nav-btn ap-hero-nav-btn--prev"
              onClick={prevSlide}
              aria-label="Previous slide"
            >
              <ChevronLeftIcon />
            </button>
            <button
              className="ap-hero-nav-btn ap-hero-nav-btn--next"
              onClick={nextSlide}
              aria-label="Next slide"
            >
              <ChevronRightIcon />
            </button>
          </>
        )}

        {/* ── Dot Indicators ── */}
        {total > 1 && (
          <div className="ap-hero-dots" aria-label="Slide indicators">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`ap-hero-dot${currentIndex === index ? " ap-hero-dot--active" : ""}`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
