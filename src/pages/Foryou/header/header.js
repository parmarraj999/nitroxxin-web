import React, { useState, useEffect } from "react";
import "./header.css";

export default function RaceDay({ banners }) {
    const [active, setActive] = useState(0);

    const fallbackBanners = [
        { id: 1, imageUrl: "../../../../assets/images/banner-1.jpeg", redirectUrl: "" },
        { id: 2, imageUrl: "../../../../assets/images/banner-2.jpeg", redirectUrl: "" },
        { id: 3, imageUrl: "../../../../assets/images/banner-3.jpeg", redirectUrl: "" },
        { id: 4, imageUrl: "../../../../assets/images/banner-4.jpeg", redirectUrl: "" },
        { id: 5, imageUrl: "../../../../assets/images/banner-5.png", redirectUrl: "" },
    ];

    // Filter banners that have at least an imageUrl or image, otherwise fallback
    const activeBanners = (banners && banners.filter(b => b.imageUrl || b.image).length > 0)
        ? banners.filter(b => b.imageUrl || b.image)
        : fallbackBanners;

    const total = activeBanners.length;

    useEffect(() => {
        const interval = setInterval(() => {
            setActive((a) => (total > 0 ? (a + 1) % total : 0));
        }, 3000);
        return () => clearInterval(interval);
    }, [total]);


    return (
        <div className="slider-wrapper">
            {/* Left Arrow */}
            <button className="nav-arrow-header left" onClick={() => setActive((a) => (total > 0 ? (a - 1 + total) % total : 0))}>
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left-icon lucide-chevron-left"><path d="m15 18-6-6 6-6" /></svg>
            </button>

            <div className="slide-container">
                <div
                    className="slide-inner"
                    style={{
                        display: "flex",
                        transition: "transform 0.5s ease-in-out",
                        transform: `translateX(-${active * 100}%)`,
                        width: "100%",
                        padding: 0
                    }}
                >
                    {activeBanners.map((slide, index) => {
                        const img = (
                            <img
                                key={slide.id || index} 
                                src={slide.imageUrl || slide.image} 
                                className="slide-image"
                                alt={`Slide ${index + 1}`} 
                            />
                        );
                        const wrapperStyle = {
                            display: 'block',
                            width: '100%',
                            minWidth: '100%',
                            flex: '0 0 100%',
                            padding: 0,
                            margin: 0
                        };

                        if (slide.redirectUrl) {
                            return (
                                <a
                                    key={slide.id || index}
                                    href={slide.redirectUrl}
                                    style={wrapperStyle}
                                >
                                    {img}
                                </a>
                            );
                        }

                        return (
                            <div
                                key={slide.id || index}
                                style={wrapperStyle}
                            >
                                {img}
                            </div>
                        );
                    })}
                </div>

                {/* Dots */}

            </div>
            <div className="slide-dots">
                {activeBanners.map((_, index) => (
                    <button
                        key={index}
                        className={`dot ${index === active ? 'active' : ''}`}
                        onClick={() => setActive(index)}
                        aria-label={`Show slide ${index + 1}`}
                        aria-current={index === active ? 'true' : undefined}
                    />
                ))}
            </div>
            {/* Right Arrow */}
            <button className="nav-arrow-header right" onClick={() => setActive((a) => (total > 0 ? (a + 1) % total : 0))}>
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>


        </div>
    );
}

