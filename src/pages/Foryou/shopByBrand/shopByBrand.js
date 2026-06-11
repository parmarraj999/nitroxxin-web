import React from 'react';
import './shopByBrand.css';


const BrandItem = ({ image, alt }) => {
    return (
        <div className="brand-item">
            <div className="brand-circle">
                <img src={image} alt={alt} className="brand-logo" />
            </div>
        </div>
    );
};

const ShopByBrands = () => {
    const brands = [
        { image: 'assets/images/brand-1.png', alt: 'Alpinestars' },
        { image: 'assets/images/brand-2.png', alt: 'Brand' },
        { image: 'assets/images/brand-3.png', alt: 'Brand' },
        { image: 'assets/images/brand-4.png', alt: 'Studds' },
        { image: 'assets/images/brand-5.png', alt: 'DJI' },
        { image: 'assets/images/brand-6.png', alt: 'Cardo Systems' }
    ];

    return (
        <section className="shop-by-brands">
            <h2 className="brands-section-title">
                <span className="title-transparent">SHOP BY </span>
                <span className="title-green">BRANDS</span>
            </h2>

            <div className="brands-row">
                {brands.map((brand, index) => (
                    <BrandItem key={index} {...brand} />
                ))}
            </div>
            <div className="category-slider-btn" style={{marginTop:'150px'}}>
                <button className="arrow-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" color="white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left-icon lucide-chevron-left"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <button className="arrow-btn" >
                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" color="white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-right-icon lucide-chevron-right"><path d="m9 18 6-6-6-6" /></svg>
                </button>
            </div>
        </section>
    );
};

export default ShopByBrands;
