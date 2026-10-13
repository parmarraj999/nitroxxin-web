import React, { useRef, useState, useEffect, useCallback } from 'react';
import './shopByCategory.css';
import { Link } from 'react-router-dom';
import { useAccessoriesContext } from '../../../context/AccessoriesContext';

const CategoryCard = ({ id, image, title, imageName }) => {
    return (
        <Link className="category-card-item" to={`/accessories/category/${id || encodeURIComponent(title)}`}>
            <div className="category-card-box">
                <img
                    src={imageName ? `../assets/category-icons/${imageName}` : image}
                    alt={title}
                    className="category-card-img"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/images/category-helmet.png';
                    }}
                />
            </div>
        </Link>
    );
};

const ShopByCategory = () => {
    const { categories: cachedCategories } = useAccessoriesContext();
    const sliderRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const fallbackCategories = [
        {
            id: 'rider-wear',
            image: '/assets/images/category-helmet.png',
            title: 'Rider Wear'
        },
        {
            id: 'helmets',
            image: '/assets/images/category-helmet.png',
            title: 'Helmets'
        },
        {
            id: 'bike-accessories',
            image: '/assets/images/category-mount.png',
            title: 'Bike Accessories'
        },
        {
            id: 'bike-performance',
            image: '/assets/images/category-mount.png',
            title: 'Bike Performance'
        },
        {
            id: 'tech-gadgets',
            image: '/assets/images/category-mount.png',
            title: 'Tech & Gadgets'
        }
    ];

    const categories = (cachedCategories && cachedCategories.length > 0)
        ? cachedCategories.map((c) => ({
            id: c.id,
            image: c.image || c.imageUrl || '/assets/images/category-helmet.png',
            title: c.title || c.label || c.name || 'Category',
            imageName: c.imageName
        }))
        : fallbackCategories;

    const checkScrollBounds = useCallback(() => {
        if (!sliderRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
        const maxScroll = Math.max(0, scrollWidth - clientWidth);
        setCanScrollLeft(scrollLeft > 6);
        setCanScrollRight(scrollLeft < maxScroll - 6);
    }, []);

    useEffect(() => {
        const slider = sliderRef.current;
        if (!slider) return;

        checkScrollBounds();
        slider.addEventListener('scroll', checkScrollBounds, { passive: true });
        window.addEventListener('resize', checkScrollBounds);

        const timer = setTimeout(checkScrollBounds, 250);

        return () => {
            slider.removeEventListener('scroll', checkScrollBounds);
            window.removeEventListener('resize', checkScrollBounds);
            clearTimeout(timer);
        };
    }, [checkScrollBounds, categories]);

    const scroll = (direction) => {
        if (!sliderRef.current) return;
        const slider = sliderRef.current;
        const { scrollLeft, scrollWidth, clientWidth } = slider;
        const maxScroll = Math.max(0, scrollWidth - clientWidth);

        if (maxScroll <= 0) return;

        // Dynamic step calculation based on card width + gap
        const firstCard = slider.querySelector('.category-card-item');
        const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 240;
        const style = window.getComputedStyle(slider);
        const gap = parseFloat(style.gap) || 24;
        const step = cardWidth + gap;

        if (direction === 'left') {
            const target = Math.max(0, scrollLeft - step);
            slider.scrollTo({ left: target, behavior: 'smooth' });
        } else {
            // Carefully clamp target so it NEVER overscrolls past maxScroll
            const target = Math.min(maxScroll, scrollLeft + step);
            slider.scrollTo({ left: target, behavior: 'smooth' });
        }
    };

    return (
        <section className="shop-by-category">
            <div className="category-section-header">
                <h2 className="category-section-title">
                    <span className="title-transparent">SHOP BY </span>
                    <span className="title-green">CATEGORY</span>
                </h2>
                <p className="category-section-sub">
                    Explore curated gear and accessories handpicked for your riding discipline
                </p>
            </div>

            <div className="categories-slider-wrapper">
                <div className="categories-row" ref={sliderRef}>
                    {categories.map((category, index) => (
                        <CategoryCard key={category.id || index} {...category} />
                    ))}
                </div>
            </div>

            <div className="category-slider-controls">
                <button
                    type="button"
                    className={`category-ctrl-btn ${!canScrollLeft ? 'disabled' : ''}`}
                    onClick={() => scroll('left')}
                    disabled={!canScrollLeft}
                    aria-label="Previous categories"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <button
                    type="button"
                    className={`category-ctrl-btn ${!canScrollRight ? 'disabled' : ''}`}
                    onClick={() => scroll('right')}
                    disabled={!canScrollRight}
                    aria-label="Next categories"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            </div>
        </section>
    );
};

export default ShopByCategory;
