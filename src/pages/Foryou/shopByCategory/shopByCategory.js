import React from 'react';
import './shopByCategory.css';
import { Link } from 'react-router-dom';
import { useCollection } from '../../../hooks/useFirestore';
import { COLLECTIONS } from '../../../services/firebase';
import { normalizeCategory } from '../../../services/normalizers';


const CategoryItem = ({ id, image, title }) => {
    return (
        <Link className="category-item" to={`/category/${id}`}>
            <div className="category-circle">
                <img src={image} alt={title} className="category-image" />
                <p className="category-label">{title}</p>
            </div>
        </Link>
    );
};

const ShopByCategory = () => {
    const { data } = useCollection(COLLECTIONS.categories, { limit: 8 });
    const fallbackCategories = [
        {
            image: '/assets/images/category-jacket.png',
            title: 'Rider Wear'
        },
        {
            image: '/assets/images/category-helmet.png',
            title: 'Helmets'
        },
        {
            image: '/assets/images/category-shoes.png',
            title: 'Rider Wear'
        },
        {
            image: '/assets/images/category-helmet.png',
            title: 'Accessories'
        },
        {
            image: '/assets/images/category-helmet.png',
            title: 'Accessories'
        }
    ];
    const categories = data.length
        ? data.map(normalizeCategory).map((category) => ({ ...category, title: category.title || category.label }))
        : fallbackCategories;

    return (
        <section className="shop-by-category">
            <h2 className="category-section-title">
                <span className="title-transparent">SHOP BY </span>
                <span className="title-green">CATEGORY</span>
            </h2>

            <div className="categories-row">
                {categories.map((category, index) => (
                    <CategoryItem key={category.id || index} {...category} />
                ))}
            </div>
            <div className="category-slider-btn">
                <button className="arrow-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" color="white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left-icon lucide-chevron-left"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <button className="arrow-btn" >
                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" color="white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right-icon lucide-chevron-right"><path d="m9 18 6-6-6-6" /></svg>
                </button>
            </div>

        </section>
    );
};

export default ShopByCategory;
