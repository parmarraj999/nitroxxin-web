import { useMemo, useState } from "react";
import "./collection.css";
import { Link, useParams } from "react-router-dom";
import { useAccessoriesContext } from "../../../context/AccessoriesContext";
import AccessoriesHeader from "../accessoriesNav/AccessoriesHeader";

function GridIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
            <rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
            <rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

function ListIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <rect x="3" y="4" width="18" height="4" rx="2" stroke="currentColor" strokeWidth="2" />
            <rect x="3" y="10" width="18" height="4" rx="2" stroke="currentColor" strokeWidth="2" />
            <rect x="3" y="16" width="18" height="4" rx="2" stroke="currentColor" strokeWidth="2" />
        </svg>
    );
}

function ArrowIcon() {
    return (
        <svg viewBox="0 0 16 14" fill="none" width="16" height="14">
            <path d="M1 7H15M9 1L15 7L9 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export default function CollectionPage() {
    const { categoryId } = useParams();        // optional — if we're deep-linked to a parent
    const [search, setSearch] = useState("");
    const [view, setView] = useState("grid");  // "grid" | "list"

    const {
        categories,
        categoriesLoading,
        subcategories,
        subcategoriesLoading,
    } = useAccessoriesContext();

    // If a categoryId is in the URL, filter subcats to that parent
    const activeParent = useMemo(
        () => (categoryId ? categories.find(c => c.id === categoryId) : null),
        [categories, categoryId]
    );

    // Show the top-level categories first. Selecting one reveals only the
    // subcategories that the admin assigned to that category.
    const displayItems = useMemo(() => {
        let list = categoryId
            ? subcategories.filter(s => String(s.parentId) === String(categoryId))
            : categories;

        // Search
        const term = search.trim().toLowerCase();
        if (term) {
            list = list.filter(s => s.label.toLowerCase().includes(term));
        }

        return list;
    }, [subcategories, categories, categoryId, search]);

    // Group remaining categories for side navigation
    const isLoading = categoriesLoading || subcategoriesLoading;
    const showCategories = !categoryId && categories.length > 0;

    return (
        <section className="col-page">
            <AccessoriesHeader showBack search={search} onSearchChange={setSearch} />

            <div className="col-page__container">
                {/* Breadcrumb */}
                <nav className="col-page__breadcrumb" aria-label="breadcrumb">
                    <Link to="/accessories">Home</Link>
                    <span className="col-page__breadcrumb-sep">›</span>
                    <Link to="/accessories/collection">Collections</Link>
                    {activeParent && (
                        <>
                            <span className="col-page__breadcrumb-sep">›</span>
                            <span className="col-page__breadcrumb-active">{activeParent.label}</span>
                        </>
                    )}
                </nav>

                {/* Hero heading */}
                <div className="col-page__hero">
                    <h1 className="col-page__title">
                        {activeParent ? activeParent.label : "Collections"}
                    </h1>
                    {activeParent?.description && (
                        <p className="col-page__subtitle">{activeParent.description}</p>
                    )}
                    {!activeParent && (
                        <p className="col-page__subtitle">
                            Browse our curated accessory collections — find exactly what fits your ride.
                        </p>
                    )}
                </div>

                {/* Top bar */}
                <div className="col-page__topbar">
                    <span className="col-page__count">
                        {isLoading ? "Loading…" : `${displayItems.length} ${categoryId ? 'subcategor' : 'categor'}${displayItems.length !== 1 ? 'ies' : 'y'}`}
                    </span>

                    <div className="col-page__view-toggle">
                        <button
                            id="col-view-grid"
                            className={`col-page__view-btn${view === 'grid' ? ' col-page__view-btn--active' : ''}`}
                            onClick={() => setView('grid')}
                            aria-label="Grid view"
                        >
                            <GridIcon />
                        </button>
                        <button
                            id="col-view-list"
                            className={`col-page__view-btn${view === 'list' ? ' col-page__view-btn--active' : ''}`}
                            onClick={() => setView('list')}
                            aria-label="List view"
                        >
                            <ListIcon />
                        </button>
                    </div>
                </div>

                <div className="col-page__layout">
                    {/* ── Sidebar: parent categories (only when not filtered) ── */}
                    {showCategories && (
                        <aside className="col-page__sidebar">
                            <div className="col-page__sidebar-title">Categories</div>
                            <ul className="col-page__sidebar-list">
                                <li>
                                    <Link
                                        to="/accessories/collection"
                                        className={`col-page__sidebar-link${!categoryId ? ' col-page__sidebar-link--active' : ''}`}
                                    >
                                        All Collections
                                    </Link>
                                </li>
                                {categories.map(cat => (
                                    <li key={cat.id}>
                                        <Link
                                            to={`/accessories/collection/${cat.id}`}
                                            className={`col-page__sidebar-link${categoryId === cat.id ? ' col-page__sidebar-link--active' : ''}`}
                                        >
                                            {cat.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </aside>
                    )}

                    {/* ── Main content ── */}
                    <main className="col-page__main">
                        {isLoading ? (
                            <div className="col-page__empty">
                                <div className="col-page__spinner" />
                                <p>Loading collections…</p>
                            </div>
                        ) : displayItems.length > 0 ? (
                            <div className={view === 'grid' ? 'col-page__grid' : 'col-page__list'}>
                                {displayItems.map(item => (
                                    <Link
                                        key={item.id}
                                        to={categoryId ? `/accessories?subcategory=${encodeURIComponent(item.label)}` : `/accessories/collection/${item.id}`}
                                        className={view === 'grid' ? 'col-card' : 'col-card-list'}
                                        id={`col-${item.id}`}
                                    >
                                        {/* Grid card */}
                                        {view === 'grid' && (
                                            <>
                                                <div className="col-card__image">
                                                    {item.image
                                                        ? <img src={item.image} alt={item.label} loading="lazy" />
                                                        : (
                                                            <div className="col-card__placeholder">
                                                                <span>{item.label.charAt(0)}</span>
                                                            </div>
                                                        )
                                                    }
                                                    <div className="col-card__overlay">
                                                        <span className="col-card__shop-btn">
                                                            Shop Now <ArrowIcon />
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="col-card__info">
                                                    <h3 className="col-card__name">{item.label}</h3>
                                                    {item.productCount != null && (
                                                        <span className="col-card__count">{item.productCount} products</span>
                                                    )}
                                                </div>
                                            </>
                                        )}

                                        {/* List card */}
                                        {view === 'list' && (
                                            <>
                                                <div className="col-card-list__image">
                                                    {item.image
                                                        ? <img src={item.image} alt={item.label} loading="lazy" />
                                                        : (
                                                            <div className="col-card__placeholder">
                                                                <span>{item.label.charAt(0)}</span>
                                                            </div>
                                                        )
                                                    }
                                                </div>
                                                <div className="col-card-list__content">
                                                    <h3 className="col-card-list__name">{item.label}</h3>
                                                    {item.description && (
                                                        <p className="col-card-list__desc">{item.description}</p>
                                                    )}
                                                    {item.productCount != null && (
                                                        <span className="col-card__count">{item.productCount} products</span>
                                                    )}
                                                </div>
                                                <span className="col-card-list__arrow"><ArrowIcon /></span>
                                            </>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="col-page__empty">
                                <div className="col-page__empty-icon">📂</div>
                                <h3>No collections found</h3>
                                <p>
                                    {search
                                        ? `No results for "${search}". Try a different term.`
                                        : "Collections will appear here once added from the dashboard."}
                                </p>
                                {search && (
                                    <button className="col-page__empty-reset" onClick={() => setSearch("")}>
                                        Clear search
                                    </button>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </section>
    );
}
