import React, { useEffect, useState } from 'react';
import './bottomNav.css';
import { useLocation, useNavigate } from 'react-router-dom';

export default function BottomNav() {
    const [activeTab, setActiveTab] = useState('For You');

    const [city, setCity] = useState("");
    const {pathname} = useLocation();

    useEffect(() => {
        getUserCity();
    }, []);

    const navigate = useNavigate();

    const getUserCity = async () => {

        if (!navigator.geolocation) {
            setCity("Location unavailable");
            return;
        }

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
                        "";

                    setCity(cityName);

                } catch (error) {
                    setCity("Location unavailable");
                }
            },
            () => {
                setCity("Location unavailable");
            }
        );
    };

    return (
        <div className="bottom-nav-wrapper" style={pathname.includes('/profile') ? {display:"none"} : {}}>
            <div className="bottom-nav-tabs">
                <button
                    className={`nav-tab ${activeTab === 'For You' ? 'active-red' : ''}`}
                    onClick={() => {
                        setActiveTab('For You');
                        navigate('/');  
                    }}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c-2.276-2.276-2-6-2-6s1 2 2 2c2.828 0 4 2.172 4 4.5A4.5 4.5 0 0 1 8.5 14.5z" /><path d="M12 22a7 7 0 1 0 0-14c1 0 2 2 2 2a4 4 0 1 1-4 4" /></svg>
                    <span>For You</span>
                </button>

                <button
                    className={`nav-tab ${activeTab === 'Events' ? 'active-red' : ''}`}
                    onClick={() => {
                        setActiveTab('Events');
                        navigate('/events');    
                    }}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M12 9v6" /><path d="M12 5v2" /><path d="M12 17v2" /></svg>
                    <span>Events</span>
                </button>

                <button
                    className={`nav-tab ${activeTab === 'Accessories' ? 'active-red' : ''}`}
                    onClick={() => {
                        setActiveTab('Accessories');
                        navigate('/accessories');
                    }}
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="2.5" /><circle cx="18.5" cy="17.5" r="2.5" /><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-3 11.5V14l-3-3 4-3 2 3h2" /></svg>
                    <span>Accessories</span>
                </button>
            </div>

            {/* <div className="bottom-nav-location"> */}
            <button className="location-btn">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                <span>{city || 'Loading...'}</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
            </button>
            {/* </div> */}
        </div>
    )
}
