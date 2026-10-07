import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { useAccessoriesContext } from "../../../context/AccessoriesContext";
import { useAuth } from "../../../context/AuthContext";
import { useAuthModal } from "../../../components/AuthModal/useAuthModal";
import { addToCart, saveWishlistItem } from "../../../services/commerceService";
import AccessoriesHeader from "../accessoriesNav/AccessoriesHeader";
import "./ShopPage.css";

const productFilters = ["All", "Best Seller", "New Arrival", "Trending", "Deals"];

function CartIcon({ color = "#fff" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M16 10a4 4 0 0 1-8 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="6" r="2" fill="#f6f8fb" stroke="currentColor" strokeWidth="2" />
      <circle cx="15" cy="12" r="2" fill="#f6f8fb" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="18" r="2" fill="#f6f8fb" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ProductCard({ product }) {
  const [liked, setLiked] = useState(false);
  const [adding, setAdding] = useState(false);
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  const handleCart = async (event) => {
    event.preventDefault();
    if (!user) return openLogin();
    try {
      setAdding(true);
      await addToCart({ userId: user.uid, product, quantity: 1 });
      setTimeout(() => setAdding(false), 800);
    } catch (err) {
      setAdding(false);
      console.error(err);
    }
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
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" />
        ) : (
          <span>No image</span>
        )}
        <button
          className={`ap-product-card__heart${liked ? " ap-product-card__heart--liked" : ""}`}
          onClick={handleWishlist}
          aria-label="Save product"
        >
          <HeartIcon />
        </button>
      </div>
      <div className="ap-product-card__info">
        <div className="ap-product-card__top-row">
          <span className="ap-product-card__category">
            {product.category || product.brand || "Accessory"}
          </span>
          <span className="ap-product-card__price">
            {product.offerPriceText || product.priceText || (product.price ? `₹${Number(product.price).toLocaleString("en-IN")}` : "—")}
          </span>
        </div>
        <div className="ap-product-card__name">{product.name}</div>
        <button className="ap-product-card__cart-btn" onClick={handleCart}>
          <CartIcon color="#fff" />
          {adding ? "Added!" : "Add to Cart"}
        </button>
      </div>
    </Link>
  );
}

function EmptyState({ title, text, onReset }) {
  return (
    <div className="nx-empty-state nx-empty-state--light">
      <h3>{title}</h3>
      <p>{text}</p>
      {onReset && (
        <button
          type="button"
          className="ap-filter-btn"
          onClick={onReset}
          style={{ margin: "16px auto 0" }}
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

export default function ShopPage({ filterType }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { id } = useParams();

  // Resolve URL parameters
  const urlSearch = searchParams.get("search") || searchParams.get("q") || "";
  const urlCategory = searchParams.get("category") || (filterType === "category" ? id : "") || "";
  const urlSubcategory = searchParams.get("subcategory") || "";
  const urlBrand = searchParams.get("brand") || (filterType === "brand" ? id : "") || "";
  const urlBike = searchParams.get("bike") || (filterType === "bike" ? id : "") || "";
  const urlSort = searchParams.get("sort") || "newest";

  const {
    products = [],
    productsLoading,
    fetchMoreProducts,
    hasMore,
    loadingMore,
    categories = [],
    subcategories = [],
    brands = [],
  } = useAccessoriesContext();

  const [search, setSearch] = useState(urlSearch || urlBike);
  const [activeFilter, setActiveFilter] = useState("All");
  const [availability, setAvailability] = useState({ inStock: false, outOfStock: false });
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedCategories, setSelectedCategories] = useState(urlCategory ? [urlCategory] : []);
  const [selectedSubcategories, setSelectedSubcategories] = useState(urlSubcategory ? [urlSubcategory] : []);
  const [selectedBrands, setSelectedBrands] = useState(urlBrand ? [urlBrand] : []);
  const [sortBy, setSortBy] = useState(urlSort);
  const [boundsSet, setBoundsSet] = useState(false);

  // Sync state whenever URL query params change
  useEffect(() => {
    if (urlCategory) {
      setSelectedCategories([urlCategory]);
    }
  }, [urlCategory]);

  useEffect(() => {
    if (urlSubcategory) {
      setSelectedSubcategories([urlSubcategory]);
    }
  }, [urlSubcategory]);

  useEffect(() => {
    if (urlBrand) {
      setSelectedBrands([urlBrand]);
    }
  }, [urlBrand]);

  useEffect(() => {
    if (urlSearch || urlBike) {
      setSearch(urlSearch || urlBike);
    }
  }, [urlSearch, urlBike]);

  useEffect(() => {
    if (urlSort) {
      setSortBy(urlSort);
    }
  }, [urlSort]);

  const PRODUCTS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const shopMainRef = useRef(null);

  // Sidebar filter states - default open on desktop
  const [filterOpen, setFilterOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth > 1024;
    }
    return true;
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setFilterOpen(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const liveProducts = useMemo(
    () => products.filter((product) => ["published", "active", "approved"].includes(product.status)),
    [products]
  );

  // Price bounds from live products
  const priceBounds = useMemo(() => {
    if (!liveProducts.length) return [0, 100000];
    const prices = liveProducts.map((p) => Number(p.offerPrice || p.price || 0)).filter(Boolean);
    return prices.length ? [Math.min(...prices), Math.max(...prices)] : [0, 100000];
  }, [liveProducts]);

  useEffect(() => {
    if (!boundsSet && liveProducts.length > 0) {
      setPriceRange(priceBounds);
      setBoundsSet(true);
    }
  }, [liveProducts, priceBounds, boundsSet]);

  // Unique categories, subcategories & brands from products + context collections
  const categoryOptions = useMemo(() => {
    const fromProducts = liveProducts.map((p) => p.category || p.categoryName).filter(Boolean);
    const fromContext = categories.map((c) => c.label || c.name).filter(Boolean);
    return [...new Set([...fromProducts, ...fromContext])].sort();
  }, [liveProducts, categories]);

  const subcategoryOptions = useMemo(() => {
    const fromProducts = liveProducts.map((p) => p.subcategory || p.subCategory).filter(Boolean);
    const fromSubcats = subcategories.map((s) => s.label || s.name).filter(Boolean);
    return [...new Set([...fromProducts, ...fromSubcats])].sort();
  }, [liveProducts, subcategories]);

  const brandOptions = useMemo(() => {
    const fromProducts = liveProducts.map((p) => p.brand || p.brandName).filter(Boolean);
    const fromContext = brands.map((b) => b.label || b.name).filter(Boolean);
    return [...new Set([...fromProducts, ...fromContext])].sort();
  }, [liveProducts, brands]);

  // Active filter badge count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (availability.inStock || availability.outOfStock) count++;
    if (priceRange[0] !== priceBounds[0] || priceRange[1] !== priceBounds[1]) count++;
    if (selectedCategories.length) count += selectedCategories.length;
    if (selectedSubcategories.length) count += selectedSubcategories.length;
    if (selectedBrands.length) count += selectedBrands.length;
    if (search.trim()) count++;
    if (activeFilter !== "All") count++;
    return count;
  }, [availability, priceRange, priceBounds, selectedCategories, selectedSubcategories, selectedBrands, search, activeFilter]);

  const toggleCategory = (cat) =>
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );

  const toggleSubcategory = (subcat) =>
    setSelectedSubcategories((prev) =>
      prev.includes(subcat) ? prev.filter((s) => s !== subcat) : [...prev, subcat]
    );

  const toggleBrand = (brand) =>
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );

  const resetAll = () => {
    setAvailability({ inStock: false, outOfStock: false });
    setPriceRange(priceBounds);
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedBrands([]);
    setActiveFilter("All");
    setSearch("");
    setSearchParams({});
  };

  const formatPrice = (val) => `₹${Number(val).toLocaleString("en-IN")}`;

  // Apply all filters
  const filteredProducts = useMemo(() => {
    let result = liveProducts;

    // Search query
    const term = search.trim().toLowerCase();
    if (term) {
      const words = term.split(/\s+/).filter(Boolean);
      result = result.filter((product) => {
        const searchable = [
          product.name,
          product.title,
          product.category,
          product.categoryName,
          product.subcategory,
          product.subCategory,
          product.brand,
          product.brandName,
          product.vendorName,
          product.manufacturer,
          product.subtitle,
          product.shortDescription,
          product.description,
          product.bikeModel,
          product.model,
          product.compatibility,
          product.bikeBrand,
          ...(Array.isArray(product.keywords) ? product.keywords : []),
          ...(Array.isArray(product.tags) ? product.tags : []),
          ...(Array.isArray(product.seo?.keywords) ? product.seo.keywords : []),
          ...(Array.isArray(product.seo?.tags) ? product.seo.tags : []),
        ]
          .map((value) => String(value || "").toLowerCase())
          .join(" ");

        return words.every((w) => searchable.includes(w));
      });
    }

    // Bike model / brand
    if (urlBike) {
      const bikeLower = urlBike.toLowerCase();
      result = result.filter((p) => {
        const text = [p.bikeModel, p.model, p.compatibility, p.bikeBrand, p.name].join(" ").toLowerCase();
        return text.includes(bikeLower);
      });
    }

    // Quick filter tabs
    if (activeFilter === "Best Seller") result = result.filter((p) => p.bestSeller || p.isBestSeller);
    if (activeFilter === "New Arrival") result = result.filter((p) => p.newArrival || p.isNewArrival);
    if (activeFilter === "Trending") result = result.filter((p) => p.trending || p.isTrending);
    if (activeFilter === "Deals") result = result.filter((p) => p.offerPrice && p.price && p.offerPrice < p.price);

    // Availability
    if (availability.inStock || availability.outOfStock) {
      result = result.filter((p) => {
        const inStock = Number(p.stock || 0) > 0;
        if (availability.inStock && availability.outOfStock) return true;
        if (availability.inStock) return inStock;
        if (availability.outOfStock) return !inStock;
        return true;
      });
    }

    // Price range
    result = result.filter((p) => {
      const price = Number(p.offerPrice || p.price || 0);
      if (price <= 0) return true;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Categories
    if (selectedCategories.length) {
      result = result.filter((p) => {
        const pCat = String(p.category || p.categoryName || "").toLowerCase().replace(/[-_]/g, " ").trim();
        return selectedCategories.some((sel) => {
          const selNorm = String(sel || "").toLowerCase().replace(/[-_]/g, " ").trim();
          return pCat === selNorm || pCat.includes(selNorm) || selNorm.includes(pCat);
        });
      });
    }

    // Subcategories
    if (selectedSubcategories.length) {
      result = result.filter((p) => {
        const prodSub = String(p.subcategory || p.subCategory || "").toLowerCase().replace(/[-_]/g, " ").trim();
        return selectedSubcategories.some((sel) => {
          const selSub = String(sel || "").toLowerCase().replace(/[-_]/g, " ").trim();
          return (
            prodSub === selSub ||
            prodSub === `${selSub}s` ||
            selSub === `${prodSub}s` ||
            prodSub.includes(selSub) ||
            selSub.includes(prodSub)
          );
        });
      });
    }

    // Brands
    if (selectedBrands.length) {
      result = result.filter((p) => {
        const prodBrand = String(p.brand || p.brandName || "").toLowerCase().replace(/[-_]/g, " ").trim();
        return selectedBrands.some((sel) => {
          const selBrand = String(sel || "").toLowerCase().replace(/[-_]/g, " ").trim();
          return prodBrand === selBrand || prodBrand.includes(selBrand) || selBrand.includes(prodBrand);
        });
      });
    }

    // Sort
    result = [...result];
    if (sortBy === "price-asc") {
      result.sort((a, b) => Number(a.offerPrice || a.price || 0) - Number(b.offerPrice || b.price || 0));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => Number(b.offerPrice || b.price || 0) - Number(a.offerPrice || a.price || 0));
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    return result;
  }, [
    liveProducts,
    search,
    urlBike,
    activeFilter,
    availability,
    priceRange,
    selectedCategories,
    selectedSubcategories,
    selectedBrands,
    sortBy,
  ]);

  // Reset to page 1 when any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilter, availability, priceRange, selectedCategories, selectedSubcategories, selectedBrands, sortBy]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = Math.min(startIndex + PRODUCTS_PER_PAGE, filteredProducts.length);
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, startIndex, endIndex]);

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setCurrentPage(newPage);

    if (newPage * PRODUCTS_PER_PAGE >= products.length && hasMore && fetchMoreProducts) {
      fetchMoreProducts();
    }

    if (shopMainRef.current) {
      shopMainRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Generate page numbers with ellipses
  const pageNumbers = useMemo(() => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="sp-page ap-page">
      <AccessoriesHeader
        showBack
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
        }}
      />

      {/* ═══ SHOP SECTION with exact Accessories Page UI ═══ */}
      <div className="ap-section ap-shop-section">
        <h1 className="ap-shop-title">{search}</h1>
        <p style={{fontSize:'16',fontWeight:'600',color:"grey",paddingBottom:'25px'}}><span style={{color:"black"}}>{filteredProducts.length}</span> Result Found</p>

        {/* Topbar: filter toggle + quick tabs + sort */}
        <div className="ap-shop-topbar">
          <div className="ap-shop-topbar__left">
            <button
              className={`ap-filter-toggle${filterOpen ? " ap-filter-toggle--active" : ""}`}
              onClick={() => setFilterOpen((p) => !p)}
            >
              <SlidersIcon />
              Filters
              {activeFilterCount > 0 && <span className="ap-filter-badge">{activeFilterCount}</span>}
            </button>
            <div className="ap-quick-filters">
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
            <span className="ap-product-count">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="ap-shop-sort">
            <label htmlFor="ap-sort-select">Sort by</label>
            <select
              id="ap-sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
              }}
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A–Z</option>
            </select>
          </div>
        </div>

        {/* Layout: sidebar + 4-column product grid */}
        <div className="ap-shop-layout">
          {/* ─── Filter Sidebar ─── */}
          <aside className={`ap-sidebar${filterOpen ? " ap-sidebar--open" : ""}`}>
            <div className="ap-sidebar__header">
              <span className="ap-sidebar__title">Filters</span>
              <div className="ap-sidebar__actions">
                {activeFilterCount > 0 && (
                  <button className="ap-sidebar__reset" onClick={resetAll}>
                    Clear all
                  </button>
                )}
                <button
                  className="ap-sidebar__close"
                  onClick={() => setFilterOpen(false)}
                  aria-label="Close filters"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Availability */}
            <div className="ap-filter-group">
              <div className="ap-filter-group__label">Availability</div>
              <label className="ap-checkbox">
                <input
                  type="checkbox"
                  checked={availability.inStock}
                  onChange={(e) => setAvailability((a) => ({ ...a, inStock: e.target.checked }))}
                />
                <span>In Stock</span>
              </label>
              <label className="ap-checkbox">
                <input
                  type="checkbox"
                  checked={availability.outOfStock}
                  onChange={(e) => setAvailability((a) => ({ ...a, outOfStock: e.target.checked }))}
                />
                <span>Out of Stock</span>
              </label>
            </div>

            {/* Price Range */}
            <div className="ap-filter-group">
              <div className="ap-filter-group__label">Price Range</div>
              <div className="ap-price-display">
                <span>{formatPrice(priceRange[0])}</span>
                <span>—</span>
                <span>{formatPrice(priceRange[1])}</span>
              </div>
              <div className="ap-price-sliders">
                <input
                  type="range"
                  className="ap-slider"
                  min={priceBounds[0]}
                  max={priceBounds[1]}
                  value={priceRange[0]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val <= priceRange[1]) setPriceRange([val, priceRange[1]]);
                  }}
                />
                <input
                  type="range"
                  className="ap-slider"
                  min={priceBounds[0]}
                  max={priceBounds[1]}
                  value={priceRange[1]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val >= priceRange[0]) setPriceRange([priceRange[0], val]);
                  }}
                />
              </div>
              {(priceRange[0] !== priceBounds[0] || priceRange[1] !== priceBounds[1]) && (
                <button className="ap-filter-reset-link" onClick={() => setPriceRange(priceBounds)}>
                  Reset price
                </button>
              )}
            </div>

            {/* Categories */}
            {categoryOptions.length > 0 && (
              <div className="ap-filter-group">
                <div className="ap-filter-group__label">Category</div>
                <div className="ap-filter-scroll">
                  {categoryOptions.map((cat) => (
                    <label key={cat} className="ap-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
                {selectedCategories.length > 0 && (
                  <button className="ap-filter-reset-link" onClick={() => setSelectedCategories([])}>
                    Reset
                  </button>
                )}
              </div>
            )}

            {/* Sub Categories */}
            {subcategoryOptions.length > 0 && (
              <div className="ap-filter-group">
                <div className="ap-filter-group__label">Sub Category</div>
                <div className="ap-filter-scroll">
                  {subcategoryOptions.map((subcat) => (
                    <label key={subcat} className="ap-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedSubcategories.includes(subcat)}
                        onChange={() => toggleSubcategory(subcat)}
                      />
                      <span>{subcat}</span>
                    </label>
                  ))}
                </div>
                {selectedSubcategories.length > 0 && (
                  <button
                    className="ap-filter-reset-link"
                    onClick={() => setSelectedSubcategories([])}
                  >
                    Reset
                  </button>
                )}
              </div>
            )}

            {/* Brands */}
            {brandOptions.length > 0 && (
              <div className="ap-filter-group">
                <div className="ap-filter-group__label">Brand</div>
                <div className="ap-filter-scroll">
                  {brandOptions.map((brand) => (
                    <label key={brand} className="ap-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(brand)}
                        onChange={() => toggleBrand(brand)}
                      />
                      <span>{brand}</span>
                    </label>
                  ))}
                </div>
                {selectedBrands.length > 0 && (
                  <button className="ap-filter-reset-link" onClick={() => setSelectedBrands([])}>
                    Reset
                  </button>
                )}
              </div>
            )}
          </aside>

          {/* ─── 4-Column Product Grid with 20-Product Pagination ─── */}
          <main className="ap-shop-main" ref={shopMainRef}>
            {productsLoading ? (
              <EmptyState title="Loading products" text="Fetching live accessories from catalog." />
            ) : filteredProducts.length > 0 ? (
              <>
                <div
                  className={`ap-products-grid ap-products-grid--4col${
                    filterOpen ? " ap-products-grid--with-sidebar" : ""
                  }`}
                >
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="sp-pagination">
                  <div className="sp-pagination__info">
                    Showing <strong>{startIndex + 1}–{endIndex}</strong> of{" "}
                    <strong>{filteredProducts.length}</strong> products
                  </div>

                  <div className="sp-pagination__controls">
                    <button
                      type="button"
                      className="sp-page-btn sp-page-btn--prev"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                      <span>Previous</span>
                    </button>

                    <div className="sp-pagination__numbers">
                      {pageNumbers.map((p, idx) =>
                        p === "..." ? (
                          <span key={`ellipsis-${idx}`} className="sp-page-ellipsis">
                            …
                          </span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            className={`sp-page-num${p === currentPage ? " is-active" : ""}`}
                            onClick={() => handlePageChange(p)}
                          >
                            {p}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      type="button"
                      className="sp-page-btn sp-page-btn--next"
                      disabled={currentPage === totalPages && !hasMore}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      <span>Next</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </button>
                  </div>

                  {loadingMore && (
                    <div className="sp-loading-more-indicator">
                      <span>Loading next 20 products from catalog…</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <EmptyState
                title={liveProducts.length ? "No matching products" : "No live products yet"}
                text={
                  liveProducts.length
                    ? "Try adjusting your filters or search term."
                    : "Publish products from the Accessories Dashboard and they will appear here automatically."
                }
                onReset={activeFilterCount > 0 ? resetAll : undefined}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
