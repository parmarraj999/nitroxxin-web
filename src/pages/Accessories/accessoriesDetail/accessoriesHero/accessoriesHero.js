import { useState } from "react";
import "./accessoriesHero.css";
import { useAuth } from "../../../../context/AuthContext";
import { useAuthModal } from "../../../../components/AuthModal/useAuthModal";
import { addToCart, saveWishlistItem } from "../../../../services/commerceService";

export function AccessoriesHero({ product }) {
  const [qty, setQty] = useState(1);
  const sizeOptions = product?.variants?.sizes || product?.sizes || product?.availableSizes || [];
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0] || "");
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  if (!product) {
    return (
      <section className="product-hero product-hero--empty">
        <div className="nx-empty-state nx-empty-state--light">
          <h3>Product not available</h3>
          <p>This product is not published or could not be found in Firestore.</p>
        </div>
      </section>
    );
  }

  const productImages = product.images?.length ? product.images : [product.image].filter(Boolean);

  const handleAddToCart = async () => {
    if (!user) return openLogin();
    await addToCart({ userId: user.uid, product, quantity: qty, options: { size: selectedSize } });
  };

  const handleWishlist = async () => {
    if (!user) return openLogin();
    await saveWishlistItem({ userId: user.uid, product });
  };

  return (
    <section className="product-hero">
      {/* Thumbnail strip */}
      <div className="product-hero__thumbnails">
        {productImages.map((src, i) => <img key={src || i} className="product-hero__thumbnail" src={src} alt={`Product view ${i + 1}`} />)}
      </div>

      {/* Main image */}
      <div className="product-hero__main-image-wrap">
        {product.image || productImages[0] ? (
          <img className="product-hero__main-image" src={product.image || productImages[0]} alt={product.name} />
        ) : (
          <span>No image</span>
        )}
      </div>

      {/* Product info */}
      <div className="product-hero__info">
        <p className="product-hero__category">{product.category || "Accessory"}</p>
        <p className="product-hero__brand">{product.brand || product.vendorName}</p>
        <p className="product-hero__title">{product.name}</p>
        <p className="product-hero__description">{typeof (product.description || product.shortDescription || product.highlights) === 'object' ? JSON.stringify(product.description || product.shortDescription || product.highlights) : (product.description || product.shortDescription || product.highlights)}</p>

        {/* Price */}
        <div className="product-hero__price-row">
          <span className="product-hero__price-old">{product.priceText || product.price}</span>
          <span className="product-hero__price-new">
            {product.offerPriceText || product.offerPrice || product.priceText || product.price}
          </span>
          {product.offerPrice && product.price && product.offerPrice !== product.price && (
            <span className="product-hero__discount">(Sale)</span>
          )}
        </div>

        {/* Size */}
        {sizeOptions.length > 0 && (
          <>
            <p className="product-hero__size-label">Size:</p>
            <div className="product-hero__sizes">
              {sizeOptions.map((size) => (
                <button
                  key={size}
                  className={`product-hero__size-btn${String(size).length > 2 ? " product-hero__size-btn--xl" : ""}`}
                  onClick={() => setSelectedSize(size)}
                  style={selectedSize === size ? { background: "#000", color: "#fff" } : {}}
                >
                  {size}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Quantity */}
        <p className="product-hero__qty-label">Quantity</p>
        <div className="product-hero__qty-control">
          <button className="product-hero__qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
            </svg>
          </button>
          <div className="product-hero__qty-divider" />
          <span className="product-hero__qty-value">{qty}</span>
          <div className="product-hero__qty-divider" />
          <button className="product-hero__qty-btn" onClick={() => setQty(qty + 1)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </button>
        </div>

        {/* Action buttons */}
        <div className="product-hero__actions">
          <button className="product-hero__btn-cart" onClick={handleAddToCart}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Add to Cart
          </button>
          <button className="product-hero__btn-wishlist" onClick={handleWishlist}>Wishlist</button>
        </div>

        {/* Return badge */}
        <div className="product-hero__return">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 14 4 9l5-5"/>
            <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>
          </svg>
          <span className="product-hero__return-text">7-Day Return</span>
        </div>
      </div>
    </section>
  );
}
