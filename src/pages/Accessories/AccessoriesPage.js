import { useMemo, useState } from "react";
import "./AccessoriesPage.css";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../components/AuthModal/useAuthModal";
import { useCollection } from "../../hooks/useFirestore";
import { COLLECTIONS } from "../../services/firebase";
import { addToCart, saveWishlistItem } from "../../services/commerceService";
import { normalizeBrand, normalizeCategory, normalizeProduct } from "../../services/normalizers";
import AccessoriesHeader from "./accessoriesNav/AccessoriesHeader";

const productFilters = ["All", "Best Seller", "New Arrival", "Trending", "Deals"];

function CartIcon({ color = "#000" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 10a4 4 0 0 1-8 0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 10 18" fill="none">
      <path d="M9 17L1 9L9 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 10 18" fill="none">
      <path d="M1 17L9 9L1 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 16 14" width="25" fill="none">
      <path d="M1 7H15M9 1L15 7L9 13" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <line x1="4" y1="6" x2="20" y2="6" stroke="#000" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="#000" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="18" x2="20" y2="18" stroke="#000" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="6" r="2" fill="#f6f8fb" stroke="#000" strokeWidth="2" />
      <circle cx="15" cy="12" r="2" fill="#f6f8fb" stroke="#000" strokeWidth="2" />
      <circle cx="9" cy="18" r="2" fill="#f6f8fb" stroke="#000" strokeWidth="2" />
    </svg>
  );
}

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
    setLiked((previous) => !previous);
    if (!user) return openLogin();
    await saveWishlistItem({ userId: user.uid, product });
  };

  return (
    <Link className="ap-product-card" to={`/product/${product.id}`}>
      <div className="ap-product-card__image">
        {product.image ? <img src={product.image} alt={product.name} /> : <span>No image</span>}
        <button className={`ap-product-card__heart${liked ? " ap-product-card__heart--liked" : ""}`} onClick={handleWishlist} aria-label="Save product">
          <HeartIcon />
        </button>
      </div>
      <div className="ap-product-card__info">
        <div className="ap-product-card__top-row">
          <span className="ap-product-card__category">{product.category || product.brand || "Accessory"}</span>
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

function EmptyState({ title, text }) {
  return (
    <div className="nx-empty-state nx-empty-state--light">
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export default function AccessoriesPage() {
  const productsQuery = useCollection(COLLECTIONS.products, { limit: 100 });
  const categoriesQuery = useCollection(COLLECTIONS.categories, { limit: 24 });
  const brandsQuery = useCollection(COLLECTIONS.brands, { limit: 24 });
  const bannersQuery = useCollection(COLLECTIONS.banners, { limit: 5 });
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const liveProducts = useMemo(
    () =>
      productsQuery.data
        .map(normalizeProduct)
        .filter((product) => ["published", "active", "approved"].includes(product.status)),
    [productsQuery.data]
  );
  const displayCategories = useMemo(() => categoriesQuery.data.map(normalizeCategory), [categoriesQuery.data]);
  const displayBrands = useMemo(() => brandsQuery.data.map(normalizeBrand), [brandsQuery.data]);
  const heroBanner = bannersQuery.data[0];

  const filteredProducts = liveProducts.filter((product) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      [product.name, product.category, product.brand, product.description]
        .some((value) => String(value || "").toLowerCase().includes(term));
    if (!matchesSearch) return false;
    if (activeFilter === "Best Seller") return product.bestSeller || product.isBestSeller;
    if (activeFilter === "New Arrival") return product.newArrival || product.isNewArrival;
    if (activeFilter === "Trending") return product.trending || product.isTrending;
    if (activeFilter === "Deals") return product.offerPrice && product.price && product.offerPrice < product.price;
    return true;
  });

  const bikeCollections = displayCategories.filter((category) => category.compatibility || category.bikeModel).slice(0, 4);

  return (
    <div className="ap-page">
      <AccessoriesHeader search={search} onSearchChange={setSearch} />

      {(heroBanner?.image || heroBanner?.imageUrl) && (
        <div className="ap-hero">
          <div className="ap-hero__image-slot">
            <img src={heroBanner.image || heroBanner.imageUrl} alt={heroBanner.title || "Nitroxx accessories"} />
          </div>
        </div>
      )}

      {displayCategories.length > 0 && (
        <div className="ap-section">
          <h2 className="ap-section__title">SHOP BY CATEGORY</h2>
          <div className="ap-category-slider">
            <button className="ap-category-slider__btn" aria-label="Previous"><ChevronLeftIcon /></button>
            <div className="ap-category-track">
              {displayCategories.map((cat) => (
                <Link to={`/category/${cat.id}`} key={cat.id} className="ap-cat-card">
                  <div className="ap-cat-card__image-bg">
                    {cat.image ? <img src={cat.image} alt={cat.label} /> : <span>{cat.label}</span>}
                  </div>
                  <span className="ap-cat-card__label">{cat.label}</span>
                </Link>
              ))}
            </div>
            <button className="ap-category-slider__btn" aria-label="Next"><ChevronRightIcon /></button>
          </div>
        </div>
      )}

      {bikeCollections.length > 0 && (
        <div className="ap-section">
          <h2 className="ap-section__title">SHOP BY BIKE</h2>
          <div className="ap-bike-grid">
            {bikeCollections.map((bike) => (
              <Link key={bike.id} to={`/category/${bike.id}`} className="ap-bike-card">
                <div className="ap-bike-card__circle">
                  <div className="ap-bike-card__inner">
                    {bike.image ? <img src={bike.image} alt={bike.label} /> : <span>{bike.label}</span>}
                  </div>
                </div>
                <span className="ap-bike-card__label">{bike.label}</span>
                <div className="ap-bike-arrow">Shop now <ArrowRightIcon /></div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {displayBrands.length > 0 && (
        <div className="ap-section">
          <h2 className="ap-section__title">SHOP BY BRAND</h2>
          <div className="ap-brand-grid">
            {displayBrands.map((brand) => (
              <Link to={`/brand/${brand.id}`} key={brand.id} className="ap-brand-card">
                <div className="ap-brand-card__box">
                  {brand.image ? <img src={brand.image} alt={brand.label} /> : <span>{brand.label}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="ap-section">
        <h1 className="ap-shop-title">Shop</h1>
        <div className="ap-filters" style={{ marginTop: "20px" }}>
          <button className="ap-filter-btn"><SlidersIcon /> Filters</button>
          {productFilters.map((filter) => (
            <button
              key={filter}
              className={`ap-filter-btn${activeFilter === filter ? " ap-filter-btn--active" : ""}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        {productsQuery.loading ? (
          <EmptyState title="Loading products" text="Fetching live accessories from Firestore." />
        ) : filteredProducts.length > 0 ? (
          <div className="ap-products-grid">
            {filteredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <EmptyState
            title={liveProducts.length ? "No matching products" : "No live products yet"}
            text={liveProducts.length ? "Try another search or collection filter." : "Publish products from the Accessories Dashboard and they will appear here automatically."}
          />
        )}
      </div>
    </div>
  );
}
