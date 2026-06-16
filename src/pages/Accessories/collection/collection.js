import { useState } from "react";
import "./collection.css";

const brands = [
  {
    id: 1,
    name: "ROYAL ENFIELD",
    image: "/images/royal-enfield.png",
  },
  {
    id: 2,
    name: "KTM",
    image: "/images/hero.png",
  },
  {
    id: 3,
    name: "SUZUKI",
    image: "/images/triumph.png",
  },
  {
    id: 4,
    name: "TRIUMPH",
    image: "/images/honda.png",
  },
  {
    id: 5,
    name: "HARLEY DAVIDSON",
    image: "/images/yamaha.png",
  },
  {
    id: 6,
    name: "TVS",
    image: "/images/ktm.png",
  },
  {
    id: 7,
    name: "YAMAHA",
    image: "/images/bajaj.png",
  },
  {
    id: 8,
    name: "KAWASAKI",
    image: "/images/kawasaki.png",
  },
  {
    id: 9,
    name: "BAJAJ",
    image: "/images/kawasaki.png",
  },
  {
    id: 10,
    name: "BMW",
    image: "/images/kawasaki.png",
  },
  {
    id: 11,
    name: "HERO",
    image: "/images/kawasaki.png",
  },
  {
    id: 12,
    name: "HONDA",
    image: "/images/kawasaki.png",
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

export default function CollectionPage() {

  const navLinks = ["Rider Wear", "Tech & Gadget", "Performance", "Helmets", "Bike Accessories"];
   const [search, setSearch] = useState("");

  return (
    <section className="collection-page">
        <header className="ap-header">
          {/* Logo */}
          <div className="ap-header__logo">
            NITRO<span>X</span><span className="ap-header__logo-suffix">X</span>
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
          SHOP BY BIKE
        </h1>

        <div className="collection-page__grid">
          {brands.map((brand) => (
            <div
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
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}