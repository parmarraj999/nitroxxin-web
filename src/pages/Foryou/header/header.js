import React, { useState, useEffect } from "react";
import "./header.css";

export default function RaceDay() {
    const [active, setActive] = useState(0);

    const slides = [
        { id: 1, image:"../../../../assets/images/banner-1.jpeg" },
        { id: 2, image:"../../../../assets/images/banner-2.jpeg" },
        { id: 3, image:"../../../../assets/images/banner-3.jpeg" },
        { id: 4, image:"../../../../assets/images/banner-4.jpeg" },
        { id: 5, image:"../../../../assets/images/banner-5.png" },
    ];
    const total = slides.length;

    useEffect(() => {
        const interval = setInterval(() => {
            setActive((a) => (a + 1) % total);
        }, 3000);
        return () => clearInterval(interval);
    }, [total]);


    return (
        <div className="slider-wrapper">
            {/* Left Arrow */}
            <button className="nav-arrow-header left" onClick={() => setActive((a) => (a - 1 + total) % total)}>
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
                    {slides.map((slide) => (
                        <img
                            key={slide.id} 
                            src={slide.image} 
                            className="slide-image"
                            alt={`Slide ${slide.id}`} 
                        />
                    ))}
                </div>

                {/* Dots */}

            </div>
            <div className="slide-dots">
                {slides.map((_, index) => (
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
            <button className="nav-arrow-header right" onClick={() => setActive((a) => (a + 1) % total)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>


        </div>
    );
}

