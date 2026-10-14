import React, { useRef } from "react";
import "./category.css";
import { Link } from "react-router-dom";
import { useEventCategoryContext } from "../../../context/EventCategoryContext";
import { useForYouContext } from "../../../context/ForYouContext";

const CategoriesSection = ({ categories: propCategories }) => {
  const sliderRef = useRef(null);
  const eventCategoryCtx = useEventCategoryContext();
  const forYouCtx = useForYouContext();

  const categories =
    (propCategories && propCategories.length > 0)
      ? propCategories
      : (eventCategoryCtx?.categories && eventCategoryCtx.categories.length > 0)
        ? eventCategoryCtx.categories
        : (forYouCtx?.categories || []);

  const slideLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const slideRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  if (!categories || categories.length === 0) return null;

  return (
    <section className="categories-section">
      <div className="categories-section__header">
        <h2 className="categories-title">EVENTS CATEGORY</h2>
      </div>

      <div className="categories-wrapper ep-categories" ref={sliderRef}>
        {categories.map((cat, index) => {
          const target =
            cat.redirectUrl && cat.redirectUrl.startsWith("/") && cat.redirectUrl !== "/events?category="
              ? cat.redirectUrl
              : `/events/all?category=${encodeURIComponent(cat.id)}`;

          const imgSrc = cat.image || cat.imageUrl;

          return (
            <Link
              to={target}
              key={cat.id || index}
              className="ep-cat-card"
            >
              <div className="ep-cat-card__image-slot">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={cat.label || cat.title || "Category"}
                    loading="lazy"
                  />
                ) : (
                  <span>{cat.label || cat.title || "Category"}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      <div className="category-slider-btn">
        <button className="arrow-btn" onClick={slideLeft} aria-label="Previous categories">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button className="arrow-btn" onClick={slideRight} aria-label="Next categories">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default CategoriesSection;