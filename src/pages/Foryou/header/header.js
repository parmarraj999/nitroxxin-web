
import React, { useState } from "react";
import "./header.css";

export default function RaceDay() {
    const [active, setActive] = useState(0);
    const total = 5;
    console.log(active)

    return (
        <div className="slider-wrapper">
            {/* Left Arrow */}
            <button className="nav-arrow left" onClick={() => setActive((a) => (a - 1 + total) % total)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-left-icon lucide-chevron-left"><path d="m15 18-6-6 6-6" /></svg>
            </button>

            <div className="slide-container">
                <div className="slide-inner">


                </div>
            </div>

            {/* Right Arrow */}
            <button className="nav-arrow right" onClick={() => setActive((a) => (a + 1) % total)}>
                <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
            </button>
        </div>
    );
}

