import { useState } from "react";
import "./bikeBrandPage.css";
import { Link, useNavigate } from "react-router-dom";

const bikes = [
    {
        id: 1,
        name: "XPULSE 210",
        image: "/images/xpulse210.png",
    },
    {
        id: 2,
        name: "MAVRICK 440",
        image: "/images/mavrick440.png",
    },
    {
        id: 3,
        name: "XPULSE 200",
        image: "/images/xpulse200.png",
    },
];

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

export default function BikeBrandPage() {

    const navLinks = ["Rider Wear", "Tech & Gadget", "Performance", "Helmets", "Bike Accessories"];
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    return (
        <section className="brand-page">
            <header className="ap-header">
                {/* Logo */}
                 <div onClick={()=>navigate(-1)} style={{width:'30px',height:'50px',display:'flex',alignItems:'center',justifyContent:'center',cursor:"pointer"}}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-left-icon lucide-arrow-left"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
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
            <div className="brand-page__container">
                <div className="brand-page__banner">

                    {/* Replace with image later */}
                    <div className="brand-page__banner-image"></div>

                    <div className="brand-page__overlay">
                        <h1 className="brand-page__title">HERO</h1>
                    </div>
                </div>

                <div className="brand-page__grid">
                    {bikes.map((bike) => (
                        <Link
                       
                            key={bike.id}
                            className="brand-page__card"
                        >
                            <div className="brand-page__image-box">
                                {/* Replace with actual image */}
                                <img
                                    src={bike.image}
                                    alt={bike.name}
                                    className="brand-page__bike-image"
                                />
                            </div>

                            <h3 className="brand-page__bike-name">
                                {bike.name}
                            </h3>
                        </Link>
                    ))}
                </div>

            </div>
        </section>
    );
}