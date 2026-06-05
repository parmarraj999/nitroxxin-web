import React, { useState, useEffect } from "react";
import "./header.css";

export default function RaceDay() {
    const [active, setActive] = useState(0);

    const slides = [
        { id: 1, image:"https://i.pinimg.com/736x/5b/44/85/5b4485c04865377bde41755d40a915f5.jpg" },
        { id: 2, image:"https://i.pinimg.com/736x/3d/d8/32/3dd832109de044c1656d57f8f3be95a8.jpg" },
        { id: 3, image:"https://i.pinimg.com/736x/16/a5/96/16a5963ca1bb790fdb9d84b6b9cb3e0e.jpg" },
        { id: 4, image:"https://i.pinimg.com/736x/93/18/06/9318064ec61c854868362bca42d30774.jpg" },
        { id: 5, image:"https://i.pinimg.com/736x/50/1b/6a/501b6aa4833b4fed2f0be09f0daf67e7.jpg" },
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
            <button className="nav-arrow left" onClick={() => setActive((a) => (a - 1 + total) % total)}>
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
                            style={{ 
                                minWidth: "100%", 
                                height: "640px", 
                                objectFit: "cover", 
                                borderRadius: "12px" 
                            }} 
                            alt={`Slide ${slide.id}`} 
                        />
                    ))}
                </div>

                {/* Dots */}

            </div>
            <div className="slide-dots">
                {slides.map((_, index) => (
                    <div
                        key={index}
                        className={`dot ${index === active ? 'active' : ''}`}
                        onClick={() => setActive(index)}
                        style={{ cursor: "pointer" }}
                    />
                ))}
            </div>
            {/* Right Arrow */}
            <button className="nav-arrow right" onClick={() => setActive((a) => (a + 1) % total)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>


        </div>
    );
}

