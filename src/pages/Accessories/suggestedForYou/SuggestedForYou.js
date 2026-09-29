import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./SuggestedForYou.css";

const FALLBACK_SUGGESTIONS = [
  {
    id: "sug-1",
    name: "Vagary Hexa Cut Akrapovic Exhaust",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=60",
    rating: 4.2,
    price: 4999,
    offerPrice: 2083,
  },
  {
    id: "sug-2",
    name: "RN Enterprises Carbon Finish Exhaust Silencer",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=500&auto=format&fit=crop&q=60",
    rating: 4.0,
    price: 999,
    offerPrice: 367,
  },
  {
    id: "sug-3",
    name: "Miwings Universal For Bike Akrapovic Slip-On",
    image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=500&auto=format&fit=crop&q=60",
    rating: 4.0,
    price: 4599,
    offerPrice: 2046,
  },
  {
    id: "sug-4",
    name: "SPIRETON Stainless Steel Performance Bend Pipe",
    image: "https://images.unsplash.com/photo-1558980664-769d59546b3d?w=500&auto=format&fit=crop&q=60",
    rating: 4.0,
    price: 1799,
    offerPrice: 164,
  },
  {
    id: "sug-5",
    name: "SWIFT7 Heavy Duty Motorcycle Exhaust Header",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500&auto=format&fit=crop&q=60",
    rating: 4.1,
    price: 1499,
    offerPrice: 182,
  },
  {
    id: "sug-6",
    name: "RA ACCESSORIES Carbon Look Exhaust Muffler",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format&fit=crop&q=60",
    rating: 4.3,
    price: 1299,
    offerPrice: 420,
  },
];

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

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

export default function SuggestedForYou({ liveProducts = [] }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Use liveProducts if available, otherwise fallback
  const items = (liveProducts && liveProducts.length > 0)
    ? liveProducts.slice(0, 12).map((p, idx) => ({
        id: p.id,
        name: p.name || p.title || "Accessory Product",
        image: p.image || p.images?.[0] || FALLBACK_SUGGESTIONS[idx % FALLBACK_SUGGESTIONS.length].image,
        rating: p.averageRating || p.rating || (3.8 + ((idx * 3) % 13) / 10).toFixed(1),
        price: Number(p.price || p.regularPrice || p.mrp || 0),
        offerPrice: Number(p.offerPrice || p.salePrice || p.price || 0),
      }))
    : FALLBACK_SUGGESTIONS;

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
    if (!val) return "";
    return `₹${Number(val).toLocaleString("en-IN")}`;
  };

  return (
    <section className="sfy-section">
      {/* ── Header ── */}
      <div className="sfy-header">
        <h2 className="sfy-title">Suggested For You</h2>
        {/* <Link to="/accessories" className="sfy-view-all-btn" aria-label="View all suggestions">
          <ArrowRightIcon />
        </Link> */}
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

        {/* Product Cards Track */}
        <div className="sfy-track" ref={trackRef}>
          {items.map((item) => {
            const hasDiscount = item.price > 0 && item.offerPrice > 0 && item.price > item.offerPrice;
            const displayPrice = item.offerPrice > 0 ? item.offerPrice : item.price;
            const originalPrice = item.price > 0 ? item.price : null;

            return (
              <Link key={item.id} to={`/product/${item.id}`} className="sfy-card">
                <div className="sfy-card__img-box">
                  {item.image ? (
                    <img src={item.image} alt={item.name} loading="lazy" />
                  ) : (
                    <div className="sfy-card__no-img">No image</div>
                  )}

                  {/* {item.rating && (
                    <div className="sfy-card__rating">
                      <span>{item.rating}</span>
                      <span className="sfy-card__star">★</span>
                    </div>
                  )} */}
                </div>

                <div className="sfy-card__body">
                  <h3 className="sfy-card__name" title={item.name}>
                    {item.name}
                  </h3>

                  <div className="sfy-card__price-row">
                    {hasDiscount && (
                      <span className="sfy-card__mrp">{formatCurrency(originalPrice)}</span>
                    )}
                    <span className="sfy-card__price">{formatCurrency(displayPrice)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
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
