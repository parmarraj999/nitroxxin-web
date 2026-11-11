import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './LocationModal.css';

const POPULAR_CITIES = [
    "Mumbai", "Delhi NCR", "Bengaluru", "Hyderabad", "Pune",
    "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow",
    "Chandigarh", "Kochi", "Goa", "Indore", "Bhopal",
    "Gurgaon", "Noida", "Guwahati", "Coimbatore", "Dehradun",
    "Patna", "Nagpur", "Amritsar", "Vadodara", "Surat"
];

const INDIAN_CITIES_DATA = [
    { name: "Mumbai", state: "Maharashtra", country: "India" },
    { name: "Delhi NCR", state: "Delhi", country: "India" },
    { name: "Bengaluru", state: "Karnataka", country: "India" },
    { name: "Hyderabad", state: "Telangana", country: "India" },
    { name: "Pune", state: "Maharashtra", country: "India" },
    { name: "Chennai", state: "Tamil Nadu", country: "India" },
    { name: "Kolkata", state: "West Bengal", country: "India" },
    { name: "Ahmedabad", state: "Gujarat", country: "India" },
    { name: "Jaipur", state: "Rajasthan", country: "India" },
    { name: "Lucknow", state: "Uttar Pradesh", country: "India" },
    { name: "Chandigarh", state: "Punjab", country: "India" },
    { name: "Kochi", state: "Kerala", country: "India" },
    { name: "Goa", state: "Goa", country: "India" },
    { name: "Indore", state: "Madhya Pradesh", country: "India" },
    { name: "Bhopal", state: "Madhya Pradesh", country: "India" },
    { name: "Gurgaon", state: "Haryana", country: "India" },
    { name: "Noida", state: "Uttar Pradesh", country: "India" },
    { name: "Guwahati", state: "Assam", country: "India" },
    { name: "Coimbatore", state: "Tamil Nadu", country: "India" },
    { name: "Dehradun", state: "Uttarakhand", country: "India" },
    { name: "Patna", state: "Bihar", country: "India" },
    { name: "Nagpur", state: "Maharashtra", country: "India" },
    { name: "Amritsar", state: "Punjab", country: "India" },
    { name: "Vadodara", state: "Gujarat", country: "India" },
    { name: "Surat", state: "Gujarat", country: "India" },
    { name: "Agra", state: "Uttar Pradesh", country: "India" },
    { name: "Udaipur", state: "Rajasthan", country: "India" },
    { name: "Jodhpur", state: "Rajasthan", country: "India" },
    { name: "Nashik", state: "Maharashtra", country: "India" },
    { name: "Varanasi", state: "Uttar Pradesh", country: "India" },
    { name: "Kanpur", state: "Uttar Pradesh", country: "India" },
    { name: "Visakhapatnam", state: "Andhra Pradesh", country: "India" },
    { name: "Mysuru", state: "Karnataka", country: "India" },
    { name: "Mangaluru", state: "Karnataka", country: "India" },
    { name: "Rishikesh", state: "Uttarakhand", country: "India" },
    { name: "Manali", state: "Himachal Pradesh", country: "India" },
    { name: "Shimla", state: "Himachal Pradesh", country: "India" },
    { name: "Leh", state: "Ladakh", country: "India" },
    { name: "Srinagar", state: "Jammu and Kashmir", country: "India" },
    { name: "Bhubaneswar", state: "Odisha", country: "India" },
    { name: "Raipur", state: "Chhattisgarh", country: "India" },
    { name: "Ranchi", state: "Jharkhand", country: "India" },
    { name: "Rajkot", state: "Gujarat", country: "India" },
    { name: "Gwalior", state: "Madhya Pradesh", country: "India" },
    { name: "Jabalpur", state: "Madhya Pradesh", country: "India" },
    { name: "Ujjain", state: "Madhya Pradesh", country: "India" },
    { name: "Chhatrapati Sambhajinagar", state: "Maharashtra", country: "India" },
    { name: "Madurai", state: "Tamil Nadu", country: "India" },
    { name: "Thiruvananthapuram", state: "Kerala", country: "India" },
    { name: "Kozhikode", state: "Kerala", country: "India" },
    { name: "Ludhiana", state: "Punjab", country: "India" },
    { name: "Jalandhar", state: "Punjab", country: "India" },
    { name: "Meerut", state: "Uttar Pradesh", country: "India" },
    { name: "Ghaziabad", state: "Uttar Pradesh", country: "India" },
    { name: "Faridabad", state: "Haryana", country: "India" },
    { name: "Navi Mumbai", state: "Maharashtra", country: "India" },
    { name: "Thane", state: "Maharashtra", country: "India" },
    { name: "Pondicherry", state: "Puducherry", country: "India" },
    { name: "Shillong", state: "Meghalaya", country: "India" },
    { name: "Gangtok", state: "Sikkim", country: "India" },
    { name: "Darjeeling", state: "West Bengal", country: "India" },
    { name: "Haridwar", state: "Uttarakhand", country: "India" },
    { name: "Nainital", state: "Uttarakhand", country: "India" },
    { name: "Dharamshala", state: "Himachal Pradesh", country: "India" },
    { name: "Pushkar", state: "Rajasthan", country: "India" },
    { name: "Jaisalmer", state: "Rajasthan", country: "India" },
    { name: "Mount Abu", state: "Rajasthan", country: "India" },
    { name: "Kota", state: "Rajasthan", country: "India" },
    { name: "Kolhapur", state: "Maharashtra", country: "India" },
    { name: "Mahabaleshwar", state: "Maharashtra", country: "India" },
    { name: "Lonavala", state: "Maharashtra", country: "India" },
    { name: "Chikmagalur", state: "Karnataka", country: "India" },
    { name: "Coorg", state: "Karnataka", country: "India" },
    { name: "Ooty", state: "Tamil Nadu", country: "India" },
    { name: "Kodaikanal", state: "Tamil Nadu", country: "India" },
    { name: "Wayanad", state: "Kerala", country: "India" },
    { name: "Munnar", state: "Kerala", country: "India" },
    { name: "Varkala", state: "Kerala", country: "India" },
    { name: "Alleppey", state: "Kerala", country: "India" },
    { name: "Tirupati", state: "Andhra Pradesh", country: "India" },
    { name: "Vijayawada", state: "Andhra Pradesh", country: "India" },
    { name: "Warangal", state: "Telangana", country: "India" },
    { name: "Rourkela", state: "Odisha", country: "India" },
    { name: "Siliguri", state: "West Bengal", country: "India" },
    { name: "Prayagraj", state: "Uttar Pradesh", country: "India" },
    { name: "Bareilly", state: "Uttar Pradesh", country: "India" },
    { name: "Aligarh", state: "Uttar Pradesh", country: "India" },
    { name: "Gorakhpur", state: "Uttar Pradesh", country: "India" },
    { name: "Jhansi", state: "Uttar Pradesh", country: "India" },
    { name: "Mathura", state: "Uttar Pradesh", country: "India" },
    { name: "Ayodhya", state: "Uttar Pradesh", country: "India" },
    { name: "Rohtak", state: "Haryana", country: "India" },
    { name: "Panipat", state: "Haryana", country: "India" },
    { name: "Karnal", state: "Haryana", country: "India" },
    { name: "Patiala", state: "Punjab", country: "India" },
    { name: "Jammu", state: "Jammu and Kashmir", country: "India" },
    { name: "Hubli", state: "Karnataka", country: "India" },
    { name: "Belagavi", state: "Karnataka", country: "India" },
    { name: "Salem", state: "Tamil Nadu", country: "India" },
    { name: "Tiruchirappalli", state: "Tamil Nadu", country: "India" },
    { name: "Jamnagar", state: "Gujarat", country: "India" },
    { name: "Bhavnagar", state: "Gujarat", country: "India" },
    { name: "Junagadh", state: "Gujarat", country: "India" },
    { name: "Gandhinagar", state: "Gujarat", country: "India" },
    { name: "Anand", state: "Gujarat", country: "India" },
    { name: "Bhuj", state: "Gujarat", country: "India" },
    { name: "Ratlam", state: "Madhya Pradesh", country: "India" },
    { name: "Sagar", state: "Madhya Pradesh", country: "India" },
    { name: "Satna", state: "Madhya Pradesh", country: "India" },
    { name: "Rewa", state: "Madhya Pradesh", country: "India" },
    { name: "Bilaspur", state: "Chhattisgarh", country: "India" },
    { name: "Dhanbad", state: "Jharkhand", country: "India" },
    { name: "Jamshedpur", state: "Jharkhand", country: "India" },
    { name: "Gaya", state: "Bihar", country: "India" },
    { name: "Muzaffarpur", state: "Bihar", country: "India" },
    { name: "Port Blair", state: "Andaman and Nicobar Islands", country: "India" },
    { name: "Lalitpur", state: "Uttar Pradesh", country: "India" },
    { name: "Lal Bahadur Nagar", state: "Telangana", country: "India" },
    { name: "Lalsot", state: "Rajasthan", country: "India" },
    { name: "Lalganj", state: "Uttar Pradesh", country: "India" },
    { name: "Lalgudi", state: "Tamil Nadu", country: "India" },
    { name: "Lalpur", state: "Gujarat", country: "India" },
    { name: "Lalru", state: "Punjab", country: "India" },
    { name: "Latur", state: "Maharashtra", country: "India" },
    { name: "Lavasa", state: "Maharashtra", country: "India" },
    { name: "Lansdowne", state: "Uttarakhand", country: "India" },
    { name: "Ladakh", state: "Ladakh", country: "India" }
].map(item => ({
    ...item,
    displaySubtitle: `${item.state}, ${item.country}`,
    id: `local-${item.name}-${item.state}`
}));

/**
 * Free geocoding search using Open-Meteo Geocoding API with Photon fallback
 */
async function fetchCitySuggestions(query, signal) {
    const clean = query.trim();
    if (!clean) return [];

    // 1. Primary: Open-Meteo Geocoding API (Fast, Free, CORS enabled, No API key)
    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(clean)}&count=20&language=en&format=json`;
        const res = await fetch(url, { signal });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.results) && data.results.length > 0) {
                const seen = new Set();
                const mapped = [];

                // Prioritize Indian results strictly so foreign cities (like Lakeland Florida, Sudan, Iran) don't clutter Indian searches
                const indianOnly = data.results.filter(
                    item => item.country_code === 'IN' || (item.country || '').toLowerCase() === 'india'
                );
                const candidates = indianOnly.length > 0 ? indianOnly : data.results;

                for (const item of candidates) {
                    const name = item.name || '';
                    const state = item.admin1 || item.admin2 || '';
                    const country = item.country || '';
                    const key = `${name.toLowerCase()}-${state.toLowerCase()}`;
                    if (name && !seen.has(key)) {
                        seen.add(key);
                        mapped.push({
                            name,
                            state,
                            country,
                            displaySubtitle: [state, country].filter(Boolean).join(', '),
                            id: item.id || key,
                        });
                    }
                }
                if (mapped.length > 0) return mapped;
            }
        }
    } catch (err) {
        if (err.name === 'AbortError') throw err;
    }

    // 2. Secondary Fallback: Photon by Komoot (Filter for India using India bounding box & country tag)
    try {
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(clean)}&limit=20&lang=en&bbox=68.1,6.5,97.4,35.5`;
        const res = await fetch(photonUrl, { signal });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.features) && data.features.length > 0) {
                const seen = new Set();
                const mapped = [];
                const indianFeatures = data.features.filter(
                    f => (f.properties?.countrycode || '').toUpperCase() === 'IN' || (f.properties?.country || '').toLowerCase() === 'india'
                );
                const candidates = indianFeatures.length > 0 ? indianFeatures : data.features;

                for (const feat of candidates) {
                    const p = feat.properties || {};
                    const name = p.name || p.city || '';
                    const state = p.state || '';
                    const country = p.country || '';
                    const key = `${name.toLowerCase()}-${state.toLowerCase()}`;
                    if (name && !seen.has(key)) {
                        seen.add(key);
                        mapped.push({
                            name,
                            state,
                            country,
                            displaySubtitle: [state, country].filter(Boolean).join(', '),
                            id: key,
                        });
                    }
                }
                if (mapped.length > 0) return mapped;
            }
        }
    } catch (err) {
        if (err.name === 'AbortError') throw err;
    }

    return [];
}

function highlightMatch(text, query) {
    if (!query) return text;
    const q = query.trim().toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <span className="suggestion-highlight">{text.slice(idx, idx + q.length)}</span>
            {text.slice(idx + q.length)}
        </>
    );
}

export default function LocationModal({
    isOpen,
    onClose,
    onSelectCity,
    currentCity,
    onAutoDetect,
    isDetecting
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [localDetecting, setLocalDetecting] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef(null);

    // Recent Cities from LocalStorage
    const [recentCities, setRecentCities] = useState(() => {
        try {
            const saved = localStorage.getItem('nx_recent_cities');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setSearchQuery("");
            setSelectedIndex(-1);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Handle Search Queries with Local Match + Debounced Live API
    useEffect(() => {
        const query = searchQuery.trim();
        if (!query) {
            setSuggestions([]);
            setIsLoading(false);
            setSelectedIndex(-1);
            return;
        }

        // 1. Instant Local Matching (0ms latency for smooth typing) - prioritize prefix matches
        const queryLower = query.toLowerCase();
        const prefixMatches = [];
        const otherMatches = [];
        for (const item of INDIAN_CITIES_DATA) {
            const nameLower = item.name.toLowerCase();
            const stateLower = item.state.toLowerCase();
            const formatted = {
                ...item,
                displaySubtitle: item.displaySubtitle || [item.state, item.country].filter(Boolean).join(', ')
            };
            if (nameLower.startsWith(queryLower)) {
                prefixMatches.push(formatted);
            } else if (nameLower.includes(queryLower) || stateLower.includes(queryLower)) {
                otherMatches.push(formatted);
            }
        }
        const localMatches = [...prefixMatches, ...otherMatches].slice(0, 10);

        setSuggestions(localMatches);
        setIsLoading(true);

        // 2. Debounced Live API Call (Open-Meteo + Photon for real global/Indian geocoding data)
        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const apiResults = await fetchCitySuggestions(query, controller.signal);
                if (apiResults && apiResults.length > 0) {
                    const seen = new Set();
                    const merged = [];

                    // Combine API + Local matches: local prefix matches first so exact matches are instant
                    const combined = [...prefixMatches, ...apiResults, ...otherMatches];
                    for (const item of combined) {
                        const key = item.name.toLowerCase();
                        if (!seen.has(key)) {
                            seen.add(key);
                            merged.push(item);
                        }
                    }
                    setSuggestions(merged.slice(0, 10));
                }
            } catch (err) {
                // Aborted or network error, keep local matches
            } finally {
                setIsLoading(false);
            }
        }, 220);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [searchQuery]);

    if (!isOpen) return null;

    const saveRecentCity = (cityName) => {
        try {
            const updated = [
                cityName,
                ...recentCities.filter(c => c.toLowerCase() !== cityName.toLowerCase())
            ].slice(0, 5);
            setRecentCities(updated);
            localStorage.setItem('nx_recent_cities', JSON.stringify(updated));
        } catch { }
    };

    const handleCityClick = (city) => {
        const cleanName = typeof city === 'string' ? city.trim() : (city?.name || '').trim();
        if (!cleanName) return;
        saveRecentCity(cleanName);
        onSelectCity(cleanName);
        setSearchQuery("");
        onClose();
    };

    const handleClearRecent = (e) => {
        e.stopPropagation();
        setRecentCities([]);
        localStorage.removeItem('nx_recent_cities');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleCityClick(suggestions[selectedIndex].name);
            return;
        }
        if (suggestions.length > 0) {
            handleCityClick(suggestions[0].name);
            return;
        }
        if (searchQuery.trim()) {
            handleCityClick(searchQuery.trim());
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    // Auto Detect Location with Native Geolocation & Nominatim fallback
    const handleAutoDetectClick = async () => {
        if (onAutoDetect && typeof onAutoDetect === 'function' && onAutoDetect.toString().length > 25) {
            onAutoDetect();
            return;
        }

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setLocalDetecting(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                    );
                    const data = await response.json();
                    const cityName =
                        data.address.city ||
                        data.address.town ||
                        data.address.village ||
                        data.address.state_district ||
                        data.address.county ||
                        "";
                    if (cityName) {
                        handleCityClick(cityName);
                    } else {
                        handleCityClick("Unknown");
                    }
                } catch (err) {
                    console.error("Auto detect location error:", err);
                } finally {
                    setLocalDetecting(false);
                }
            },
            (error) => {
                console.warn("Geolocation permission error:", error);
                setLocalDetecting(false);
            },
            { timeout: 10000 }
        );
    };

    const handleBackdropClick = (e) => {
        if (e.target.className === 'location-modal-backdrop') {
            onClose();
        }
    };

    const isDetectingActive = isDetecting || localDetecting;
    const isSearching = searchQuery.trim().length > 0;

    return createPortal(
        <div className="location-modal-backdrop" onClick={handleBackdropClick}>
            <div className="location-modal-container">
                {/* Close Button */}
                <button className="location-modal-close" onClick={onClose} aria-label="Close modal">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                {/* Title */}
                <h2 className="location-modal-title">Select Your Location</h2>

                {/* Search & Auto Detect Row */}
                <div className="location-modal-search-row">
                    <form className="location-modal-search-form" onSubmit={handleSearchSubmit}>
                        <div className="search-input-wrapper">
                            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                className="search-input"
                                placeholder="Search for any city, area, or state..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="search-clear-btn"
                                    onClick={() => {
                                        setSearchQuery("");
                                        inputRef.current?.focus();
                                    }}
                                    aria-label="Clear search"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </form>

                    <button
                        type="button"
                        className={`auto-detect-btn ${isDetectingActive ? 'detecting' : ''}`}
                        onClick={handleAutoDetectClick}
                        disabled={isDetectingActive}
                    >
                        <svg className="crosshair-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="3"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                        </svg>
                        <span>{isDetectingActive ? "Detecting..." : "Auto Detect"}</span>
                    </button>
                </div>

                {/* ── CASE 1: USER IS TYPING -> SHOW REAL SUGGESTIONS LIST ── */}
                {isSearching ? (
                    <div className="location-modal-suggestions-wrap">
                        <div className="suggestions-header">
                            <div className="suggestions-header-left">
                                <span className="suggestions-title">
                                    Suggestions for <strong>&quot;{searchQuery}&quot;</strong>
                                </span>
                                {suggestions.length > 0 && (
                                    <span className="suggestions-count-badge">
                                        {suggestions.length} {suggestions.length === 1 ? 'match' : 'matches'}
                                    </span>
                                )}
                            </div>
                            {isLoading && (
                                <div className="suggestions-loading-indicator">
                                    <span className="suggestions-spinner" aria-label="Loading suggestions" />
                                    <span>Searching...</span>
                                </div>
                            )}
                        </div>

                        <div className="suggestions-grid" role="listbox">
                            {suggestions.map((item, idx) => {
                                const isSelected = idx === selectedIndex;
                                const isCurrent = currentCity && currentCity.toLowerCase() === item.name.toLowerCase();

                                return (
                                    <button
                                        key={item.id || `${item.name}-${idx}`}
                                        type="button"
                                        className={`suggestion-card ${isSelected ? 'is-selected' : ''} ${isCurrent ? 'is-active-city' : ''}`}
                                        onClick={() => handleCityClick(item.name)}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                    >
                                        <div className="suggestion-icon-wrap">
                                            <svg className="suggestion-pin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                                                <circle cx="12" cy="10" r="3"></circle>
                                            </svg>
                                        </div>
                                        <div className="suggestion-text">
                                            <div className="suggestion-name-row">
                                                <span className="suggestion-name">
                                                    {highlightMatch(item.name, searchQuery)}
                                                </span>
                                                {isCurrent && (
                                                    <span className="current-badge">Active</span>
                                                )}
                                            </div>
                                            {item.displaySubtitle && (
                                                <div className="suggestion-sub" title={item.displaySubtitle}>
                                                    {item.displaySubtitle}
                                                </div>
                                            )}
                                        </div>
                                        <svg className="suggestion-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6"></polyline>
                                        </svg>
                                    </button>
                                );
                            })}

                            {/* Option to select user's custom typed city name */}
                            {searchQuery.trim() && (
                                <button
                                    type="button"
                                    className="suggestion-card suggestion-card--custom"
                                    onClick={() => handleCityClick(searchQuery.trim())}
                                >
                                    <div className="suggestion-icon-wrap custom-icon">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="12" y1="8" x2="12" y2="16"></line>
                                            <line x1="8" y1="12" x2="16" y2="12"></line>
                                        </svg>
                                    </div>
                                    <div className="suggestion-text">
                                        <div className="suggestion-name-row">
                                            <span className="suggestion-name">
                                                Use &quot;{searchQuery.trim()}&quot; as my location
                                            </span>
                                        </div>
                                        <div className="suggestion-sub">
                                            Set custom city or area
                                        </div>
                                    </div>
                                    <span className="custom-select-badge">Select</span>
                                </button>
                            )}

                            {!isLoading && suggestions.length === 0 && (
                                <div className="no-cities-card">
                                    <div className="no-cities-icon">📍</div>
                                    <div className="no-cities-title">No city matched &quot;{searchQuery.trim()}&quot;</div>
                                    <div className="no-cities-desc">Click &quot;Use {searchQuery.trim()}&quot; above to set it as your location.</div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    /* ── CASE 2: EMPTY SEARCH -> SHOW RECENT & POPULAR CITIES ── */
                    <div className="location-modal-default-content">
                        {/* Recent Locations (If Any) */}
                        {recentCities.length > 0 && (
                            <div className="location-modal-recent-row">
                                <div className="location-modal-section-head">
                                    <h3 className="location-modal-section-title">Recent Searches</h3>
                                    <button
                                        type="button"
                                        className="clear-recent-btn"
                                        onClick={handleClearRecent}
                                    >
                                        Clear
                                    </button>
                                </div>
                                <div className="recent-cities-chips">
                                    {recentCities.map((cityName) => (
                                        <button
                                            key={cityName}
                                            type="button"
                                            className={`recent-city-chip ${currentCity === cityName ? 'active-chip' : ''}`}
                                            onClick={() => handleCityClick(cityName)}
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                                                <circle cx="12" cy="10" r="3"></circle>
                                            </svg>
                                            <span>{cityName}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Popular Cities Header */}
                        <h3 className="location-modal-section-title">Popular Cities</h3>

                        {/* Cities Grid */}
                        <div className="location-modal-cities-grid">
                            {POPULAR_CITIES.map((city) => (
                                <button
                                    key={city}
                                    type="button"
                                    className={`city-item ${currentCity === city ? 'active-city' : ''}`}
                                    onClick={() => handleCityClick(city)}
                                >
                                    {city}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
