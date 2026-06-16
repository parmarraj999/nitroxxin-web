import { useState } from "react";
import "./accessoriesHero.css";

const thumbnails = ['https://i.pinimg.com/1200x/a4/ce/ee/a4ceee635c93ec66fd7e02f098011202.jpg', 'https://i.pinimg.com/1200x/7a/1b/f4/7a1bf4af0939cc78bb4cff8a06bbe76b.jpg', 'https://i.pinimg.com/736x/16/93/e4/1693e4a3d01af97d5d1fbaab98516ee1.jpg', 'https://i.pinimg.com/736x/9d/40/ba/9d40ba856ab1c616c406aa420c9c384f.jpg'];

export function AccessoriesHero() {
    const [qty, setQty] = useState(3);
    const [selectedSize, setSelectedSize] = useState("M");
    const sizes = ["S", "M", "L", "XL", "XXL"];

    return (
        <section className="product-hero">
            {/* Thumbnail strip */}
            <div className="product-hero__thumbnails">
                {thumbnails.map((src, i) => (
                    <img key={i} className="product-hero__thumbnail" src={src} alt={`Product view ${i + 1}`} />
                ))}
            </div>

            {/* Main image */}
            <div className="product-hero__main-image-wrap">
                <img className="product-hero__main-image" src={'https://i.pinimg.com/736x/9d/40/ba/9d40ba856ab1c616c406aa420c9c384f.jpg'} alt="AXOR Helmet Apex Solid Black Dull" />
            </div>

            {/* Product info */}
            <div className="product-hero__info">
                <p className="product-hero__category">Rider Wear</p>
                <p className="product-hero__brand">ALPINESTER</p>
                <p className="product-hero__title">AXOR Helmet Apex Solid Black Dull</p>
                <p className="product-hero__description">
                    Apex, the new sport touring helmet, born to satisfy the needs of the riders looking for maximum stability and aerodynamic performance.
                </p>

                {/* Price */}
                <div className="product-hero__price-row">
                    <span className="product-hero__price-old">$1200</span>
                    <span className="product-hero__price-new">$999</span>
                    <span className="product-hero__discount">(28% Off)</span>
                </div>

                {/* Size */}
                <p className="product-hero__size-label">Size:</p>
                <div className="product-hero__sizes">
                    {sizes.map((s) => (
                        <button
                            key={s}
                            className={`product-hero__size-btn${s === "XXL" ? " product-hero__size-btn--xl" : ""}`}
                            onClick={() => setSelectedSize(s)}
                            style={selectedSize === s ? { background: "#000", color: "#fff" } : {}}
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {/* Quantity */}
                <p className="product-hero__qty-label">Quentity</p>
                <div className="product-hero__qty-control">
                    <button className="product-hero__qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    </button>
                    <div className="product-hero__qty-divider" />
                    <span className="product-hero__qty-value">{qty}</span>
                    <div className="product-hero__qty-divider" />
                    <button className="product-hero__qty-btn" onClick={() => setQty(qty + 1)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus-icon lucide-minus"><path d="M5 12h14" /></svg>
                    </button>
                </div>

                {/* Action buttons */}
                <div className="product-hero__actions">
                    <button className="product-hero__btn-cart">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus-icon lucide-minus"><path d="M5 12h14"/></svg>
                        Add to Cart
                    </button>
                    <button className="product-hero__btn-wishlist">Wishlist</button>
                </div>

                {/* Return badge */}
                <div className="product-hero__return">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-undo2-icon lucide-undo-2"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
                    <span className="product-hero__return-text">7-Day Return</span>
                </div>
            </div>
        </section>
    );
}
