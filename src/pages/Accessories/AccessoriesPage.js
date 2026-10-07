import { useEffect, useMemo, useState, useRef } from "react";
import "./AccessoriesPage.css";
import { Link } from "react-router-dom";
import { useAccessoriesContext } from "../../context/AccessoriesContext";
import AccessoriesHeader from "./accessoriesNav/AccessoriesHeader";
import AccessoriesHeroSlider from "./accessoriesBanner/AccessoriesHeroSlider";
import { useBikeBrandsContext } from "../../context/BikeBrandsContext";
import SuggestedForYou from "./suggestedForYou/SuggestedForYou";
import ComboSection from "../../components/ComboSection/ComboSection";

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 10 18" fill="none">
      <path d="M9 17L1 9L9 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 10 18" fill="none">
      <path d="M1 17L9 9L1 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AccessoriesPage() {
  const categoryTrackRef = useRef(null);
  const bikeTrackRef = useRef(null);
  const brandTrackRef = useRef(null);

  const scrollLeft = (ref) => {
    if (ref.current) {
      const card = ref.current.firstElementChild;
      const cardWidth = card ? card.offsetWidth : 280;
      const gap = 32;
      ref.current.scrollBy({ left: -(cardWidth + gap), behavior: "smooth" });
    }
  };

  const scrollRight = (ref) => {
    if (ref.current) {
      const card = ref.current.firstElementChild;
      const cardWidth = card ? card.offsetWidth : 280;
      const gap = 32;
      ref.current.scrollBy({ left: cardWidth + gap, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (categoryTrackRef.current) categoryTrackRef.current.scrollLeft = 0;
    if (bikeTrackRef.current) bikeTrackRef.current.scrollLeft = 0;
    if (brandTrackRef.current) brandTrackRef.current.scrollLeft = 0;
  }, []);

  const {
    products,
    categories,
    brands,
    bikeBrands,
    banners,
  } = useAccessoriesContext();
  const { bikeBrands: fetchedBikeBrands } = useBikeBrandsContext();
  const [search, setSearch] = useState("");

  const liveProducts = useMemo(
    () =>
      products.filter((product) => ["published", "active", "approved"].includes(product.status)),
    [products]
  );
  const displayCategories = categories;
  const displayBrands = brands;
  const displayBikeBrands = useMemo(() => {
    if (fetchedBikeBrands && fetchedBikeBrands.length > 0) {
      return fetchedBikeBrands;
    }
    if (bikeBrands && bikeBrands.length > 0) {
      return bikeBrands;
    }
    return [];
  }, [fetchedBikeBrands, bikeBrands]);

  return (
    <div className="ap-page">
      <AccessoriesHeader search={search} onSearchChange={setSearch} />

      {/* ═══ MARQUEE & HERO SLIDER SECTION ═══ */}
      <AccessoriesHeroSlider banners={banners} />

      <img src={'/assets/images/strip-banner.png'} style={{ width: '100%', height: '200px', marginTop:'2rem' }} alt='stripe-banner' />

      {displayCategories.length > 0 && (
        <div className="ap-section">
          <h2 className="ap-section__title">SHOP BY CATEGORY</h2>
          <div className="ap-category-slider">
            <button className="ap-category-slider__btn" aria-label="Previous" onClick={() => scrollLeft(categoryTrackRef)}><ChevronLeftIcon /></button>
            <div className="ap-category-track" ref={categoryTrackRef}>
              {displayCategories.map((cat) => (
                <Link to={`/accessories/category/${cat.id}`} key={cat.id} className="ap-cat-card">
                  <div className="ap-cat-card__image-bg">
                    {cat.image ? <img src={cat.image} alt={cat.label} /> : <span></span>}
                  </div>
                </Link>
              ))}
            </div>
            <button className="ap-category-slider__btn" aria-label="Next" onClick={() => scrollRight(categoryTrackRef)}><ChevronRightIcon /></button>
          </div>
        </div>
      )}

      {displayBikeBrands.length > 0 && (
        <div className="ap-section">
          <h2 className="ap-section__title">SHOP BY BIKE</h2>
          <div className="ap-category-slider">
            <button className="ap-category-slider__btn" aria-label="Previous" onClick={() => scrollLeft(bikeTrackRef)}><ChevronLeftIcon /></button>
            <div className="ap-category-track" ref={bikeTrackRef}>
              {displayBikeBrands.map((bike) => (
                <Link key={bike.id} to={`/accessories/brands/${bike.id}`} className="ap-bike-card">
                  <div className="ap-bike-card__image-box">
                    {bike.image ? <img src={bike.image} alt={bike.label} /> : <span>{bike.label}</span>}
                  </div>
                  <span className="ap-bike-card__label">{bike.label}</span>
                </Link>
              ))}
            </div>
            <button className="ap-category-slider__btn" aria-label="Next" onClick={() => scrollRight(bikeTrackRef)}><ChevronRightIcon /></button>
          </div>
        </div>
      )}

      {displayBrands.length > 0 && (
        <div className="ap-section">
          <h2 className="ap-section__title">SHOP BY BRAND</h2>
          <div className="ap-category-slider">
            <button className="ap-category-slider__btn" aria-label="Previous" onClick={() => scrollLeft(brandTrackRef)}><ChevronLeftIcon /></button>
            <div className="ap-category-track" ref={brandTrackRef}>
              {displayBrands.map((brand) => (
                <Link to={`/shop?brand=${encodeURIComponent(brand.label || brand.name || brand.title || "")}`} key={brand.id} className="ap-brand-card">
                  <div className="ap-brand-card__box">
                    {brand.image ? <img src={brand.image} alt={brand.label} /> : <span>{brand.label}</span>}
                  </div>
                </Link>
              ))}
            </div>
            <button className="ap-category-slider__btn" aria-label="Next" onClick={() => scrollRight(brandTrackRef)}><ChevronRightIcon /></button>
          </div>
        </div>
      )}

      {/* ═══ COMBO PACKAGES & GEAR BUNDLES ═══ */}
      <ComboSection
        theme="light"
        sectionTitle="COMBO OFFERS & RIDER BUNDLES"
        sectionSubtitle="Curated protective gear and accessory bundles grouped together for maximum value."
      />

      {/* ═══ SUGGESTED FOR YOU SECTION ═══ */}
      <SuggestedForYou liveProducts={liveProducts} />
    </div>
  );
}
