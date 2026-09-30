import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { useAccessoriesContext } from '../../../context/AccessoriesContext';
import { useAuth } from '../../../context/AuthContext';
import { useAuthModal } from '../../../components/AuthModal/useAuthModal';
import { addToCart, saveWishlistItem } from '../../../services/commerceService';
import AccessoriesHeader from '../accessoriesNav/AccessoriesHeader';
import './ShopPage.css';

// ── Icons ──
function CartIcon({ color = '#fff' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <circle cx="9" cy="6" r="2" fill="#fff" stroke="currentColor" strokeWidth="2" />
      <circle cx="15" cy="12" r="2" fill="#fff" stroke="currentColor" strokeWidth="2" />
      <circle cx="9" cy="18" r="2" fill="#fff" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// ── EXACT Product Card Component from Accessories Page ──
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
          className={`ap-product-card__heart${liked ? ' ap-product-card__heart--liked' : ''}`}
          onClick={handleWishlist}
          aria-label="Save product"
        >
          <HeartIcon />
        </button>
      </div>
      <div className="ap-product-card__info">
        <div className="ap-product-card__top-row">
          <span className="ap-product-card__category">
            {product.category || product.brand || 'Accessory'}
          </span>
          <span className="ap-product-card__price">
            {product.offerPriceText || product.priceText || (product.price ? `₹${product.price}` : '—')}
          </span>
        </div>
        <div className="ap-product-card__name">{product.name}</div>
        <button className="ap-product-card__cart-btn" onClick={handleCart}>
          <CartIcon color="#fff" />
          {adding ? 'Added!' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}

// ── Fallback Subcategories map for quick pills ──
const FALLBACK_PILLS_MAP = {
  'rider wear': ['Riding Jackets', 'Riding Pants', 'Riding Boots', 'Armored Hoodies', 'Safety Vests', 'Rain Suits'],
  'helmets': ['Full Face Helmets', 'Modular & Flip-Up', 'Open Face Helmets', 'Off-Road Helmets', 'Visors & Pinlocks'],
  'bike accessories': ['Luggage & Bags', 'Crash Protection', 'Phone Mounts', 'Bike Covers', 'Security Locks', 'Handlebars'],
  'tech & gadget': ['Bluetooth Intercoms', 'Action Cameras', 'GPS Trackers', 'TPMS Monitors', 'Smart HUD'],
  'performance': ['Exhaust Systems', 'Air Filters', 'Brake Pads', 'Suspensions', 'Chains & Sprockets', 'Engine Oils'],
  'footwear': ['Casual Footwear', 'Performance Footwear', 'Indoor Footwear', 'Daily Footwear', 'Sandals', 'Boots'],
  'apparel': ['Jackets & Hoodies', 'T-Shirts & Tops', 'Pants & Jeans', 'Riding Apparel', 'Shorts', 'Tracksuits'],
};

export default function ShopPage({ filterType }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { id } = useParams();

  // Resolve URL parameters
  const queryCategory = searchParams.get('category') || (filterType === 'category' ? id : '') || '';
  const querySubcategory = searchParams.get('subcategory') || '';
  const querySearch = searchParams.get('search') || searchParams.get('q') || '';
  const queryBrand = searchParams.get('brand') || (filterType === 'brand' ? id : '') || '';
  const queryBike = searchParams.get('bike') || (filterType === 'bike' ? id : '') || '';
  const querySort = searchParams.get('sort') || 'newest';

  // Internal states synced with URL queries
  const [search, setSearch] = useState(querySearch);
  const [selectedSubcategory, setSelectedSubcategory] = useState(querySubcategory);
  const [selectedCategory, setSelectedCategory] = useState(queryCategory);
  const [selectedBrand, setSelectedBrand] = useState(queryBrand);
  const [sortBy, setSortBy] = useState(querySort);

  // Sidebar Filter States
  const [filterOpen, setFilterOpen] = useState(false);
  const [availability, setAvailability] = useState({ inStock: false, outOfStock: false });
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [boundsSet, setBoundsSet] = useState(false);

  const pillsTrackRef = useRef(null);

  // Sync state whenever URL query params change
  useEffect(() => {
    setSelectedCategory(queryCategory);
    setSelectedSubcategory(querySubcategory);
    setSearch(querySearch);
    setSelectedBrand(queryBrand);
    setSortBy(querySort);
  }, [queryCategory, querySubcategory, querySearch, queryBrand, querySort]);

  // Context data
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

  const PRODUCTS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const productsAreaRef = useRef(null);

  // Filter out unpublished products
  const liveProducts = useMemo(() => {
    return products.filter((p) => ['published', 'active', 'approved'].includes(p.status));
  }, [products]);

  // Dynamic price bounds
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

  // Dynamic lists of unique categories, subcategories & brands
  const categoryOptions = useMemo(() => {
    const fromProducts = liveProducts.map((p) => p.category).filter(Boolean);
    const fromContext = categories.map((c) => c.label || c.name).filter(Boolean);
    return [...new Set([...fromProducts, ...fromContext])].sort();
  }, [liveProducts, categories]);

  const brandOptions = useMemo(() => {
    const fromProducts = liveProducts.map((p) => p.brand).filter(Boolean);
    const fromContext = brands.map((b) => b.label || b.name).filter(Boolean);
    return [...new Set([...fromProducts, ...fromContext])].sort();
  }, [liveProducts, brands]);

  // Quick filter pills depending on current active category
  const quickPills = useMemo(() => {
    const activeCatLower = (selectedCategory || '').toLowerCase();
    
    // 1. If category selected, find subcategories belonging to it
    if (selectedCategory) {
      // From subcategories collection
      const matchedFromContext = subcategories
        .filter((s) => {
          const pId = String(s.parentId || s.categoryId || '').toLowerCase();
          const pName = String(s.category || '').toLowerCase();
          return pId === activeCatLower || pName === activeCatLower;
        })
        .map((s) => s.label || s.name);

      // From products
      const matchedFromProducts = liveProducts
        .filter((p) => String(p.category || '').toLowerCase() === activeCatLower)
        .map((p) => p.subcategory || p.subCategory)
        .filter(Boolean);

      // Fallback
      let fallbackList = [];
      for (const [key, list] of Object.entries(FALLBACK_PILLS_MAP)) {
        if (activeCatLower.includes(key) || key.includes(activeCatLower)) {
          fallbackList = list;
          break;
        }
      }

      const combined = [...new Set([...matchedFromContext, ...matchedFromProducts, ...fallbackList])];
      if (combined.length > 0) {
        return combined;
      }
    }

    // 2. If no category selected, show all top categories as quick pills
    if (categoryOptions.length > 0) {
      return categoryOptions;
    }
    return ['Rider Wear', 'Helmets', 'Bike Accessories', 'Tech & Gadget', 'Performance', 'Footwear', 'Apparel'];
  }, [selectedCategory, subcategories, liveProducts, categoryOptions]);

  // Filter products by all active criteria
  const filteredProducts = useMemo(() => {
    let result = liveProducts;

    // Search query
    const term = search.trim().toLowerCase();
    if (term) {
      result = result.filter((p) =>
        [p.name, p.title, p.category, p.subcategory, p.subCategory, p.brand, p.description]
          .some((v) => String(v || '').toLowerCase().includes(term))
      );
    }

    // Category
    if (selectedCategory) {
      const catLower = selectedCategory.toLowerCase();
      result = result.filter((p) => {
        const pCat = String(p.category || '').toLowerCase();
        return pCat === catLower || pCat === `${catLower}s` || catLower === `${pCat}s`;
      });
    }

    // Subcategory
    if (selectedSubcategory) {
      const subLower = selectedSubcategory.toLowerCase();
      result = result.filter((p) => {
        const pSub = String(p.subcategory || p.subCategory || '').toLowerCase();
        return (
          pSub === subLower ||
          pSub === `${subLower}s` ||
          subLower === `${pSub}s` ||
          pSub.includes(subLower) ||
          subLower.includes(pSub)
        );
      });
    }

    // Brand
    if (selectedBrand) {
      const brandLower = selectedBrand.toLowerCase();
      result = result.filter((p) => String(p.brand || '').toLowerCase() === brandLower);
    }

    // Bike model / brand
    if (queryBike) {
      const bikeLower = queryBike.toLowerCase();
      result = result.filter((p) => {
        const text = [p.bikeModel, p.model, p.compatibility, p.bikeBrand, p.name].join(' ').toLowerCase();
        return text.includes(bikeLower);
      });
    }

    // Availability
    if (availability.inStock && !availability.outOfStock) {
      result = result.filter((p) => Number(p.stock || 0) > 0);
    } else if (availability.outOfStock && !availability.inStock) {
      result = result.filter((p) => Number(p.stock || 0) <= 0);
    }

    // Price bounds
    result = result.filter((p) => {
      const price = Number(p.offerPrice || p.price || 0);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sorting
    result = [...result];
    if (sortBy === 'price-asc') {
      result.sort((a, b) => Number(a.offerPrice || a.price || 0) - Number(b.offerPrice || b.price || 0));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => Number(b.offerPrice || b.price || 0) - Number(a.offerPrice || a.price || 0));
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => Number(b.averageRating || 0) - Number(a.averageRating || 0));
    }

    return result;
  }, [
    liveProducts,
    search,
    selectedCategory,
    selectedSubcategory,
    selectedBrand,
    queryBike,
    availability,
    priceRange,
    sortBy,
  ]);

  // Reset to page 1 when any filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    selectedCategory,
    selectedSubcategory,
    selectedBrand,
    queryBike,
    availability,
    priceRange,
    sortBy,
  ]);

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

    if (productsAreaRef.current) {
      productsAreaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Generate page numbers with ellipses
  const pageNumbers = useMemo(() => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  // Count active filters for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (selectedSubcategory) count++;
    if (selectedBrand) count++;
    if (availability.inStock || availability.outOfStock) count++;
    if (priceRange[0] > priceBounds[0] || priceRange[1] < priceBounds[1]) count++;
    return count;
  }, [selectedCategory, selectedSubcategory, selectedBrand, availability, priceRange, priceBounds]);

  // Update query params helper
  const updateQueryParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  // Toggle pill handler
  const handlePillClick = (pill) => {
    if (!selectedCategory) {
      // On Shop All, clicking a pill selects that Category
      if (selectedCategory === pill) {
        updateQueryParam('category', '');
      } else {
        updateQueryParam('category', pill);
      }
    } else {
      // In category view, clicking a pill selects that Subcategory
      if (selectedSubcategory === pill) {
        updateQueryParam('subcategory', '');
      } else {
        updateQueryParam('subcategory', pill);
      }
    }
  };

  // Clear all filters handler
  const handleClearAll = () => {
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedBrand('');
    setSearch('');
    setAvailability({ inStock: false, outOfStock: false });
    setPriceRange(priceBounds);
    setSearchParams({});
  };

  // Dynamic Title & Breadcrumbs (matching screenshot)
  const pageTitle = useMemo(() => {
    if (search) return `Search: "${search}"`;
    if (selectedSubcategory) return selectedSubcategory;
    if (selectedCategory) return selectedCategory;
    if (selectedBrand) return `${selectedBrand} Collection`;
    if (queryBike) return `Gear for ${queryBike}`;
    return 'All Accessories';
  }, [search, selectedSubcategory, selectedCategory, selectedBrand, queryBike]);

  return (
    <div className="sp-page">
      <AccessoriesHeader
        showBack
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          updateQueryParam('search', val);
        }}
      />

      <div className="sp-container">
        {/* ── Breadcrumb (matching screenshot: HOME / BUY ... ONLINE) ── */}
        <nav className="sp-breadcrumb" aria-label="breadcrumb">
          <Link to="/">Home</Link>
          <span className="sp-breadcrumb__sep">/</span>
          <Link to="/accessories">Accessories</Link>
          {selectedCategory && (
            <>
              <span className="sp-breadcrumb__sep">/</span>
              <span
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  updateQueryParam('subcategory', '');
                }}
              >
                {selectedCategory}
              </span>
            </>
          )}
          {selectedSubcategory && (
            <>
              <span className="sp-breadcrumb__sep">/</span>
              <span className="sp-breadcrumb__current">{selectedSubcategory}</span>
            </>
          )}
        </nav>

        {/* ── Header Title & Subtitle (matching screenshot) ── */}
        <header className="sp-header">
          <h1 className="sp-title">{pageTitle}</h1>
          <p className="sp-subtitle">
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'Result' : 'Results'}
          </p>
        </header>

        {/* ── Horizontal Filter Bar: [Filters & Sort] Button + Quick Pills (matching screenshot) ── */}
        <div className="sp-filter-bar">
          <button
            type="button"
            className={`sp-filter-toggle${filterOpen ? ' is-active' : ''}`}
            onClick={() => setFilterOpen((prev) => !prev)}
            aria-label="Toggle Filters & Sort"
          >
            <SlidersIcon />
            <span>Filters & Sort</span>
            {activeFilterCount > 0 && <span className="sp-filter-badge">{activeFilterCount}</span>}
          </button>

          {/* Quick Filter Pills Row */}
          <div className="sp-pills-scroll" ref={pillsTrackRef}>
            {/* "All" reset pill */}
            <button
              type="button"
              className={`sp-pill${(!selectedSubcategory && selectedCategory) || (!selectedCategory && !selectedSubcategory) ? ' is-active' : ''}`}
              onClick={() => {
                if (selectedCategory) {
                  updateQueryParam('subcategory', '');
                } else {
                  handleClearAll();
                }
              }}
            >
              {selectedCategory ? `All ${selectedCategory}` : 'All Products'}
            </button>

            {/* Subcategory or Category Pills */}
            {quickPills.map((pill) => {
              const isPillActive =
                selectedSubcategory === pill || (!selectedCategory && selectedCategory === pill);

              return (
                <button
                  key={pill}
                  type="button"
                  className={`sp-pill${isPillActive ? ' is-active' : ''}`}
                  onClick={() => handlePillClick(pill)}
                >
                  {pill}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Layout: Collapsible Sidebar + Products Grid ── */}
        <div className="sp-layout">
          {/* ── Collapsible Filters Sidebar ── */}
          <aside className={`sp-sidebar${filterOpen ? ' is-open' : ''}`}>
            <div className="sp-sidebar__header">
              <span className="sp-sidebar__title">Filters & Sort</span>
              {activeFilterCount > 0 && (
                <button type="button" className="sp-sidebar__clear-btn" onClick={handleClearAll}>
                  Clear all
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="sp-filter-group">
              <div className="sp-filter-group__title">Sort By</div>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  updateQueryParam('sort', e.target.value);
                }}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A–Z</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {/* Category Filter */}
            {categoryOptions.length > 0 && (
              <div className="sp-filter-group">
                <div className="sp-filter-group__title">Category</div>
                <div className="sp-checkbox-list">
                  {categoryOptions.map((cat) => (
                    <label key={cat} className="sp-checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedCategory === cat}
                        onChange={() => {
                          updateQueryParam('category', selectedCategory === cat ? '' : cat);
                          updateQueryParam('subcategory', '');
                        }}
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Brands Filter */}
            {brandOptions.length > 0 && (
              <div className="sp-filter-group">
                <div className="sp-filter-group__title">Brand</div>
                <div className="sp-checkbox-list">
                  {brandOptions.map((b) => (
                    <label key={b} className="sp-checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedBrand === b}
                        onChange={() => {
                          updateQueryParam('brand', selectedBrand === b ? '' : b);
                        }}
                      />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Availability */}
            <div className="sp-filter-group">
              <div className="sp-filter-group__title">Availability</div>
              <div className="sp-checkbox-list">
                <label className="sp-checkbox-item">
                  <input
                    type="checkbox"
                    checked={availability.inStock}
                    onChange={(e) =>
                      setAvailability((prev) => ({ ...prev, inStock: e.target.checked }))
                    }
                  />
                  <span>In Stock</span>
                </label>
                <label className="sp-checkbox-item">
                  <input
                    type="checkbox"
                    checked={availability.outOfStock}
                    onChange={(e) =>
                      setAvailability((prev) => ({ ...prev, outOfStock: e.target.checked }))
                    }
                  />
                  <span>Out of Stock</span>
                </label>
              </div>
            </div>

            {/* Price Range */}
            <div className="sp-filter-group">
              <div className="sp-filter-group__title">Max Price (₹{priceRange[1].toLocaleString()})</div>
              <input
                type="range"
                min={priceBounds[0]}
                max={priceBounds[1]}
                step="100"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                style={{ width: '100%', accentColor: '#000' }}
              />
            </div>
          </aside>

          {/* ── Products Grid Area ── */}
          <main className="sp-products-area" ref={productsAreaRef}>
            {productsLoading ? (
              <div className="sp-empty">
                <div className="sp-empty__icon">⏳</div>
                <h3>Loading gear & accessories…</h3>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="sp-products-grid">
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* ── Pagination Controls ── */}
                <div className="sp-pagination">
                  <div className="sp-pagination__info">
                    Showing <strong>{startIndex + 1}–{endIndex}</strong> of <strong>{filteredProducts.length}</strong> products
                  </div>

                  <div className="sp-pagination__controls">
                    <button
                      type="button"
                      className="sp-page-btn sp-page-btn--prev"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                      <span>Previous</span>
                    </button>

                    <div className="sp-pagination__numbers">
                      {pageNumbers.map((p, idx) =>
                        p === '...' ? (
                          <span key={`ellipsis-${idx}`} className="sp-page-ellipsis">…</span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            className={`sp-page-num${p === currentPage ? ' is-active' : ''}`}
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
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
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
              <div className="sp-empty">
                <div className="sp-empty__icon">🔍</div>
                <h3>No matching products found</h3>
                <p>Try clearing your active filters or searching for something else.</p>
                <button type="button" className="sp-empty__reset-btn" onClick={handleClearAll}>
                  Clear all filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
