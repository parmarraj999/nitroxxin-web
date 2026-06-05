import React from 'react';
import './marquee.css';

export default function Marquee() {
    const text = "JOIN BIKE CULTURE WHEREVER YOU ARE • ";
    const repeatedText = text.repeat(10); // Repeat enough times to fill screen twice over

    return (
        <div className="marquee-container">
            <div className="marquee-content">
                <span className="marquee-text">{repeatedText}</span>
                <span className="marquee-text">{repeatedText}</span>
            </div>
        </div>
    );
}
