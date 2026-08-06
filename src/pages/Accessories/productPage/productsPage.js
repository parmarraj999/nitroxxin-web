import React, { useMemo, useState } from 'react'
import './productsPage.css'
import { Link, useParams } from 'react-router-dom';
import { useAccessoriesContext } from '../../../context/AccessoriesContext';
import AccessoriesHeader from '../accessoriesNav/AccessoriesHeader';

function SlidersIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <line x1="4" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="4" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="4" y1="18" x2="20" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="9" cy="6" r="2" fill="white" stroke="currentColor" strokeWidth="2" />
            <circle cx="15" cy="12" r="2" fill="white" stroke="currentColor" strokeWidth="2" />
            <circle cx="9" cy="18" r="2" fill="white" stroke="currentColor" strokeWidth="2" />
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

function ProductsPage({ filterType }) {
    const [filterOpen, setFilterOpen] = useState(false);
    const { id } = useParams();
    const [search, setSearch] = useState('');

    // Filter states
    const [availability, setAvailability] = useState({ inStock: false, outOfStock: false });
    const [priceRange, setPriceRange] = useState([0, 100000]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [sortBy, setSortBy] = useState('newest');

    const { products: cachedProducts, productsLoading } = useAccessoriesContext();

    // All live products from Firestore
    const allProducts = useMemo(() =>
        cachedProducts.filter(p => ['published', 'active', 'approved'].includes(p.status)),
        [cachedProducts]
    );

    // Compute price bounds from the full dataset
    const priceBounds = useMemo(() => {
        if (!allProducts.length) return [0, 100000];
        const prices = allProducts.map(p => Number(p.offerPrice || p.price || 0)).filter(Boolean);
        return [Math.min(...prices), Math.max(...prices)];
    }, [allProducts]);

    // Reset priceRange when bounds change (first load)
    const [boundsSet, setBoundsSet] = React.useState(false);
    React.useEffect(() => {
        if (!boundsSet && allProducts.length > 0) {
            setPriceRange(priceBounds);
            setBoundsSet(true);
        }
    }, [allProducts, priceBounds, boundsSet]);

    // Unique categories & brands from products (for filter options)
    const categoryOptions = useMemo(() => {
        const set = new Set(allProducts.map(p => p.category).filter(Boolean));
        return [...set].sort();
    }, [allProducts]);

    const brandOptions = useMemo(() => {
        const set = new Set(allProducts.map(p => p.brand).filter(Boolean));
        return [...set].sort();
    }, [allProducts]);

    // Count active filters for badge
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (availability.inStock || availability.outOfStock) count++;
        if (priceRange[0] !== priceBounds[0] || priceRange[1] !== priceBounds[1]) count++;
        if (selectedCategories.length) count++;
        if (selectedBrands.length) count++;
        return count;
    }, [availability, priceRange, priceBounds, selectedCategories, selectedBrands]);

    const toggleCategory = (cat) =>
        setSelectedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );

    const toggleBrand = (brand) =>
        setSelectedBrands(prev =>
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        );

    const resetAll = () => {
        setAvailability({ inStock: false, outOfStock: false });
        setPriceRange(priceBounds);
        setSelectedCategories([]);
        setSelectedBrands([]);
    };

    // Apply route filter (category/brand/vendor/bike page)
    const routeFiltered = useMemo(() => {
        if (!id) return allProducts;
        const rawMatch = String(id).toLowerCase();
        const matchValue = rawMatch.replace(/-/g, ' ').trim();

        return allProducts.filter(product => {
            if (filterType === 'brand')
                return [product.brandId, product.brand].some(v => {
                    const str = String(v || '').toLowerCase();
                    return str === rawMatch || str === matchValue;
                });
            if (filterType === 'vendor')
                return String(product.vendorId || '').toLowerCase() === rawMatch;
            if (filterType === 'bike') {
                const words = matchValue.split(/\s+/).filter(w => w.length > 1);
                const searchableText = [
                    product.bikeModel,
                    product.model,
                    product.compatibility,
                    product.bikeBrand,
                    product.name,
                    product.title,
                    product.category,
                    product.brand,
                    product.description
                ].map(v => String(v || '').toLowerCase()).join(' ');

                return words.length > 0
                    ? words.some(w => searchableText.includes(w))
                    : searchableText.includes(matchValue);
            }
            return [product.categoryId, product.category].some(v => {
                const str = String(v || '').toLowerCase();
                return str === rawMatch || str === matchValue;
            });
        });
    }, [allProducts, id, filterType]);

    // Apply all sidebar filters + search + sort
    const filteredProducts = useMemo(() => {
        let result = routeFiltered;

        // Search
        const term = search.toLowerCase().trim();
        if (term) {
            result = result.filter(p =>
                [p.name, p.category, p.brand, p.description]
                    .some(v => String(v || '').toLowerCase().includes(term))
            );
        }

        // Availability
        if (availability.inStock || availability.outOfStock) {
            result = result.filter(p => {
                const inStock = p.stock > 0;
                if (availability.inStock && availability.outOfStock) return true;
                if (availability.inStock) return inStock;
                if (availability.outOfStock) return !inStock;
                return true;
            });
        }

        // Price
        result = result.filter(p => {
            const price = Number(p.offerPrice || p.price || 0);
            return price >= priceRange[0] && price <= priceRange[1];
        });

        // Categories
        if (selectedCategories.length) {
            result = result.filter(p => selectedCategories.includes(p.category));
        }

        // Brands
        if (selectedBrands.length) {
            result = result.filter(p => selectedBrands.includes(p.brand));
        }

        // Sort
        result = [...result];
        if (sortBy === 'price-asc') result.sort((a, b) => (Number(a.offerPrice || a.price || 0)) - (Number(b.offerPrice || b.price || 0)));
        else if (sortBy === 'price-desc') result.sort((a, b) => (Number(b.offerPrice || b.price || 0)) - (Number(a.offerPrice || a.price || 0)));
        else if (sortBy === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortBy === 'rating') result.sort((a, b) => b.averageRating - a.averageRating);
        // newest = default Firestore order

        return result;
    }, [routeFiltered, search, availability, priceRange, selectedCategories, selectedBrands, sortBy]);

    // Page title
    const pageTitle = useMemo(() => {
        if (!id) return 'All Products';
        return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }, [id]);

    const formatPrice = (val) => `₹${Number(val).toLocaleString('en-IN')}`;

    return (
        <div className="pp-page">
            <AccessoriesHeader showBack search={search} onSearchChange={setSearch} />

            <div className="pp-inner">
                {/* ─── Page Header ─── */}
                <div className="pp-header">
                    <h1 className="pp-title">{pageTitle}</h1>

                    <div className="pp-topbar">
                        <div className="pp-topbar__left">
                            <button
                                id="filter-toggle-btn"
                                className={`pp-filter-toggle${filterOpen ? ' pp-filter-toggle--active' : ''}`}
                                onClick={() => setFilterOpen(p => !p)}
                            >
                                <SlidersIcon />
                                Filters
                                {activeFilterCount > 0 && (
                                    <span className="pp-filter-badge">{activeFilterCount}</span>
                                )}
                            </button>
                            <span className="pp-count">
                                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="pp-sort">
                            <label htmlFor="pp-sort-select">Sort by</label>
                            <select
                                id="pp-sort-select"
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                            >
                                <option value="newest">Newest</option>
                                <option value="price-asc">Price: Low to High</option>
                                <option value="price-desc">Price: High to Low</option>
                                <option value="name-asc">Name: A–Z</option>
                                <option value="rating">Top Rated</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* ─── Layout: sidebar + grid ─── */}
                <div className="pp-layout">

                    {/* ─── Filter Sidebar ─── */}
                    <aside className={`pp-sidebar${filterOpen ? ' pp-sidebar--open' : ''}`} id="filter-sidebar">
                        <div className="pp-sidebar__header">
                            <span className="pp-sidebar__title">Filters</span>
                            <div className="pp-sidebar__actions">
                                {activeFilterCount > 0 && (
                                    <button className="pp-sidebar__reset" onClick={resetAll}>
                                        Clear all
                                    </button>
                                )}
                                <button
                                    className="pp-sidebar__close"
                                    onClick={() => setFilterOpen(false)}
                                    aria-label="Close filters"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>

                        {/* Availability */}
                        <div className="pp-filter-group">
                            <div className="pp-filter-group__label">Availability</div>
                            <label className="pp-checkbox">
                                <input
                                    type="checkbox"
                                    checked={availability.inStock}
                                    onChange={e => setAvailability(a => ({ ...a, inStock: e.target.checked }))}
                                />
                                <span>In Stock</span>
                            </label>
                            <label className="pp-checkbox">
                                <input
                                    type="checkbox"
                                    checked={availability.outOfStock}
                                    onChange={e => setAvailability(a => ({ ...a, outOfStock: e.target.checked }))}
                                />
                                <span>Out of Stock</span>
                            </label>
                        </div>

                        {/* Price Range */}
                        <div className="pp-filter-group">
                            <div className="pp-filter-group__label">Price Range</div>
                            <div className="pp-price-display">
                                <span>{formatPrice(priceRange[0])}</span>
                                <span>—</span>
                                <span>{formatPrice(priceRange[1])}</span>
                            </div>
                            <div className="pp-price-sliders">
                                <input
                                    type="range"
                                    className="pp-slider"
                                    min={priceBounds[0]}
                                    max={priceBounds[1]}
                                    value={priceRange[0]}
                                    onChange={e => {
                                        const val = Number(e.target.value);
                                        if (val <= priceRange[1]) setPriceRange([val, priceRange[1]]);
                                    }}
                                />
                                <input
                                    type="range"
                                    className="pp-slider"
                                    min={priceBounds[0]}
                                    max={priceBounds[1]}
                                    value={priceRange[1]}
                                    onChange={e => {
                                        const val = Number(e.target.value);
                                        if (val >= priceRange[0]) setPriceRange([priceRange[0], val]);
                                    }}
                                />
                            </div>
                            {(priceRange[0] !== priceBounds[0] || priceRange[1] !== priceBounds[1]) && (
                                <button className="pp-filter-reset" onClick={() => setPriceRange(priceBounds)}>
                                    Reset price
                                </button>
                            )}
                        </div>

                        {/* Categories */}
                        {categoryOptions.length > 0 && (
                            <div className="pp-filter-group">
                                <div className="pp-filter-group__label">Category</div>
                                <div className="pp-filter-scroll">
                                    {categoryOptions.map(cat => (
                                        <label key={cat} className="pp-checkbox">
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
                                    <button className="pp-filter-reset" onClick={() => setSelectedCategories([])}>
                                        Reset
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Brands */}
                        {brandOptions.length > 0 && (
                            <div className="pp-filter-group">
                                <div className="pp-filter-group__label">Brand</div>
                                <div className="pp-filter-scroll">
                                    {brandOptions.map(brand => (
                                        <label key={brand} className="pp-checkbox">
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
                                    <button className="pp-filter-reset" onClick={() => setSelectedBrands([])}>
                                        Reset
                                    </button>
                                )}
                            </div>
                        )}
                    </aside>

                    {/* ─── Product Grid ─── */}
                    <main className="pp-main">
                        {productsLoading ? (
                            <div className="pp-empty">
                                <div className="pp-spinner" />
                                <p>Loading products…</p>
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className={`pp-grid${filterOpen ? ' pp-grid--narrow' : ''}`}>
                                {filteredProducts.map(product => (
                                    <Link to={`/product/${product.id}`} className="pp-card" key={product.id}>
                                        <div className="pp-card__image">
                                            {product.image
                                                ? <img src={product.image} alt={product.name} loading="lazy" />
                                                : <div className="pp-card__no-img">No image</div>
                                            }
                                            {product.stock <= 0 && (
                                                <div className="pp-card__oos">Out of Stock</div>
                                            )}
                                            {product.offerPrice && product.price && product.offerPrice < product.price && (
                                                <div className="pp-card__discount">
                                                    {Math.round((1 - product.offerPrice / product.price) * 100)}% OFF
                                                </div>
                                            )}
                                        </div>

                                        <div className="pp-card__info">
                                            {product.brand && (
                                                <span className="pp-card__brand">{product.brand}</span>
                                            )}
                                            <h3 className="pp-card__name">{product.name}</h3>
                                            <div className="pp-card__price-row">
                                                <span className="pp-card__price">
                                                    {product.offerPriceText || product.priceText || '—'}
                                                </span>
                                                {product.offerPrice && product.price && product.offerPrice < product.price && (
                                                    <span className="pp-card__mrp">
                                                        {product.priceText || product.price}
                                                    </span>
                                                )}
                                            </div>
                                            {product.averageRating > 0 && (
                                                <div className="pp-card__rating">
                                                    {'★'.repeat(Math.round(product.averageRating))}
                                                    {'☆'.repeat(5 - Math.round(product.averageRating))}
                                                    <span>({product.reviewCount})</span>
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="pp-empty">
                                <div className="pp-empty__icon">🔍</div>
                                <h3>No products found</h3>
                                <p>Try adjusting your filters or search term.</p>
                                {activeFilterCount > 0 && (
                                    <button className="pp-empty__reset" onClick={resetAll}>
                                        Clear all filters
                                    </button>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default ProductsPage;
