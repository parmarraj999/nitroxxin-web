import React, { useState, useRef, useEffect, useMemo } from 'react';
import './curatedShowcase.css';
import { Link } from 'react-router-dom';
import { useAccessoriesContext } from '../../../context/AccessoriesContext';
import { useAuth } from '../../../context/AuthContext';
import { useAuthModal } from '../../../components/AuthModal/useAuthModal';
import { addToCart, saveWishlistItem } from '../../../services/commerceService';

// Normalize strings for matching
const norm = (str) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Product Card Component showing real Firestore data
function ShowcaseCard({ product }) {
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      if (openLogin) openLogin();
      return;
    }
    setLiked((prev) => !prev);
    try {
      await saveWishlistItem({ userId: user.uid, product });
    } catch (err) {
      console.error("Wishlist error:", err);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      if (openLogin) openLogin();
      return;
    }
    try {
      await addToCart({ userId: user.uid, product, quantity: 1 });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Cart error:", err);
    }
  };

  return (
    <Link className="cs-card" to={`/product/${product.id}`}>
      {/* Full-Cover Image Container */}
      <div className="cs-card__image-box">
        {/* Heart Wishlist Icon at top-right */}
        <button
          type="button"
          className={`cs-card__heart-btn ${liked ? 'liked' : ''}`}
          onClick={handleWishlist}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={liked ? "#ef4444" : "none"}
            stroke={liked ? "#ef4444" : "#ffffff"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Real Product Image covering full box */}
        <img
          src={product.image}
          alt={product.title}
          className="cs-card__img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/assets/images/category-mount.png";
          }}
        />
      </div>

      {/* Real Product Metadata */}
      <div className="cs-card__meta">
        <div className="cs-card__brand-row">
          <span className="cs-card__brand">{product.brand}</span>
          {product.subcategory && <span className="cs-card__subtag">{product.subcategory}</span>}
        </div>

        <p className="cs-card__title" title={product.title}>
          {product.title}
        </p>

        <div className="cs-card__price-row">
          <span className="cs-card__price">{product.displayPrice}</span>
          {product.emiText && (
            <span className="cs-card__emi">{product.emiText}</span>
          )}
        </div>

        {/* White Add to Cart Button placed right after price */}
        <button
          type="button"
          className={`cs-card__action-btn ${added ? 'added' : ''}`}
          onClick={handleAddToCart}
          aria-label="Add to cart"
        >
          {added ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Added to Cart</span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </Link>
  );
}

// Main Curated Showcase Section
export default function CuratedShowcase() {
  const { products: contextProducts, categories: contextCategories, productsLoading } = useAccessoriesContext();
  const [activeSubcategory, setActiveSubcategory] = useState("ALL");
  const [scrollProgress, setScrollProgress] = useState(0);

  const sliderRef = useRef(null);
  const filterBarRef = useRef(null);

  // Map subcategory images from the Firestore category document for products without gallery images
  const subcategoryImageMap = useMemo(() => {
    const map = {};
    (contextCategories || []).forEach((cat) => {
      const subcats = cat.subcategories || cat.subCategories || cat.subCats || [];
      subcats.forEach((s) => {
        const nameKey = norm(s.name || s.label || s.title);
        if (nameKey && (s.imageUrl || s.image)) {
          map[nameKey] = s.imageUrl || s.image;
        }
      });
    });
    return map;
  }, [contextCategories]);

  // Extract and format ONLY REAL products from Firestore
  const realProducts = useMemo(() => {
    if (!contextProducts || contextProducts.length === 0) return [];

    const getSubcategoryImage = (subcatName) => {
      const targetKey = norm(subcatName);
      if (!targetKey) return "";
      for (const [key, url] of Object.entries(subcategoryImageMap)) {
        if (key === targetKey || key.includes(targetKey) || targetKey.includes(key)) {
          return url;
        }
      }
      return "";
    };

    return contextProducts
      .filter((p) => {
        const cat = String(p.category || p.categoryName || "").toLowerCase();
        return cat.includes("accessories") || cat === "bike accessories";
      })
      .map((p) => {
        const sub = (p.subCategory || p.subcategory || "").trim();
        const rawPrice = Number(
          p.pricing?.sellingPrice ??
          p.pricing?.offerPrice ??
          p.offerPrice ??
          p.pricing?.mrp ??
          p.price ??
          p.mrp ??
          0
        );
        const regularPrice = Number(p.pricing?.mrp ?? p.price ?? p.mrp ?? rawPrice);
        const displayPrice = rawPrice > 0
          ? `₹${rawPrice.toLocaleString('en-IN')}`
          : (regularPrice > 0 ? `₹${regularPrice.toLocaleString('en-IN')}` : '₹999');
        const emiText = rawPrice > 0
          ? `₹${Math.round(rawPrice / 9).toLocaleString('en-IN')}/month`
          : '';

        const resolvedImage =
          p.media?.primaryImage ||
          p.image ||
          p.imageUrl ||
          (Array.isArray(p.media?.galleryImages) && p.media.galleryImages[0]) ||
          (Array.isArray(p.images) && p.images[0]) ||
          getSubcategoryImage(sub) ||
          "/assets/images/category-mount.png";

        return {
          id: p.id,
          title: (p.title || p.name || "Accessory Product").trim(),
          brand: (p.brand || p.brandName || "Nitroxx Precision Gear").trim(),
          category: p.category || p.categoryName || "Bike Accessories",
          subcategory: sub,
          rawPrice,
          displayPrice,
          emiText,
          image: resolvedImage
        };
      });
  }, [contextProducts, subcategoryImageMap]);

  // Extract Accessories Subcategories from the real products and Firestore category
  const accessoriesSubcategories = useMemo(() => {
    const list = ["ALL"];

    // 1. Get from the Bike Accessories category document
    const accessCat = (contextCategories || []).find((c) => {
      const name = String(c.label || c.title || c.name || "").toLowerCase();
      return name.includes("accessories") || name === "bike accessories";
    });

    if (accessCat) {
      const embedded = accessCat.subcategories || accessCat.subCategories || accessCat.subCats || [];
      embedded.forEach((s) => {
        const name = (s.name || s.label || s.title || String(s)).trim().toUpperCase();
        if (name && !list.includes(name)) {
          list.push(name);
        }
      });
    }

    // 2. Also ensure every subcategory actually present in real products is listed
    realProducts.forEach((p) => {
      if (p.subcategory) {
        const formatted = p.subcategory.trim().toUpperCase();
        if (!list.includes(formatted)) {
          list.push(formatted);
        }
      }
    });

    return list;
  }, [contextCategories, realProducts]);

  // Filter real products by selected subcategory
  const filteredProducts = useMemo(() => {
    if (!activeSubcategory || activeSubcategory === "ALL") {
      return realProducts;
    }

    const targetKey = norm(activeSubcategory);

    return realProducts.filter((p) => {
      const subKey = norm(p.subcategory);
      const titleKey = norm(p.title);

      if (subKey === targetKey) return true;
      if (subKey && (subKey.includes(targetKey) || targetKey.includes(subKey))) return true;
      if (titleKey.includes(targetKey)) return true;

      // Match common variations (e.g. "PHONE MOUNTS" vs "Phone Mount")
      if (targetKey.includes("MOUNT") && (subKey.includes("MOUNT") || titleKey.includes("MOUNT"))) return true;
      if (targetKey.includes("SADDLE") && (subKey.includes("SADDLE") || titleKey.includes("SADDLE"))) return true;
      if (targetKey.includes("TANK") && (subKey.includes("TANK") || titleKey.includes("TANK"))) return true;
      if (targetKey.includes("CRASH") && (subKey.includes("CRASH") || titleKey.includes("CRASH") || subKey.includes("SLIDER"))) return true;
      if (targetKey.includes("SLIDER") && (subKey.includes("SLIDER") || titleKey.includes("SLIDER") || subKey.includes("CRASH"))) return true;
      if (targetKey.includes("LOCK") && (subKey.includes("LOCK") || titleKey.includes("LOCK"))) return true;
      if (targetKey.includes("HYDRATION") && (subKey.includes("HYDRATION") || titleKey.includes("HYDRATION"))) return true;
      if (targetKey.includes("NAV") && (subKey.includes("NAV") || titleKey.includes("NAV") || titleKey.includes("GPS"))) return true;
      if (targetKey.includes("CAMP") && (subKey.includes("CAMP") || titleKey.includes("CAMP"))) return true;
      if (targetKey.includes("REFLECT") && (subKey.includes("REFLECT") || titleKey.includes("REFLECT"))) return true;
      if (targetKey.includes("FIRSTAID") && (subKey.includes("FIRSTAID") || titleKey.includes("FIRSTAID") || titleKey.includes("SURVIVAL"))) return true;

      return false;
    });
  }, [realProducts, activeSubcategory]);

  // Track carousel scrolling to update bottom progress indicator
  const handleScroll = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll <= 0) {
      setScrollProgress(0);
      return;
    }
    const progress = Math.min(Math.max(scrollLeft / maxScroll, 0), 1);
    setScrollProgress(progress);
  };

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [filteredProducts]);

  // Slide left & right handlers
  const slideLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const slideRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  // Interactive seek on the progress bar track
  const handleTrackClick = (e) => {
    const track = e.currentTarget;
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    if (sliderRef.current) {
      const maxScroll = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
      sliderRef.current.scrollTo({ left: ratio * maxScroll, behavior: 'smooth' });
    }
  };

  const thumbWidthPercent = 25;

  return (
    <section
      className="curated-showcase-section"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL || ''}/assets/images/fy-gradient-background.jpeg)`
      }}
    >
      <div className="cs-container">
        {/* Top Accessories Subcategories Filter Bar */}
        <div className="cs-filter-wrapper">
          <h1>Accessories Showcase</h1>
          <div className="cs-filter-bar" ref={filterBarRef}>
            {accessoriesSubcategories.map((subcat) => (
              <button
                key={subcat}
                type="button"
                className={`cs-filter-tab ${activeSubcategory === subcat ? 'active' : ''}`}
                onClick={() => {
                  setActiveSubcategory(subcat);
                  if (sliderRef.current) {
                    sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                  }
                }}
              >
                {subcat}
              </button>
            ))}
          </div>
        </div>

        {/* Carousel Showcase Row */}
        <div className="cs-carousel-wrapper">
          <div className="cs-carousel-track" ref={sliderRef}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ShowcaseCard key={product.id} product={product} />
              ))
            ) : productsLoading ? (
              <div className="cs-loading-notice">Loading real accessories...</div>
            ) : (
              <div className="cs-loading-notice">No products found for this subcategory.</div>
            )}
          </div>
        </div>

        {/* Bottom Navigation & Progress Track Controls */}
        <div className="cs-controls">
          <button
            type="button"
            className="cs-control-btn cs-control-btn--prev"
            onClick={slideLeft}
            aria-label="Previous"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div
            className="cs-progress-bar"
            onClick={handleTrackClick}
            role="slider"
            aria-valuenow={Math.round(scrollProgress * 100)}
            title="Click to seek"
          >
            <div
              className="cs-progress-thumb"
              style={{
                left: `${scrollProgress * (100 - thumbWidthPercent)}%`,
                width: `${thumbWidthPercent}%`
              }}
            />
          </div>

          <button
            type="button"
            className="cs-control-btn cs-control-btn--next"
            onClick={slideRight}
            aria-label="Next"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
