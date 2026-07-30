import { useEffect, useState } from "react";
import "./accessoriesHero.css";
import { useAuth } from "../../../../context/AuthContext";
import { useAuthModal } from "../../../../components/AuthModal/useAuthModal";
import { addToCart, saveWishlistItem } from "../../../../services/commerceService";

export function AccessoriesHero({ product }) {
  const [qty, setQty] = useState(1);
  const sizeOptions = product?.variants?.sizes || product?.sizeOptions || product?.sizes || product?.availableSizes || [];
  const colorOptions = product?.colorOptions || product?.variants?.colors || [];
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0] || "");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0] || "");
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  const productImages = product?.images?.length ? product.images : [product?.image].filter(Boolean);
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [wishlistAdded, setWishlistAdded] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  // Keyboard nav for lightbox
  useEffect(() => {
    if (lightboxIndex === null) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const handleKey = (e) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft") setLightboxIndex((p) => (p === 0 ? productImages.length - 1 : p - 1));
      if (e.key === "ArrowRight") setLightboxIndex((p) => (p === productImages.length - 1 ? 0 : p + 1));
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, productImages.length]);

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

  const handleAddToCart = async () => {
    if (!user) return openLogin();
    await addToCart({ userId: user.uid, product, quantity: qty, options: { size: selectedSize, color: selectedColor } });
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
  };

  const handleWishlist = async () => {
    if (!user) return openLogin();
    await saveWishlistItem({ userId: user.uid, product });
    setWishlistAdded(true);
    setTimeout(() => setWishlistAdded(false), 2000);
  };

  const discountPct = product.price && product.offerPrice && product.price !== product.offerPrice
    ? Math.round(((product.price - product.offerPrice) / product.price) * 100)
    : null;

  const stockQty = product.inventory?.stockQuantity ?? product.stock ?? null;
  const isLowStock = stockQty !== null && stockQty > 0 && stockQty <= (product.inventory?.lowStockThreshold || 5);
  const isOutOfStock = stockQty === 0;

  return (
    <section className="product-hero">
      {/* ── Thumbnail strip ── */}
      <div className="product-hero__thumbnails">
        {productImages.map((src, i) => (
          <div
            key={src || i}
            className={`product-hero__thumb-wrap${activeImg === i ? " active" : ""}`}
            onClick={() => setActiveImg(i)}
          >
            <img className="product-hero__thumbnail" src={src} alt={`View ${i + 1}`} />
          </div>
        ))}
      </div>

      {/* ── Main image ── */}
      <div className="product-hero__main-image-wrap" onClick={() => setLightboxIndex(activeImg)}>
        {productImages[activeImg] ? (
          <>
            <img
              className="product-hero__main-image"
              src={productImages[activeImg]}
              alt={product.name}
            />
            <div className="product-hero__zoom-hint">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              Click to zoom
            </div>
          </>
        ) : (
          <span className="product-hero__no-image">No image</span>
        )}
      </div>

      {/* ── Product info ── */}
      <div className="product-hero__info">
        {/* Breadcrumb */}
        <p className="product-hero__category">
          {product.category && <span>{product.category}</span>}
          {product.subCategory && <><span className="product-hero__breadcrumb-sep"> › </span><span>{product.subCategory}</span></>}
          {product.childCategory && <><span className="product-hero__breadcrumb-sep"> › </span><span>{product.childCategory}</span></>}
        </p>

        <p className="product-hero__brand">{product.brand || product.vendorName}</p>
        <p className="product-hero__title">{product.name}</p>
        {product.subtitle && <p className="product-hero__subtitle">{product.subtitle}</p>}

        {/* Rating */}
        {(product.averageRating > 0 || product.reviewCount > 0) && (
          <div className="product-hero__rating-row">
            <span className="product-hero__stars">
              {[1,2,3,4,5].map((s) => (
                <svg key={s} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                  fill={s <= Math.round(product.averageRating || 0) ? "#f59e0b" : "none"}
                  stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ))}
            </span>
            <span className="product-hero__rating-text">{product.averageRating?.toFixed(1)}</span>
            {product.reviewCount > 0 && <span className="product-hero__review-count">({product.reviewCount} reviews)</span>}
          </div>
        )}

        <p className="product-hero__description">
          {product.shortDescription || (typeof product.description === "string" ? product.description : "")}
        </p>

        {/* Price */}
        <div className="product-hero__price-row">
          {discountPct && <span className="product-hero__discount-badge">-{discountPct}%</span>}
          <span className="product-hero__price-new">
            {product.offerPriceText || product.priceText || product.offerPrice || product.price}
          </span>
          {discountPct && (
            <span className="product-hero__price-old">
              {product.priceText || product.price}
            </span>
          )}
        </div>

        {/* Stock status */}
        {isOutOfStock ? (
          <span className="product-hero__stock product-hero__stock--out">Out of Stock</span>
        ) : isLowStock ? (
          <span className="product-hero__stock product-hero__stock--low">Only {stockQty} left!</span>
        ) : stockQty > 0 ? (
          <span className="product-hero__stock product-hero__stock--in">In Stock</span>
        ) : null}

        {/* Color options */}
        {colorOptions.length > 0 && (
          <>
            <p className="product-hero__size-label">Color: <strong>{selectedColor}</strong></p>
            <div className="product-hero__colors">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  className={`product-hero__color-btn${selectedColor === color ? " active" : ""}`}
                  onClick={() => setSelectedColor(color)}
                  title={color}
                />
              ))}
            </div>
          </>
        )}

        {/* Size */}
        {sizeOptions.length > 0 && (
          <>
            <p className="product-hero__size-label">Size: <strong>{selectedSize}</strong></p>
            <div className="product-hero__sizes">
              {sizeOptions.map((size) => (
                <button
                  key={size}
                  className={`product-hero__size-btn${String(size).length > 2 ? " product-hero__size-btn--xl" : ""}${selectedSize === size ? " active" : ""}`}
                  onClick={() => setSelectedSize(size)}
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
          <button className={`product-hero__btn-cart${cartAdded ? " added" : ""}`} onClick={handleAddToCart} disabled={isOutOfStock}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {cartAdded
                ? <polyline points="20 6 9 17 4 12"/>
                : <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>
              }
            </svg>
            {cartAdded ? "Added!" : "Add to Cart"}
          </button>
          <button className={`product-hero__btn-wishlist${wishlistAdded ? " added" : ""}`} onClick={handleWishlist}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={wishlistAdded ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            {wishlistAdded ? "Saved!" : "Wishlist"}
          </button>
        </div>

        {/* Trust badges */}
        <div className="product-hero__trust-badges">
          {product.returnPolicy && (
            <div className="product-hero__badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
              <span>{product.returnPolicy}</span>
            </div>
          )}
          {product.warranty && (
            <div className="product-hero__badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>{product.warranty}</span>
            </div>
          )}
          {product.shipping?.dispatchTime && (
            <div className="product-hero__badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="1"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              <span>Ships in {product.shipping.dispatchTime}</span>
            </div>
          )}
          {product.countryOfManufacture && (
            <div className="product-hero__badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              <span>Made in {product.countryOfManufacture}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && (
        <div className="ph-lightbox" onClick={() => setLightboxIndex(null)}>
          <button className="ph-lightbox__close" onClick={() => setLightboxIndex(null)} aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          {productImages.length > 1 && (
            <button className="ph-lightbox__arrow ph-lightbox__arrow--left"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((p) => (p === 0 ? productImages.length - 1 : p - 1)); }}
              aria-label="Previous">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}

          <div className="ph-lightbox__content" onClick={(e) => e.stopPropagation()}>
            <img src={productImages[lightboxIndex]} alt={`${product.name} ${lightboxIndex + 1}`} className="ph-lightbox__img" />
            <div className="ph-lightbox__counter">{lightboxIndex + 1} / {productImages.length}</div>
          </div>

          {productImages.length > 1 && (
            <button className="ph-lightbox__arrow ph-lightbox__arrow--right"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((p) => (p === productImages.length - 1 ? 0 : p + 1)); }}
              aria-label="Next">
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          )}

          {productImages.length > 1 && (
            <div className="ph-lightbox__thumbs-wrap" onClick={(e) => e.stopPropagation()}>
              <div className="ph-lightbox__thumbs-list">
                {productImages.map((src, i) => (
                  <div
                    key={i}
                    className={`ph-lightbox__thumb-item${i === lightboxIndex ? " active" : ""}`}
                    onClick={() => setLightboxIndex(i)}
                  >
                    <img src={src} alt={`Thumb ${i + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
