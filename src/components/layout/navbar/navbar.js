import React, { useState, useEffect, useMemo } from 'react';
import './navbar.css';
import { Link, useLocation } from 'react-router-dom';
import { useAuthModal } from '../../AuthModal/useAuthModal';
import { useAuth } from '../../../context/AuthContext';
import { useEventsContext } from '../../../context/EventsContext';
import BecomePartner from '../../Partner/BecomePartner';
import EventSearchModal from '../../EventSearchModal/EventSearchModal';

const DEFAULT_EVENT_CATEGORIES = [
    { id: 'night-rides', label: 'Night Rides' },
    { id: 'day-rides', label: 'Day Rides' },
    { id: 'group-rides', label: 'Group Rides' },
    { id: 'workshops', label: 'Workshops' },
    { id: 'meetups', label: 'Meetups' },
];

const Navbar = () => {
    const { pathname, search } = useLocation();
    const { openLogin } = useAuthModal();
    const { isAuthenticated, logout } = useAuth();
    const { categories: rawCategories = [] } = useEventsContext();

    const searchParams = useMemo(() => new URLSearchParams(search), [search]);
    const currentCategory = searchParams.get('category');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

    useEffect(() => {
        setSearchQuery(searchParams.get('q') || '');
    }, [searchParams]);

    useEffect(() => {
        const handleOpenEventSearch = (e) => {
            if (e.detail?.query) {
                setSearchQuery(e.detail.query);
            }
            setIsSearchModalOpen(true);
        };
        window.addEventListener('openEventSearch', handleOpenEventSearch);
        return () => window.removeEventListener('openEventSearch', handleOpenEventSearch);
    }, []);

    const handleOpenSearchModal = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setIsSearchModalOpen(true);
    };

    const eventCategories = useMemo(() => {
        if (rawCategories && rawCategories.length > 0) {
            return rawCategories.slice(0, 5).map((cat) => ({
                id: cat.slug || cat.id || (cat.label || cat.title || cat.name || '').toLowerCase().replace(/\s+/g, '-'),
                label: cat.label || cat.title || cat.name || 'Category',
            }));
        }
        return DEFAULT_EVENT_CATEGORIES;
    }, [rawCategories]);

    const isEventDetailPage =
        pathname.startsWith('/event/') ||
        (pathname.startsWith('/events/') &&
            !['/events/all', '/events/near-you', '/events/near-me', '/events/upcoming', '/events/search'].some((p) =>
                pathname.startsWith(p)
            ));

    const isHidden =
        pathname.startsWith('/events/search') ||
        isEventDetailPage ||
        pathname.includes('/accessories') ||
        pathname.includes('/shop') ||
        pathname.includes('/events/upcoming') ||
        pathname.includes('/events/near-you') ||
        pathname.includes('/category') ||
        pathname.includes('/profile') ||
        pathname.includes('/product') ||
        pathname.includes('/cart') ||
        pathname.includes('/combo') ||
        pathname.startsWith('/combo');

    return (
        <nav className="navbar" style={isHidden ? { display: 'none' } : {}}>
            <div className="navbar-container">
                <div className="navbar-left">
                    <Link to="/" className="navbar-logo-link" aria-label="Nitroxx Home">
                        <img src="/assets/images/logo-white.png" alt="Nitroxx" className="navbar-logo-img" />
                    </Link>

                    <div className="navbar-divider" />

                    {/* 5 Event Category options (Desktop only - matches marketplace navbar) */}
                    <nav className="navbar-events-nav" aria-label="Event Categories">
                        {eventCategories.map((cat) => {
                            const isCatActive =
                                (pathname.includes('/events') || pathname.includes('/all-events')) &&
                                currentCategory &&
                                (currentCategory.toLowerCase() === cat.id.toLowerCase() ||
                                    currentCategory.toLowerCase().replace(/[-_]/g, ' ') === cat.label.toLowerCase().replace(/[-_]/g, ' '));

                            return (
                                <Link
                                    key={cat.id}
                                    to={`/events/all?category=${encodeURIComponent(cat.id)}`}
                                    className={`navbar-event-cat-link ${isCatActive ? 'is-active' : ''}`}
                                >
                                    <span>{cat.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className='navbar-action-btn'>
                    <BecomePartner theme="dark" />

                    {/* Desktop Search Bar (Marketplace Navbar Style) */}
                    <div
                        className="navbar-search-bar"
                        onClick={handleOpenSearchModal}
                        role="button"
                        tabIndex={0}
                        title="Search events"
                    >
                        <button
                            type="button"
                            className="navbar-search-bar__btn"
                            aria-label="Search events"
                            title="Search events"
                            onClick={handleOpenSearchModal}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="navbar-search-bar__icon">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.34-4.34" />
                            </svg>
                        </button>
                        <input
                            type="text"
                            className="navbar-search-bar__input"
                            placeholder="Search events, rides, meetups..."
                            value={searchQuery}
                            onFocus={handleOpenSearchModal}
                            onClick={handleOpenSearchModal}
                            readOnly
                            autoComplete="off"
                            spellCheck="false"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="navbar-search-bar__clear"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchQuery('');
                                }}
                                aria-label="Clear search"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Mobile Search Icon (only shown on mobile screens) */}
                    <button
                        type="button"
                        className="navbar-search-mobile"
                        aria-label="Search events"
                        title="Search events"
                        onClick={handleOpenSearchModal}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="navbar-search-mobile__icon">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.34-4.34" />
                        </svg>
                    </button>
                    {
                        isAuthenticated ? "" :
                            <button type="button" className="navbar-login" onClick={isAuthenticated ? logout : openLogin}>
                                Log In
                            </button>
                    }
                    {
                        isAuthenticated && (
                            <Link to='/profile'>
                                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" color='white' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-user-icon lucide-circle-user"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3" /><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" /></svg>
                            </Link>
                        )
                    }
                </div>
            </div>

            {/* Event Search Popup Modal */}
            <EventSearchModal
                isOpen={isSearchModalOpen}
                onClose={() => setIsSearchModalOpen(false)}
                initialQuery={searchQuery}
            />
        </nav>
    );
};

export default Navbar;
