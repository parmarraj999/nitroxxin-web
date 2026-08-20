import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './LocationModal.css';

const POPULAR_CITIES = [
    "Mumbai", "Delhi NCR", "Bengaluru", "Hyderabad", "Pune",
    "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow",
    "Chandigarh", "Kochi", "Goa", "Indore", "Gurgaon",
    "Noida", "Guwahati", "Coimbatore", "Dehradun", "Patna",
    "Nagpur", "Amritsar", "Vadodara", "Surat", "Agra"
];

export default function LocationModal({ isOpen, onClose, onSelectCity, currentCity, onAutoDetect, isDetecting }) {
    const [searchQuery, setSearchQuery] = useState("");

    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Filter cities based on search
    const filteredCities = POPULAR_CITIES.filter(city =>
        city.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCityClick = (city) => {
        onSelectCity(city);
        setSearchQuery("");
        onClose();
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // If user hits enter, select the searched text as city
            handleCityClick(searchQuery.trim());
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target.className === 'location-modal-backdrop') {
            onClose();
        }
    };

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
                            {/* <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg> */}
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search for any City..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </form>

                    <button 
                        className={`auto-detect-btn ${isDetecting ? 'detecting' : ''}`}
                        onClick={onAutoDetect}
                        disabled={isDetecting}
                    >
                        <svg className="crosshair-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="3"></circle>
                            <line x1="12" y1="1" x2="12" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="23"></line>
                            <line x1="1" y1="12" x2="3" y2="12"></line>
                            <line x1="21" y1="12" x2="23" y2="12"></line>
                        </svg>
                        <span>{isDetecting ? "Detecting..." : "Auto Detect"}</span>
                    </button>
                </div>

                {/* Popular Cities Header */}
                <h3 className="location-modal-section-title">Popular Cities</h3>

                {/* Cities Grid */}
                <div className="location-modal-cities-grid">
                    {filteredCities.length > 0 ? (
                        filteredCities.map((city) => (
                            <button
                                key={city}
                                className={`city-item ${currentCity === city ? 'active-city' : ''}`}
                                onClick={() => handleCityClick(city)}
                            >
                                {city}
                            </button>
                        ))
                    ) : searchQuery.trim() ? (
                        // If searching a custom city, allow clicking to select it
                        <button
                            className="city-item custom-search-item"
                            onClick={() => handleCityClick(searchQuery.trim())}
                        >
                            Select "{searchQuery.trim()}"
                        </button>
                    ) : (
                        <div className="no-cities-msg">No cities found</div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
