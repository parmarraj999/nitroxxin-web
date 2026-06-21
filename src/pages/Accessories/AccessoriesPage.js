import { useState } from "react";
import "./AccessoriesPage.css";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../components/AuthModal/useAuthModal";
import { useCollection } from "../../hooks/useFirestore";
import { COLLECTIONS } from "../../services/firebase";
import { addToCart, saveWishlistItem } from "../../services/commerceService";
import { normalizeBrand, normalizeCategory, normalizeProduct } from "../../services/normalizers";
import AccessoriesHeader from "./accessoriesNav/AccessoriesHeader";

/* ── DATA ── */

const categoryItems = [
  { id: 1, label: "Rider Wear" },
  { id: 2, label: "Helmets" },
  { id: 3, label: "Rider Wear" },
  { id: 4, label: "Accessories" },
  { id: 5, label: "Accessories" },
];

const bikeItems = [
  { id: 1, label: "kawasaki" },
  { id: 2, label: "kawasaki" },
  { id: 3, label: "kawasaki" },
  { id: 4, label: "kawasaki" },
];

const brandItems = [
  { id: 1, label: "Alpinestars" },
  { id: 2, label: "Rubber" },
  { id: 3, label: "RST" },
  { id: 4, label: "Studds" },
];

const products = [
  { id: 1, category: "Rider Wear", name: "Leather Jacket", price: "$1200" },
  { id: 2, category: "Rider Wear", name: "Leather Jacket", price: "$1200" },
  { id: 3, category: "Rider Wear", name: "Leather Jacket", price: "$1200" },
  { id: 4, category: "Rider Wear", name: "Leather Jacket", price: "$1200" },
  { id: 5, category: "Rider Wear", name: "Leather Jacket", price: "$1200" },
  { id: 6, category: "Rider Wear", name: "Leather Jacket", price: "$1200" },
  { id: 7, category: "Rider Wear", name: "Leather Jacket", price: "$1200" },
  { id: 8, category: "Rider Wear", name: "Leather Jacket", price: "$1200" },
];

const navLinks = ["Rider Wear", "Tech & Gadget", "Performance", "Helmets", "Bike Accessories"];
const timeFilters = ["Today", "Tommorow", "Upcoming", "Ongoing"];

/* ── ICONS ── */

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

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 17L1 9L9 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 10 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 17L9 9L1 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 16 14" width='25' fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 7H15M9 1L15 7L9 13" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="4" y1="6" x2="20" y2="6" stroke="#000" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="#000" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="18" x2="20" y2="18" stroke="#000" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="6" r="2" fill="#f6f8fb" stroke="#000" strokeWidth="2" />
      <circle cx="15" cy="12" r="2" fill="#f6f8fb" stroke="#000" strokeWidth="2" />
      <circle cx="9" cy="18" r="2" fill="#f6f8fb" stroke="#000" strokeWidth="2" />
    </svg>
  );
}

/* ── PRODUCT CARD ── */

function ProductCard({ product }) {
  const [liked, setLiked] = useState(false);
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  const handleCart = async (event) => {
    event.preventDefault();
    if (!user) return openLogin();
    await addToCart({ userId: user.uid, product, quantity: 1 });
  };

  const handleWishlist = async (event) => {
    event.preventDefault();
    setLiked((p) => !p);
    if (!user) return openLogin();
    await saveWishlistItem({ userId: user.uid, product });
  };

  return (
    <Link className="ap-product-card" to={`/product/${product.id}`}>
      <div className="ap-product-card__image">
        {product.image ? <img src={product.image} alt={product.name} /> : <span>Image</span>}
        <button
          className={`ap-product-card__heart${liked ? " ap-product-card__heart--liked" : ""}`}
          onClick={handleWishlist}
          aria-label="Like"
        >
          <HeartIcon />
        </button>
      </div>

      <div className="ap-product-card__info">
        <div className="ap-product-card__top-row">
          <span className="ap-product-card__category">{product.category}</span>
          <span className="ap-product-card__price">{product.offerPriceText || product.priceText || product.price}</span>
        </div>
        <div className="ap-product-card__name">{product.name}</div>
        <button className="ap-product-card__cart-btn" onClick={handleCart}>
          <CartIcon color="#fff" />
          Add to Cart
        </button>
      </div>
    </Link>
  );
}

/* ── MAIN PAGE ── */

export default function AccessoriesPage() {
  const productsQuery = useCollection(COLLECTIONS.products, { limit: 50 });
  const categoriesQuery = useCollection(COLLECTIONS.categories, { limit: 12 });
  const brandsQuery = useCollection(COLLECTIONS.brands, { limit: 12 });
  const bannersQuery = useCollection(COLLECTIONS.banners, { limit: 5 });
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("Today");
  const liveProducts = productsQuery.data.map(normalizeProduct);
  const liveCategories = categoriesQuery.data.map(normalizeCategory);
  const liveBrands = brandsQuery.data.map(normalizeBrand);
  const displayProducts = liveProducts.length ? liveProducts : products;
  const displayCategories = liveCategories.length ? liveCategories : categoryItems;
  const displayBrands = liveBrands.length ? liveBrands : brandItems;
  const heroBanner = bannersQuery.data[0];

  const filteredProducts = displayProducts.filter(
    (p) =>
      !search.trim() ||
      String(p.name).toLowerCase().includes(search.toLowerCase()) ||
      String(p.category).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ap-page">

      {/* ── HEADER ── */}
      <AccessoriesHeader search={search} onSearchChange={setSearch} />

      {/* ── HERO BANNER ── */}
      <div className="ap-hero">
        <div className="ap-hero__image-slot">
          {heroBanner?.image || heroBanner?.imageUrl ? <img src={heroBanner.image || heroBanner.imageUrl} alt={heroBanner.title || "Banner"} /> : <span>Image</span>}
        </div>
        {/* <div className="ap-hero__overlay">
          <p className="ap-hero__subtitle">
            Shop high-quality riding gear, accessories &amp; smart gadgets for every rider
          </p>
          <button className="ap-hero__btn">Explore Accessories</button>
        </div> */}
      </div>

      {/* ── SHOP BY CATEGORY ── */}
      <div className="ap-section">
        <h2 className="ap-section__title">SHOP BY CATEGORY</h2>

        <div className="ap-category-slider">
          <button className="ap-category-slider__btn" aria-label="Previous">
            <ChevronLeftIcon />
          </button>

          <div className="ap-category-track">
            {displayCategories.map((cat) => (
              <Link to={`/category/${cat.id}`} key={cat.id} className="ap-cat-card">
                <div className="ap-cat-card__image-bg">
                  {cat.image ? <img src={cat.image} alt={cat.label} /> : <span>Image</span>}
                </div>
                <span className="ap-cat-card__label">{cat.label}</span>
              </Link>
            ))}
          </div>

          <button className="ap-category-slider__btn" aria-label="Next">
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {/* ── SHOP BY BIKE ── */}
      <div className="ap-section">
        <h2 className="ap-section__title">SHOP BY BIKE</h2>

        <div className="ap-bike-grid">
          {bikeItems.map((bike) => (
            <Link key={bike.id} to="/accessories/collection" className="ap-bike-card">
              <div className="ap-bike-card__circle">
                <div className="ap-bike-card__inner">
                  <span>Image</span>
                </div>
              </div>
              <span className="ap-bike-card__label">{bike.label}</span>
              <div className="ap-bike-arrow">
                Shop now <ArrowRightIcon />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── SHOP BY BRAND ── */}
      <div className="ap-section">
        <h2 className="ap-section__title">SHOP BY BRAND</h2>

        <div className="ap-brand-grid">
          {displayBrands.map((brand) => (
            <Link to={`/brand/${brand.id}`} key={brand.id} className="ap-brand-card">
              <div className="ap-brand-card__box">
                {brand.image ? <img src={brand.image} alt={brand.label} /> : <span>Image</span>}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── SHOP ── */}
      <div className="ap-section">
        <h1 className="ap-shop-title">Shop</h1>

        {/* Filters */}
        <div className="ap-filters" style={{ marginTop: "20px" }}>
          <button className="ap-filter-btn">
            <SlidersIcon /> Filters
          </button>
          {timeFilters.map((f) => (
            <button
              key={f}
              className={`ap-filter-btn${activeFilter === f ? " ap-filter-btn--active" : ""}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Product grid */}
        {filteredProducts.length > 0 ? (
          <div className="ap-products-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p style={{ color: "#979797", marginTop: "16px", fontFamily: "Inter" }}>
            No products match "{search}".
          </p>
        )}
      </div>

    </div>
  );
}
