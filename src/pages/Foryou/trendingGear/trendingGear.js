import React, { useState, useEffect, useRef, useMemo } from 'react';
import './trendingGear.css';
import { Link } from 'react-router-dom';
import { useAccessoriesContext } from '../../../context/AccessoriesContext';
import { useAuth } from '../../../context/AuthContext';
import { useAuthModal } from '../../../components/AuthModal/useAuthModal';
import { addToCart, saveWishlistItem } from '../../../services/commerceService';

// Marketplace-standard Cart Icon
function CartIcon({ color = "#000" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 10a4 4 0 0 1-8 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Marketplace-standard Heart Icon
function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlameIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function ZapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="#50d735" stroke="#50d735" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// Fallback products in case Firestore is loading or empty
const FALLBACK_GEAR = [
  {
    id: "fb-jacket-1",
    name: "Alpinestars T-GP Plus R v3 Air Jacket",
    category: "Riding Gear",
    brand: "Alpinestars",
    image: "/assets/images/category-jacket.png",
    price: 24999,
    offerPrice: 19999,
    priceText: "₹24,999",
    offerPriceText: "₹19,999",
    averageRating: 4.9,
    reviewCount: 148,
    isTrending: true,
    isFlashDeal: true,
    discountPercent: 20,
  },
  {
    id: "fb-helmet-1",
    name: "AGV K6 S ECE 22.06 Full Face Helmet",
    category: "Helmets",
    brand: "AGV",
    image: "/assets/images/category-helmet.png",
    price: 42000,
    offerPrice: 33600,
    priceText: "₹42,000",
    offerPriceText: "₹33,600",
    averageRating: 4.8,
    reviewCount: 94,
    isTrending: true,
    isFlashDeal: true,
    discountPercent: 20,
  },
  {
    id: "fb-boots-1",
    name: "Sidi Adventure 2 Gore-Tex Touring Boots",
    category: "Riding Boots",
    brand: "Sidi",
    image: "/assets/images/category-shoes.png",
    price: 32500,
    offerPrice: 26999,
    priceText: "₹32,500",
    offerPriceText: "₹26,999",
    averageRating: 4.9,
    reviewCount: 62,
    isTrending: true,
    isFlashDeal: false,
    discountPercent: 17,
  },
  {
    id: "fb-mount-1",
    name: "Quad Lock Pro Motorcycle Fork Stem Mount",
    category: "Tech & Mounts",
    brand: "Quad Lock",
    image: "/assets/images/category-mount.png",
    price: 7499,
    offerPrice: 5249,
    priceText: "₹7,499",
    offerPriceText: "₹5,249",
    averageRating: 4.9,
    reviewCount: 310,
    isTrending: true,
    isFlashDeal: true,
    discountPercent: 30,
  },
  {
    id: "fb-intercom-1",
    name: "Cardo Packtalk Edge Duo Mesh Intercom",
    category: "Electronics",
    brand: "Cardo Systems",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80",
    price: 36000,
    offerPrice: 29999,
    priceText: "₹36,000",
    offerPriceText: "₹29,999",
    averageRating: 4.9,
    reviewCount: 184,
    isTrending: true,
    isFlashDeal: false,
    discountPercent: 16,
  },
  {
    id: "fb-gloves-1",
    name: "Dainese Druid 4 Full Leather Gauntlet Gloves",
    category: "Gloves",
    brand: "Dainese",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80",
    price: 18500,
    offerPrice: 14800,
    priceText: "₹18,500",
    offerPriceText: "₹14,800",
    averageRating: 4.7,
    reviewCount: 75,
    isTrending: true,
    isFlashDeal: true,
    discountPercent: 20,
  },
];

// Product Card - MARKETPLACE UI (DARK EDITION)
function ProductCard({ product }) {
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  const price = Number(product.price || 0);
  const offerPrice = Number(product.offerPrice || price);
  const hasDiscount = offerPrice > 0 && price > offerPrice;
  const discountPercent = product.discountPercent || (hasDiscount ? Math.round(((price - offerPrice) / price) * 100) : 0);

  const displayPrice = product.offerPriceText || product.priceText || (offerPrice ? `₹${offerPrice.toLocaleString('en-IN')}` : (price ? `₹${price.toLocaleString('en-IN')}` : '₹0'));

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return openLogin();
    setLiked((prev) => !prev);
    try {
      await saveWishlistItem({ userId: user.uid, product });
    } catch (err) {
      console.error("Wishlist error:", err);
    }
  };

  const handleCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return openLogin();
    try {
      await addToCart({ userId: user.uid, product, quantity: 1 });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Cart error:", err);
    }
  };

  return (
    <Link className="tg-card" to={`/product/${product.id}`}>
      <div className="tg-card__image">
        {discountPercent > 0 ? (
          <span className="tg-card__badge tg-card__badge--deal">
            {discountPercent}% OFF
          </span>
        ) : product.isTrending ? (
          <span className="tg-card__badge tg-card__badge--trending">
            TRENDING
          </span>
        ) : null}

        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" />
        ) : (
          <span>No image</span>
        )}

        <button
          className={`tg-card__heart${liked ? " tg-card__heart--liked" : ""}`}
          onClick={handleWishlist}
          aria-label="Save product"
          type="button"
        >
          <HeartIcon />
        </button>
      </div>

      <div className="tg-card__info">
        <div className="tg-card__top-row">
          <span className="tg-card__category">
            {product.category || product.brand || "Accessory"}
          </span>
          <span className="tg-card__rating">
            <StarIcon />
            <span>{product.averageRating || "4.8"}</span>
          </span>
        </div>

        <div className="tg-card__name" title={product.name}>
          {product.name}
        </div>

        <div className="tg-card__price-row">
          <span className="tg-card__price">{displayPrice}</span>
          {hasDiscount && price > 0 && (
            <span className="tg-card__mrp">₹{price.toLocaleString('en-IN')}</span>
          )}
        </div>

        <button
          className={`tg-card__cart-btn ${added ? 'tg-card__cart-btn--added' : ''}`}
          onClick={handleCart}
          type="button"
        >
          <CartIcon color={added ? "#0d0f12" : "#0d0f12"} />
          <span>{added ? "Added to Cart ✓" : "Add to Cart"}</span>
        </button>
      </div>
    </Link>
  );
}

export default function TrendingGear() {
  const { products } = useAccessoriesContext();
  const [activeTab, setActiveTab] = useState('trending'); // 'trending' | 'deals' | 'bestsellers'
  const sliderRef = useRef(null);

  // Flash deals countdown timer (rolling 14h timer)
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 35, seconds: 28 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 18, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimerVal = (val) => String(val).padStart(2, '0');

  // Filter products according to active tab
  const displayProducts = useMemo(() => {
    const live = (products || []).filter((p) =>
      ['published', 'active', 'approved'].includes(p.status) || !p.status
    );

    let filtered = [];
    if (activeTab === 'trending') {
      filtered = live.filter((p) => p.trending || p.isTrending || (p.averageRating && p.averageRating >= 4.5));
    } else if (activeTab === 'deals') {
      filtered = live.filter(
        (p) => p.offerPrice && p.price && Number(p.offerPrice) < Number(p.price)
      );
    } else if (activeTab === 'bestsellers') {
      filtered = live.filter((p) => p.bestSeller || p.isBestSeller || p.stock > 0);
    }

    // If live products are insufficient, combine with realistic fallback gear
    if (filtered.length < 4) {
      const fallbackSubset = FALLBACK_GEAR.filter((item) => {
        if (activeTab === 'deals') return item.isFlashDeal;
        if (activeTab === 'trending') return item.isTrending;
        return true;
      });
      return [...filtered, ...fallbackSubset];
    }

    return filtered;
  }, [products, activeTab]);

  const slideLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -360, behavior: 'smooth' });
    }
  };

  const slideRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 360, behavior: 'smooth' });
    }
  };

  return (
    <section className="trending-gear-section">
      {/* Flash Deals Announcement Banner */}
      <div className="tg-flash-banner">
        <div className="tg-flash-banner__content">
          <div className="tg-flash-tag">
            <ZapIcon />
            <span>FLASH SALE</span>
          </div>
          <span className="tg-flash-text">
            Up to <strong>40% OFF</strong> on Certified Helmets, Riding Jackets & Tech!
          </span>
          <div className="tg-countdown">
            <span className="tg-countdown__label">Ends in:</span>
            <div className="tg-countdown__boxes">
              <span className="tg-countdown__digit">{formatTimerVal(timeLeft.hours)}h</span>
              <span className="tg-countdown__colon">:</span>
              <span className="tg-countdown__digit">{formatTimerVal(timeLeft.minutes)}m</span>
              <span className="tg-countdown__colon">:</span>
              <span className="tg-countdown__digit">{formatTimerVal(timeLeft.seconds)}s</span>
            </div>
          </div>
        </div>
        <Link to="/accessories?filter=Deals" className="tg-flash-btn">
          Grab Deals <ArrowRightIcon />
        </Link>
      </div>

      {/* Main Section Header */}
      <div className="tg-header">
        <div className="tg-header__titles">
          <h2 className="tg-section-title">
            <span className="title-transparent">MARKETPLACE </span>
            <span className="title-green">TRENDS</span>
          </h2>
          <p className="tg-section-subtitle">
            Premium riding gear, high-performance protection, and verified rider essentials.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="tg-tabs">
          <button
            className={`tg-tab-btn ${activeTab === 'trending' ? 'tg-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('trending')}
            type="button"
          >
            <FlameIcon /> Trending Gear
          </button>
          <button
            className={`tg-tab-btn ${activeTab === 'deals' ? 'tg-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('deals')}
            type="button"
          >
            <ZapIcon /> Flash Deals
          </button>
          <button
            className={`tg-tab-btn ${activeTab === 'bestsellers' ? 'tg-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('bestsellers')}
            type="button"
          >
            <StarIcon /> Best Sellers
          </button>
        </div>
      </div>

      {/* Product Slider Carousel using Marketplace Dark Edition Cards */}
      <div className="tg-slider-container">
        <button
          className="tg-nav-arrow tg-nav-arrow--left"
          onClick={slideLeft}
          aria-label="Previous products"
          type="button"
        >
          <ChevronLeftIcon />
        </button>

        <div className="tg-slider-track" ref={sliderRef}>
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <button
          className="tg-nav-arrow tg-nav-arrow--right"
          onClick={slideRight}
          aria-label="Next products"
          type="button"
        >
          <ChevronRightIcon />
        </button>
      </div>

      {/* Bottom Action Strip */}
      <div className="tg-footer-action">
        <div className="tg-perks-row">
          <div className="tg-perk">
            <span className="tg-perk__icon">🛡️</span>
            <div className="tg-perk__text">
              <strong>100% Genuine Gear</strong>
              <span>DOT & ECE Certified</span>
            </div>
          </div>
          <div className="tg-perk">
            <span className="tg-perk__icon">⚡</span>
            <div className="tg-perk__text">
              <strong>Express Pan-India</strong>
              <span>Fast 2-4 day dispatch</span>
            </div>
          </div>
          <div className="tg-perk">
            <span className="tg-perk__icon">🔄</span>
            <div className="tg-perk__text">
              <strong>Easy Exchange</strong>
              <span>Hassle-free size replacement</span>
            </div>
          </div>
        </div>

        <Link to="/accessories" className="tg-explore-all-btn">
          <span>Explore Entire Marketplace</span>
          <ArrowRightIcon />
        </Link>
      </div>
    </section>
  );
}
