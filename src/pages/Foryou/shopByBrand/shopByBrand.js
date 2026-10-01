import React, { useRef } from 'react';
import './shopByBrand.css';
import { Link } from 'react-router-dom';
import { useAccessoriesContext } from '../../../context/AccessoriesContext';

const BrandCard = ({ id, image, imageUrl, logo, logoUrl, alt, name, label, title }) => {
    const imgUrl = imageUrl || image || logoUrl || logo;
    const brandName = name || label || title || alt || 'Brand';
    const targetId = id || encodeURIComponent(brandName);

    return (
        <Link className="brand-item" to={`/accessories/brands/${targetId}`}>
            <div className="brand-card-wrapper">
                <img
                    src={imgUrl}
                    alt={brandName}
                    className="brand-card-img"
                    loading="lazy"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/images/brand-1.png';
                    }}
                />
            </div>
            <span className="brand-item-name">{brandName}</span>
        </Link>
    );
};

const ShopByBrands = () => {
    const { brands: cachedBrands } = useAccessoriesContext();
    const sliderRef = useRef(null);

    const fallbackBrands = [
        { id: 'alpinestars', image: '/assets/images/brand-1.png', name: 'Alpinestars' },
        { id: 'shoei', image: '/assets/images/brand-2.png', name: 'Shoei' },
        { id: 'dainese', image: '/assets/images/brand-3.png', name: 'Dainese' },
        { id: 'studds', image: '/assets/images/brand-4.png', name: 'Studds' },
        { id: 'dji', image: '/assets/images/brand-5.png', name: 'DJI' },
        { id: 'cardo', image: '/assets/images/brand-6.png', name: 'Cardo Systems' }
    ];

    // Show all available brands with featured ones first
    const availableBrands = (cachedBrands && cachedBrands.length > 0)
        ? [...cachedBrands]
            .filter((b) => b.image || b.imageUrl || b.logo || b.logoUrl || b.label)
            .sort((a, b) => (b.featuredForYou ? 1 : 0) - (a.featuredForYou ? 1 : 0))
        : fallbackBrands;

    const scroll = (direction) => {
        if (sliderRef.current) {
            const scrollAmount = direction === 'left' ? -320 : 320;
            sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section className="shop-by-brands">
            <div className="brands-section-header">
                <h2 className="brands-section-title">
                    <span className="title-transparent">SHOP BY </span>
                    <span className="title-green">BRANDS</span>
                </h2>
                <p className="brands-section-sub">
                    Premium equipment engineered by the world's most trusted motorcycling manufacturers
                </p>
            </div>

            <div className="brands-slider-wrapper">
                <div className="brands-row" ref={sliderRef}>
                    {availableBrands.map((brand, index) => (
                        <BrandCard key={brand.id || index} {...brand} />
                    ))}
                </div>
            </div>

            <div className="brands-slider-controls">
                <button
                    type="button"
                    className="brand-ctrl-btn"
                    onClick={() => scroll('left')}
                    aria-label="Previous brands"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <button
                    type="button"
                    className="brand-ctrl-btn"
                    onClick={() => scroll('right')}
                    aria-label="Next brands"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            </div>
        </section>
    );
};

export default ShopByBrands;
