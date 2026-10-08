import React, { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ComboSection.css";
import { useDocument } from "../../hooks/useFirestore";

// Color presets for deal cards matching the reference image palette
const CARD_COLOR_PALETTE = [
  "#2da84e", // Vibrant Emerald Green (like Snoomart in reference)
  "#c0262b", // Nitroxx Racing Red
  "#1e3a8a", // Deep Racing Blue
  "#d97706", // Sunset Amber Orange
  "#7c3aed", // Royal Violet
  "#18181b", // Carbon Obsidian
];

// Fallback high-value combos matching the reference deal card UI
const DEFAULT_FALLBACK_COMBOS = [
  {
    id: "combo-starter-touring",
    title: "Grab 25% off on Touring Bundle!",
    subtitle: "Complete protection with Axor Apex helmet, Kevlar gloves & thermal balaclava...",
    badge: "Nitroxx Mart",
    discountText: "25% off",
    color: "#2da84e",
    mixedImage: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
    validUntil: "Aug 4 - Aug 31",
    offerPrice: 6897,
    regularPrice: 8397,
    progressLabel: "0 of 8,397 INR",
    productList: [
      {
        id: "combo-prod-1",
        title: "Axor Apex Venom Aerodynamic Helmet",
        brand: "Axor",
        price: 4999,
        offerPrice: 4299,
        imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "combo-prod-2",
        title: "Kevlar Reinforced Touchscreen Riding Gloves",
        brand: "Rynox",
        price: 2499,
        offerPrice: 1999,
        imageUrl: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "combo-prod-3",
        title: "Anti-Pollution Thermal Rider Balaclava",
        brand: "Nitroxx",
        price: 899,
        offerPrice: 599,
        imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: "combo-urban-commuter",
    title: "Grab 20% off on Urban Armor!",
    subtitle: "CE-Level 2 armored jacket, dual bionic knee guards & magnetic tank bag...",
    badge: "Urban Rider",
    discountText: "20% off",
    color: "#c0262b",
    mixedImage: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
    validUntil: "Limited Period Deal",
    offerPrice: 10999,
    regularPrice: 13497,
    progressLabel: "0 of 13,497 INR",
    productList: [
      {
        id: "combo-prod-4",
        title: "Airframe CE-Level 2 Armored Riding Jacket",
        brand: "Alpinestars",
        price: 7999,
        offerPrice: 6799,
        imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "combo-prod-5",
        title: "BioArmor Ergonomic Dual Bionic Knee Guards",
        brand: "Scoyco",
        price: 2899,
        offerPrice: 2299,
        imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "combo-prod-6",
        title: "Heavy-Duty Magnetic Waterproof Tank Bag",
        brand: "ViaTerra",
        price: 2599,
        offerPrice: 1999,
        imageUrl: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: "combo-track-racing",
    title: "Flat 30% off on Track Pro Pack!",
    subtitle: "Carbon helmet, Kevlar racing gloves & knee sliders for motorsport enthusiasts...",
    badge: "Track Pro",
    discountText: "30% off",
    color: "#1e3a8a",
    mixedImage: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80",
    validUntil: "Weekend Flash Deal",
    offerPrice: 16499,
    regularPrice: 23599,
    progressLabel: "0 of 23,599 INR",
    productList: [
      {
        id: "combo-prod-1",
        title: "Axor Apex Venom Aerodynamic Helmet",
        brand: "Axor",
        price: 4999,
        offerPrice: 4299,
        imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "combo-prod-2",
        title: "Kevlar Reinforced Touchscreen Riding Gloves",
        brand: "Rynox",
        price: 2499,
        offerPrice: 1999,
        imageUrl: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: "combo-monsoon-weather",
    title: "Save 15% on All-Weather Pack!",
    subtitle: "Waterproof boots, seam-sealed rain suit & 45L luggage tail bag...",
    badge: "All-Weather",
    discountText: "15% off",
    color: "#d97706",
    mixedImage: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80",
    validUntil: "Monsoon Special",
    offerPrice: 8299,
    regularPrice: 9799,
    progressLabel: "0 of 9,799 INR",
    productList: [
      {
        id: "combo-prod-6",
        title: "Heavy-Duty Magnetic Waterproof Tank Bag",
        brand: "ViaTerra",
        price: 2599,
        offerPrice: 1999,
        imageUrl: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
];

export default function ComboSection({
  theme = "light",
  sectionTitle = "COMBO OFFERS & RIDER PACKS",
  sectionSubtitle = "Curated protection and riding gear packages bundled together with exclusive discounts.",
}) {
  const navigate = useNavigate();

  // Fetch combo configurations from page_layouts / accessories_layout
  const { data: primaryLayout } = useDocument("page_layouts", "accessories_layout");
  const { data: fallbackLayout } = useDocument("page_layouts", "accessories");
  const { data: singularLayout } = useDocument("page_layout", "accessories_layout");

  // Determine active combos list
  const combos = useMemo(() => {
    const raw =
      primaryLayout?.combos ||
      fallbackLayout?.combos ||
      singularLayout?.combos ||
      [];

    if (Array.isArray(raw) && raw.length > 0) {
      const valid = raw.filter((c) => c && (c.title || c.name));
      if (valid.length > 0) {
        return valid.map((c, idx) => ({
          ...c,
          color: c.color || c.bgColor || CARD_COLOR_PALETTE[idx % CARD_COLOR_PALETTE.length],
          mixedImage: c.mixedImage || c.image || c.bannerUrl || c.banner,
        }));
      }
    }
    return DEFAULT_FALLBACK_COMBOS;
  }, [primaryLayout, fallbackLayout, singularLayout]);

  const sliderRef = useRef(null);

  // Slider navigation: scroll by 1 card width + gap
  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const cardWidth = 320;
      sliderRef.current.scrollBy({
        left: direction === "left" ? -cardWidth : cardWidth,
        behavior: "smooth",
      });
    }
  };


  const handleCardClick = (comboId) => {
    navigate(`/combo/${comboId}`);
  };

  return (
    <section className={`combo-section combo-section--${theme}`}>
      <div className="combo-container">
        {/* Section Header */}
        <div className="combo-header">
          <div className="combo-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Special Value Deals
          </div>

          <div className="combo-header-top">
            <div>
              <h2 className="combo-title">{sectionTitle}</h2>
              <p className="combo-subtitle">{sectionSubtitle}</p>
            </div>
          </div>
        </div>

        {/* ── Card Slider / Carousel (Matches Reference Image UI) ── */}
        <div className="combo-slider-wrapper">
          {/* Navigation Controls (Floating circular dark arrow buttons) */}
          <button
            type="button"
            className="combo-arrow-btn combo-arrow-btn--prev"
            onClick={() => scrollSlider("left")}
            aria-label="Previous combo deals"
            title="Previous deal"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>

          <button
            type="button"
            className="combo-arrow-btn combo-arrow-btn--next"
            onClick={() => scrollSlider("right")}
            aria-label="Next combo deals"
            title="Next deal"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          {/* Scrollable Track with Card Peek on both sides */}
          <div className="combo-cards-track" ref={sliderRef}>
            {combos.map((combo, idx) => {
              const cardColor = combo.color || CARD_COLOR_PALETTE[idx % CARD_COLOR_PALETTE.length];
              const mixedImg =
                combo.mixedImage ||
                combo.image ||
                combo.bannerUrl ||
                "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80";

              return (
                <div
                  key={combo.id || idx}
                  className="combo-deal-card"
                  style={{ backgroundColor: cardColor }}
                  onClick={() => handleCardClick(combo.id)}
                  role="button"
                  tabIndex="0"
                  aria-label={`View ${combo.title} details`}
                >
                  {/* Top Area: Mixed Product Image + Starburst Discount Badge + Info Icon */}
                  <div className="combo-card-top-visual">
                    <div className="combo-card-img-box">
                      <img
                        src={mixedImg}
                        alt={combo.title}
                        className="combo-card-mixed-img"
                        loading="lazy"
                      />
                    </div>

                    {/* Starburst/Circle Yellow Discount Badge (Like "20% off" in reference) */}
                    {combo.discountText && (
                      <div className="combo-card-burst-badge">
                        <span>{combo.discountText}</span>
                      </div>
                    )}

                    {/* Info Icon top-right */}
                    <button
                      type="button"
                      className="combo-card-info-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCardClick(combo.id);
                      }}
                      aria-label="More details"
                      title="View combo details"
                    >
                      i
                    </button>
                  </div>

                  {/* Middle Content Area */}
                  <div className="combo-card-body">
                    {/* Brand / Store Pill Badge */}
                    <div className="combo-card-brand-pill">
                      <span className="combo-card-brand-icon">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                      </span>
                      <span className="combo-card-brand-name">
                        {combo.badge || "Nitroxx Bundle"}
                      </span>
                    </div>

                    {/* Main Headline */}
                    <h3 className="combo-card-title">{combo.title}</h3>

                    {/* Subtitle / Description */}
                    <p className="combo-card-subtitle">{combo.subtitle}</p>
                  </div>

                  {/* Bottom Meta & Progress/Divider Area */}
                  <div className="combo-card-footer">
                    <div className="combo-card-progress-bar">
                      <div className="combo-card-progress-fill" />
                    </div>

                    <div className="combo-card-meta-row">
                      <span className="combo-card-date">
                        {combo.validUntil || (combo.offerPrice ? `Rs. ${Number(combo.offerPrice).toLocaleString("en-IN")}` : "Limited Period Deal")}
                      </span>
                      <span className="combo-card-status">
                        {combo.progressLabel || (combo.regularPrice ? `MRP Rs. ${Number(combo.regularPrice).toLocaleString("en-IN")}` : "View Bundle")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
