import React, { useState } from 'react'
import './productsPage.css'
import { Link, useNavigate } from 'react-router-dom';

function SearchIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="7" stroke="#000" strokeWidth="2" />
            <path d="M16.5 16.5L22 22" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function CartIcon({ color = "#000" }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <path d="M16 10a4 4 0 0 1-8 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function MenuIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="3" y1="6" x2="21" y2="6" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="12" x2="21" y2="12" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <line x1="3" y1="18" x2="21" y2="18" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

function ProductsPage() {
    const [filterOpen, setFilterOpen] = useState(false)
    const navLinks = ["Rider Wear", "Tech & Gadget", "Performance", "Helmets", "Bike Accessories"];
    const navigate = useNavigate();
    const [search, setSearch] = useState("");

    return (
        <div className="products-page">
            <header className="ap-header">
                <div onClick={() => navigate(-1)} style={{ width: '30px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: "pointer" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left-icon lucide-arrow-left"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
                </div>

                <div className="ap-header__divider" />

                {/* Nav links */}
                <nav className="ap-header__nav">
                    {navLinks.map((link) => (
                        <a
                            href="/"
                            key={link}
                            type="button"
                            className="ap-header__nav-link"
                        >
                            {link}
                        </a>
                    ))}
                </nav>

                {/* Right side: search + cart + menu */}
                <div className="ap-header__right">
                    <div className="ap-header__search">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Search Accessories.."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="ap-header__icon-btn" aria-label="Cart">
                        <CartIcon />
                    </button>
                    <button className="ap-header__icon-btn" aria-label="Menu">
                        <MenuIcon />
                    </button>
                </div>
            </header>
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
                            Showing 50 of 50 products
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
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                        <Link to='/accessories/123' className="product-card" key={item}>

                            <div className="product-card__image">
                                <div className="product-card__trust">
                                    ⭐ Trusted by 200+ Customers
                                </div>
                                <div className="product-card__discount">
                                    OFF 18%
                                </div>
                            </div>

                            <h3>
                                TRIUMPH SCRAMBLER 400XC HECTOR CRASH GUARD BLACK
                            </h3>

                            <div className="product-card__price">
                                Rs. 3,990.00
                                <span>Rs. 4,870.00</span>
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