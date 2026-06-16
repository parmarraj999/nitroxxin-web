import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';

const brands = [
  {
    id: 1,
    name: "Zana Motorcycles",
    logo: "/brands/zana.png",
    slug: "zana-motorcycles",
  },
  {
    id: 2,
    name: "Moto Torque",
    logo: "/brands/moto-torque.png",
    slug: "moto-torque",
  },
  {
    id: 3,
    name: "Bandidos Pitstop",
    logo: "/brands/bandidos.png",
    slug: "bandidos-pitstop",
  },
  {
    id: 4,
    name: "Carbon Racing",
    logo: "/brands/carbon-racing.png",
    slug: "carbon-racing",
  },
  {
    id: 5,
    name: "HJG",
    logo: "/brands/hjg.png",
    slug: "hjg",
  },
  {
    id: 6,
    name: "Rynox",
    logo: "/brands/rynox.png",
    slug: "rynox",
  },
  {
    id: 7,
    name: "Viaterra",
    logo: "/brands/viaterra.png",
    slug: "viaterra",
  },
  {
    id: 8,
    name: "Studds",
    logo: "/brands/studds.png",
    slug: "studds",
  },
  {
    id: 9,
    name: "SMK Helmets",
    logo: "/brands/smk.png",
    slug: "smk-helmets",
  },
  {
    id: 10,
    name: "Axor",
    logo: "/brands/axor.png",
    slug: "axor",
  },
  {
    id: 11,
    name: "Raida",
    logo: "/brands/raida.png",
    slug: "raida",
  },
  {
    id: 12,
    name: "Autologue Design",
    logo: "/brands/autologue.png",
    slug: "autologue-design",
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

const BrandPage = () => {
  const navLinks = ["Rider Wear", "Tech & Gadget", "Performance", "Helmets", "Bike Accessories"];
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  return (
    <section className="collection-page">
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
      <div className="collection-page__container">


        <div className="collection-page__breadcrumb">
          <span>Home</span>
          <span>•</span>
          <span>Collections</span>
        </div>

        <h1 className="collection-page__title">
          SHOP BY BRANDS
        </h1>

        <div className="collection-page__grid">
          {brands.map((brand) => (
            <Link
              to={`/accessories/products`}
              key={brand.id}
              className="collection-page__card"
            >
              <div className="collection-page__image-wrapper">
                <img
                  src={brand.image}
                  alt={brand.name}
                  className="collection-page__image"
                />
              </div>

              <h3 className="collection-page__name">
                {brand.name}
              </h3>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}

export default BrandPage