import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import "./AccessoriesHeroSlider.css";
import { useDocument } from "../../../hooks/useFirestore";

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

  // Fetch page layout from Firestore: page_layout > accessories_layout (and page_layouts fallback)
  const { data: singularDoc } = useDocument("page_layout", "accessories_layout");
  const { data: pluralDoc } = useDocument("page_layouts", "accessories_layout");
  const { data: fallbackDoc } = useDocument("page_layouts", "accessories");
  const layoutData = singularDoc || pluralDoc || fallbackDoc;

  // Map dynamic banners from page_layout > accessories_layout
  const slides = useMemo(() => {
    const rawList =
      layoutData?.banners ||
      layoutData?.data?.banners ||
      (Array.isArray(banners) && banners.length > 0 ? banners : null);

    const bannerList = Array.isArray(rawList)
      ? rawList
      : rawList && typeof rawList === "object"
      ? Object.values(rawList)
      : [];

    const heroSlidesList =
      layoutData?.heroSlides ||
      layoutData?.data?.heroSlides ||
      [];

    // Filter valid banner items that contain an image
    const validBanners = bannerList.filter(
      (b) => b && (b.imageUrl || b.image || b.bannerUrl || b.banner)
    );

    // Fallback to heroSlides if banners array does not contain valid images
    const sourceList =
      validBanners.length > 0
        ? validBanners
        : Array.isArray(heroSlidesList)
        ? heroSlidesList.filter((s) => s && (s.imageUrl || s.image || s.bannerUrl || s.banner))
        : [];

    const mappedSlides = sourceList.map((b, idx) => {
      const image = b.imageUrl || b.image || b.bannerUrl || b.banner;
      const title = b.title || b.productName || b.name || "";
      const badge = b.badge || b.tag || "FEATURED";

      // Match heroSlide for richer subtitle if available
      const matchingSlide = Array.isArray(heroSlidesList)
        ? heroSlidesList.find(
            (s) =>
              (b.productId && s?.productId === b.productId) ||
              (title && s?.title === title)
          )
        : null;

      let tagline =
        b.subtitle ||
        b.tagline ||
        b.description ||
        b.subTitle ||
        matchingSlide?.subtitle ||
        matchingSlide?.description ||
        "";

      if (!tagline && b.brand) {
        tagline = b.price
          ? `${b.brand} • ₹${Number(b.price).toLocaleString("en-IN")}`
          : b.brand;
      }

      let link = b.redirectUrl || b.link || b.url || "";
      if (!link && b.productId) {
        link = `/products/details/${b.productId}`;
      }
      if (!link) {
        link = "#shop";
      }

      return {
        id: b.id || b.productId || `dyn-banner-${idx}`,
        image,
        alt: b.alt || title || "Nitroxx accessories banner",
        title,
        tagline,
        link,
        badge,
        hasOverlayText:
          b.hasOverlayText !== undefined
            ? Boolean(b.hasOverlayText)
            : Boolean(title || tagline || badge),
      };
    });

    if (mappedSlides.length > 0) {
      return mappedSlides;
    }

    return DEFAULT_SLIDES;
  }, [layoutData, banners]);

  const total = slides.length;

  // Reset index if slides count changes and currentIndex exceeds length
  useEffect(() => {
    if (currentIndex >= total && total > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, total]);

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
            const isExternal =
              typeof slide.link === "string" &&
              (slide.link.startsWith("http://") || slide.link.startsWith("https://"));

            const slideContent = (
              <>
                <img
                  src={slide.image}
                  alt={slide.alt || slide.title || "Banner"}
                  className="ap-hero-slide__image"
                  loading={index === 0 ? "eager" : "lazy"}
                />
                {slide.hasOverlayText && (
                  <div className="ap-hero-slide__overlay">
                    <div className="ap-hero-slide__content">
                      {slide.badge && (
                        <span className="ap-hero-slide__badge-pill">
                          {slide.badge}
                        </span>
                      )}
                      {slide.title && (
                        <h2 className="ap-hero-slide__title">{slide.title}</h2>
                      )}
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
              </>
            );

            return (
              <div key={slide.id || index} className="ap-hero-slide">
                {isShopAnchor ? (
                  <a
                    href="#shop"
                    className="ap-hero-slide__inner"
                    onClick={(e) => handleSlideClick(e, slide.link)}
                  >
                    {slideContent}
                  </a>
                ) : isExternal ? (
                  <a
                    href={slide.link}
                    className="ap-hero-slide__inner"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {slideContent}
                  </a>
                ) : (
                  <Link
                    to={slide.link}
                    className="ap-hero-slide__inner"
                  >
                    {slideContent}
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
