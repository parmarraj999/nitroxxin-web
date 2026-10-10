import React, { useRef } from 'react';
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
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/images/category-helmet.png';
                    }}
                />
                {/* <div className="category-card-overlay">
                    <span className="category-card-title">{title}</span>
                    <span className="category-card-arrow">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </span>
                </div> */}
            </div>
        </Link>
    );
};

const ShopByCategory = () => {
    const { categories: cachedCategories } = useAccessoriesContext();
    const sliderRef = useRef(null);

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

        console.log(categories)

    const scroll = (direction) => {
        if (sliderRef.current) {
            const scrollAmount = direction === 'left' ? -320 : 320;
            sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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
                    className="category-ctrl-btn"
                    onClick={() => scroll('left')}
                    aria-label="Previous categories"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
                <button
                    type="button"
                    className="category-ctrl-btn"
                    onClick={() => scroll('right')}
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
