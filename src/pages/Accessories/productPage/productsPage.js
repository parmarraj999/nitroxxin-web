import React, { useState } from 'react'
import './productsPage.css'
import { Link, useParams } from 'react-router-dom';
import { useCollection } from '../../../hooks/useFirestore';
import { COLLECTIONS } from '../../../services/firebase';
import { normalizeProduct } from '../../../services/normalizers';
import AccessoriesHeader from '../accessoriesNav/AccessoriesHeader';

function ProductsPage({ filterType }) {
    const [filterOpen, setFilterOpen] = useState(false)
    const { id } = useParams();
    const [search, setSearch] = useState("");
    const productsQuery = useCollection(COLLECTIONS.products, { limit: 100 });
    const products = productsQuery.data.map(normalizeProduct).filter((product) => {
        const term = search.toLowerCase();
        const matchesSearch = !term || String(product.name).toLowerCase().includes(term) || String(product.category).toLowerCase().includes(term) || String(product.brand).toLowerCase().includes(term);
        if (!matchesSearch) return false;
        if (!id) return true;
        const matchValue = String(id).toLowerCase();
        if (filterType === "brand") return [product.brandId, product.brand].some((value) => String(value || "").toLowerCase() === matchValue);
        if (filterType === "vendor") return String(product.vendorId || "").toLowerCase() === matchValue;
        return [product.categoryId, product.category].some((value) => String(value || "").toLowerCase() === matchValue);
    });

    return (
        <div className="products-page">
            <AccessoriesHeader showBack search={search} onSearchChange={setSearch} />
            <div style={{padding:'40px'}}>
                <h1 className="products-page__title">
                    Products
                </h1>

                <div className="products-page__topbar">

                    <div className="products-page__left">

                        <button
                            className={`products-page__filter-btn${filterOpen ? ' products-page__filter-btn--active' : ''}`}
                            onClick={() => setFilterOpen(prev => !prev)}
                        >
                            ⚙ Filters
                        </button>

                        <span className="products-page__count">
                            Showing {products.length} of {productsQuery.data.length} products
                        </span>

                    </div>

                    <div className="products-page__sort">
                        <span>Sort By</span>
                        <select>
                            <option>Date, new to old</option>
                        </select>
                    </div>

                </div>

                {/* Filter Panel */}
                <div className={`products-filter${filterOpen ? ' products-filter--open' : ''}`}>

                    <button className="products-filter__close" onClick={() => setFilterOpen(false)}>
                        ✕
                    </button>

                    <div className="products-filter__column">
                        <h4>Availability</h4>
                        <label><input type="checkbox" /> In stock</label>
                        <label><input type="checkbox" /> Out of stock</label>
                        <button>Reset</button>
                    </div>

                    <div className="products-filter__column">
                        <h4>Price</h4>
                        <input type="range" />
                        <div className="products-filter__price">
                            <input value="₹ 0" readOnly />
                            <span>—</span>
                            <input value="₹ 16800" readOnly />
                        </div>
                        <button>Reset</button>
                    </div>

                    <div className="products-filter__column">
                        <h4>Color</h4>
                        <label>⚫ Black</label>
                        <label>🔴 Red</label>
                        <label>⚪ White</label>
                        <button>Reset</button>
                    </div>

                    <div className="products-filter__column">
                        <h4>Product Type</h4>
                        <label><input type="checkbox" /> CRASH GUARD</label>
                        <label><input type="checkbox" /> Crash guards</label>
                        <button>Reset</button>
                    </div>

                </div>

                <div className="products-page__grid">
                    {products.map((product) => (
                        <Link to={`/product/${product.id}`} className="product-card" key={product.id}>

                            <div className="product-card__image">
                                {product.image && <img src={product.image} alt={product.name} />}
                                <div className="product-card__trust">
                                    ⭐ Trusted by 200+ Customers
                                </div>
                                <div className="product-card__discount">
                                    OFF 18%
                                </div>
                            </div>

                            <h3>
                                {product.name}
                            </h3>

                            <div className="product-card__price">
                                {product.offerPriceText || product.priceText || product.offerPrice || product.price}
                                {product.offerPrice && product.price && product.offerPrice !== product.price && <span>{product.priceText || product.price}</span>}
                            </div>

                            <div className="product-card__emi">
                                or ₹665/Month
                                <button>Buy on EMI →</button>
                            </div>

                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ProductsPage
