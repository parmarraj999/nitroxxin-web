import React, { useRef, useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import "./SuggestedForYou.css";
import { useAccessoriesPageContext } from "../../../context/AccessoriesPageContext";

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

const extractProductImage = (p) => {
  if (!p) return "";
  if (p.image && typeof p.image === "string" && p.image.trim()) return p.image.trim();
  if (p.imageUrl && typeof p.imageUrl === "string" && p.imageUrl.trim()) return p.imageUrl.trim();
  if (p.thumbnailUrl && typeof p.thumbnailUrl === "string" && p.thumbnailUrl.trim()) return p.thumbnailUrl.trim();
  if (p.thumbnail && typeof p.thumbnail === "string" && p.thumbnail.trim()) return p.thumbnail.trim();
  if (p.media?.mainImage && typeof p.media.mainImage === "string") return p.media.mainImage.trim();
  if (Array.isArray(p.images) && p.images.length > 0) {
    const first = p.images[0];
    if (typeof first === "string" && first.trim()) return first.trim();
    if (first && typeof first === "object" && (first.url || first.imageUrl || first.src)) {
      return (first.url || first.imageUrl || first.src).trim();
    }
  }
  if (Array.isArray(p.media?.galleryImages) && p.media.galleryImages.length > 0) {
    const first = p.media.galleryImages[0];
    if (typeof first === "string" && first.trim()) return first.trim();
  }
  return "";
};

export default function SuggestedForYou({
  liveProducts: propLiveProducts,
  suggestedProducts: propSuggestedProducts,
  loading: propLoading,
}) {
  const context = useAccessoriesPageContext();
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Resolve source products from props or context
  const sourceProducts = useMemo(() => {
    if (propSuggestedProducts && propSuggestedProducts.length > 0) {
      return propSuggestedProducts;
    }
    if (propLiveProducts && propLiveProducts.length > 0) {
      return propLiveProducts;
    }
    if (context?.suggestedProducts && context.suggestedProducts.length > 0) {
      return context.suggestedProducts;
    }
    if (context?.liveProducts && context.liveProducts.length > 0) {
      return context.liveProducts;
    }
    return [];
  }, [propSuggestedProducts, propLiveProducts, context?.suggestedProducts, context?.liveProducts]);

  const isLoading =
    propLoading !== undefined
      ? propLoading
      : (context?.loading && sourceProducts.length === 0);

  // Format real products into display cards
  const items = useMemo(() => {
    if (!sourceProducts || sourceProducts.length === 0) return [];

    return sourceProducts.slice(0, 16).map((p) => {
      const mrp = Number(p.price || p.regularPrice || p.mrp || 0);
      const offerPrice = Number(p.offerPrice || p.salePrice || p.pricing?.sellingPrice || 0);
      const displayPrice = offerPrice > 0 ? offerPrice : mrp;
      const originalPrice = mrp > displayPrice ? mrp : null;
      const hasDiscount = originalPrice !== null && originalPrice > displayPrice;
      const discountPercent = hasDiscount
        ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
        : 0;

      const ratingNum = Number(p.averageRating ?? p.rating ?? 0);
      const rating = ratingNum > 0 ? ratingNum.toFixed(1) : null;

      const category = p.category || p.categoryName || p.brand || p.brandName || "";

      return {
        id: p.id,
        name: p.name || p.title || "Accessory Product",
        image: extractProductImage(p),
        category,
        rating,
        price: originalPrice,
        displayPrice,
        hasDiscount,
        discountPercent,
      };
    });
  }, [sourceProducts]);

  const updateScrollButtons = () => {
    if (trackRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const el = trackRef.current;
    if (el) {
      el.addEventListener("scroll", updateScrollButtons, { passive: true });
      return () => el.removeEventListener("scroll", updateScrollButtons);
    }
  }, [items]);

  const scroll = (direction) => {
    if (trackRef.current) {
      const amount = direction === "left" ? -320 : 320;
      trackRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const formatCurrency = (val) => {
    if (!val && val !== 0) return "";
    return `₹${Number(val).toLocaleString("en-IN")}`;
  };

  // If loading and no products cached yet, render skeleton placeholders
  if (isLoading && items.length === 0) {
    return (
      <section className="sfy-section">
        <div className="sfy-header">
          <h2 className="sfy-title">Suggested For You</h2>
        </div>
        <div className="sfy-slider-wrapper">
          <div className="sfy-track">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={`sfy-skel-${idx}`} className="sfy-card sfy-card--skeleton">
                <div className="sfy-card__img-box sfy-skeleton-box sfy-shimmer" />
                <div className="sfy-card__body">
                  <div className="sfy-skeleton-line sfy-skeleton-line--cat sfy-shimmer" />
                  <div className="sfy-skeleton-line sfy-skeleton-line--title sfy-shimmer" />
                  <div className="sfy-skeleton-line sfy-skeleton-line--price sfy-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // If completely empty and not loading, don't show empty or fake cards
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="sfy-section">
      {/* ── Header ── */}
      <div className="sfy-header">
        <div>
          <h2 className="sfy-title">Suggested For You</h2>
          <span className="sfy-subtitle">Curated gear & performance accessories for your ride</span>
        </div>
      </div>

      {/* ── Slider Area ── */}
      <div className="sfy-slider-wrapper">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            className="sfy-nav-btn sfy-nav-btn--prev"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeftIcon />
          </button>
        )}

        {/* Real Product Cards Track */}
        <div className="sfy-track" ref={trackRef}>
          {items.map((item) => (
            <Link key={item.id} to={`/product/${item.id}`} className="sfy-card">
              <div className="sfy-card__img-box">
                {item.image ? (
                  <img src={item.image} alt={item.name} loading="lazy" />
                ) : (
                  <div className="sfy-card__no-img">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#bbb" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Nitroxx Gear</span>
                  </div>
                )}

                {item.hasDiscount && item.discountPercent > 0 && (
                  <span className="sfy-card__badge">{item.discountPercent}% OFF</span>
                )}

                {item.rating && (
                  <div className="sfy-card__rating">
                    <span>{item.rating}</span>
                    <span className="sfy-card__star">★</span>
                  </div>
                )}
              </div>

              <div className="sfy-card__body">
                {item.category && (
                  <span className="sfy-card__category" title={item.category}>
                    {item.category}
                  </span>
                )}

                <h3 className="sfy-card__name" title={item.name}>
                  {item.name}
                </h3>

                <div className="sfy-card__price-row">
                  {item.hasDiscount && item.price && (
                    <span className="sfy-card__mrp">{formatCurrency(item.price)}</span>
                  )}
                  <span className="sfy-card__price">
                    {item.displayPrice > 0 ? formatCurrency(item.displayPrice) : "Free / Enquire"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Right Arrow Button */}
        {canScrollRight && (
          <button
            className="sfy-nav-btn sfy-nav-btn--next"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRightIcon />
          </button>
        )}
      </div>
    </section>
  );
}
