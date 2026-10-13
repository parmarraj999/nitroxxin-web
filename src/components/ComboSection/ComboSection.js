import React, { useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./ComboSection.css";
import ForYouContext, { DEFAULT_FALLBACK_COMBOS } from "../../context/ForYouContext";

export default function ComboSection({
  theme = "light",
  sectionTitle = "COMBO OFFERS & RIDER PACKS",
  sectionSubtitle = "Curated protection and riding gear packages bundled together with exclusive discounts.",
  combos: propCombos,
}) {
  const navigate = useNavigate();
  const forYouContext = useContext(ForYouContext);

  const combos = propCombos || forYouContext?.combos || DEFAULT_FALLBACK_COMBOS;

  const sliderRef = useRef(null);

  // Slider navigation: scroll by 1 card width + gap
  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const container = sliderRef.current;
      const firstCard = container.querySelector(".combo-deal-card");
      const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 340;
      const gap = 22;
      const scrollAmount = cardWidth + gap;

      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleCardClick = (comboId) => {
    if (comboId) {
      navigate(`/combo/${comboId}`);
    }
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

        {/* ── Card Slider / Carousel ── */}
        <div className="combo-slider-wrapper">
          {/* Scrollable Track with Card Peek on both sides */}
          <div className="combo-cards-track" ref={sliderRef}>
            {combos.map((combo, idx) => {
              const mixedImg = combo.mergedImageUrl;
              return (
                <div
                  key={combo.id || idx}
                  className="combo-deal-card"
                  onClick={() => handleCardClick(combo.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick(combo.id);
                    }
                  }}
                  role="button"
                  tabIndex="0"
                  aria-label={`View ${combo.title} details`}
                >
                  {/* Top Area: Mixed Product Image */}
                  <div className="combo-card-top-visual">
                    <div className="combo-card-img-box">
                      <img
                        src={mixedImg}
                        alt={combo.title}
                        className="combo-card-mixed-img"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Bottom Slider Controls: Prev Button, Pagination Dots, Next Button ── */}
          {combos.length > 1 && (
            <div className="combo-slider-controls" aria-label="Combo slider navigation">
              <button
                type="button"
                className="combo-arrow-btn combo-arrow-btn--prev"
                onClick={() => scrollSlider("left")}
                aria-label="Previous combo deals"
                title="Previous deal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
