import { useEffect, useState, useMemo } from "react";
import "./accessoriesHero.css";
import { useAuth } from "../../../../context/AuthContext";
import { useAuthModal } from "../../../../components/AuthModal/useAuthModal";
import { addToCart, saveWishlistItem } from "../../../../services/commerceService";
import { formatPrice } from "../../../../utils/dataFormatters";

/**
 * Helper to resolve recognized color names to hex codes for swatch display.
 */
const getColorHex = (name) => {
  const s = String(name || "").toLowerCase();
  if (s.includes("black") || s.includes("dark") || s.includes("carbon")) return "#1c1917";
  if (s.includes("white")) return "#f8fafc";
  if (s.includes("red") || s.includes("crimson")) return "#dc2626";
  if (s.includes("blue") || s.includes("navy")) return "#2563eb";
  if (s.includes("green") || s.includes("olive")) return "#16a34a";
  if (s.includes("yellow") || s.includes("neon") || s.includes("hi-viz")) return "#eab308";
  if (s.includes("orange")) return "#ea580c";
  if (s.includes("grey") || s.includes("gray") || s.includes("titanium") || s.includes("silver")) return "#6b7280";
  if (s.includes("gold") || s.includes("bronze")) return "#ca8a04";
  if (s.includes("brown") || s.includes("tan")) return "#78350f";
  return "#475569";
};

export function AccessoriesHero({ product }) {
  const [qty, setQty] = useState(1);
  const { user } = useAuth();
  const { openLogin } = useAuthModal();

  const productImages = useMemo(() => {
    return product?.images?.length ? product.images : [product?.image].filter(Boolean);
  }, [product]);

  const [activeImg, setActiveImg] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [wishlistAdded, setWishlistAdded] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // ── Normalize raw variants array from vendor data ──
  const rawVariants = useMemo(() => {
    if (Array.isArray(product?.variants)) return product.variants;
    if (Array.isArray(product?.variantList)) return product.variantList;
    return [];
  }, [product]);

  const hasArrayVariants = rawVariants.length > 0;

  // ── Dynamically extract all option dimensions (e.g. Color, Size, etc.) ──
  const optionDimensions = useMemo(() => {
    if (hasArrayVariants) {
      const dimMap = new Map();
      rawVariants.forEach((v) => {
        if (!v.options || typeof v.options !== "object") return;
        Object.entries(v.options).forEach(([k, val]) => {
          if (val === undefined || val === null || String(val).trim() === "") return;
          const cleanVal = String(val).trim();
          const lowerKey = k.toLowerCase().trim();
          if (!dimMap.has(lowerKey)) {
            const label = k.charAt(0).toUpperCase() + k.slice(1);
            dimMap.set(lowerKey, {
              key: lowerKey,
              originalKey: k,
              label,
              valuesSet: new Set(),
            });
          }
          dimMap.get(lowerKey).valuesSet.add(cleanVal);
        });
      });

      return Array.from(dimMap.values()).map((dim) => ({
        key: dim.key,
        originalKey: dim.originalKey,
        label: dim.label,
        values: Array.from(dim.valuesSet),
      }));
    }

    // Legacy fallback (when product.variants is not an array of objects)
    const dims = [];
    const colorOpts = product?.colorOptions || product?.variants?.colors || [];
    const sizeOpts =
      product?.variants?.sizes ||
      product?.sizeOptions ||
      product?.sizes ||
      product?.availableSizes ||
      [];

    if (colorOpts.length) {
      dims.push({ key: "color", originalKey: "color", label: "Color", values: colorOpts });
    }
    if (sizeOpts.length) {
      dims.push({ key: "size", originalKey: "size", label: "Size", values: sizeOpts });
    }
    return dims;
  }, [hasArrayVariants, rawVariants, product]);

  // ── Selected option state ──
  const [selectedOptions, setSelectedOptions] = useState({});

  // Initialize selected options on product load
  useEffect(() => {
    if (hasArrayVariants) {
      // Find the first variant with stock > 0, or just first variant
      const firstInStock = rawVariants.find((v) => Number(v.stock ?? 1) > 0) || rawVariants[0];
      if (firstInStock?.options && typeof firstInStock.options === "object") {
        const initial = {};
        Object.entries(firstInStock.options).forEach(([k, v]) => {
          initial[k.toLowerCase().trim()] = String(v).trim();
        });
        setSelectedOptions(initial);
        return;
      }
    }

    // Legacy fallback
    const initial = {};
    optionDimensions.forEach((dim) => {
      if (dim.values.length > 0) {
        initial[dim.key] = dim.values[0];
      }
    });
    setSelectedOptions(initial);
  }, [product?.id, hasArrayVariants, rawVariants, optionDimensions]);

  // ── Find currently active variant matching selected options ──
  const activeVariant = useMemo(() => {
    if (!hasArrayVariants) return null;
    const match = rawVariants.find((v) => {
      if (!v.options || typeof v.options !== "object") return false;
      return Object.entries(selectedOptions).every(([dimKey, dimVal]) => {
        if (!dimVal) return true;
        const matchedKey = Object.keys(v.options).find(
          (k) => k.toLowerCase().trim() === dimKey.toLowerCase().trim()
        );
        if (!matchedKey) return true;
        return String(v.options[matchedKey]).trim().toLowerCase() === String(dimVal).trim().toLowerCase();
      });
    });
    return match || rawVariants[0] || null;
  }, [hasArrayVariants, rawVariants, selectedOptions]);

  // Switch image if variant has its own image
  useEffect(() => {
    if (activeVariant?.image) {
      const idx = productImages.findIndex((img) => img === activeVariant.image);
      if (idx !== -1) {
        setActiveImg(idx);
      }
    }
  }, [activeVariant, productImages]);

  // ── Dynamic Pricing ──
  const variantPrice =
    activeVariant?.price !== undefined && activeVariant.price !== null && activeVariant.price !== ""
      ? Number(activeVariant.price)
      : undefined;

  const variantOfferPrice =
    activeVariant?.offerPrice !== undefined && activeVariant.offerPrice !== null && activeVariant.offerPrice !== ""
      ? Number(activeVariant.offerPrice)
      : undefined;

  const basePrice = Number(product?.price || 0);
  const baseOfferPrice = Number(product?.offerPrice || product?.price || 0);

  const currentSellingPrice = variantOfferPrice ?? variantPrice ?? baseOfferPrice;
  const currentMrp =
    basePrice > currentSellingPrice ? basePrice : variantPrice && variantPrice > currentSellingPrice ? variantPrice : null;

  const discountPct =
    currentMrp && currentSellingPrice && currentMrp > currentSellingPrice
      ? Math.round(((currentMrp - currentSellingPrice) / currentMrp) * 100)
      : null;

  // ── Dynamic Stock ──
  const stockQty =
    activeVariant?.stock !== undefined && activeVariant.stock !== null && activeVariant.stock !== ""
      ? Number(activeVariant.stock)
      : (product?.inventory?.stockQuantity ?? product?.stock ?? null);

  const isLowStock = stockQty !== null && stockQty > 0 && stockQty <= (product?.inventory?.lowStockThreshold || 5);
  const isOutOfStock = stockQty !== null && stockQty <= 0;

  // ── Limited Order Quantity (max 5 per order or limited to available stock) ──
  const MAX_PURCHASE_LIMIT = 5;
  const maxAllowedQty = useMemo(() => {
    if (stockQty !== null && Number.isFinite(stockQty)) {
      if (stockQty <= 0) return 0;
      return Math.min(stockQty, MAX_PURCHASE_LIMIT);
    }
    return MAX_PURCHASE_LIMIT;
  }, [stockQty]);

  useEffect(() => {
    if (maxAllowedQty > 0 && qty > maxAllowedQty) {
      setQty(maxAllowedQty);
    }
  }, [maxAllowedQty, qty]);

  // ── Dynamic SKU ──
  const currentSku = activeVariant?.sku || product?.sku || null;

  // ── Custom Attributes (e.g. weight, warranty, etc.) ──
  const customAttributesList = useMemo(() => {
    const raw = product?.customAttributes;
    if (Array.isArray(raw)) {
      return raw
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const key = String(item.key || item.name || item.label || item.attribute || "").trim();
          const value = item.value !== undefined ? item.value : (item.val !== undefined ? item.val : "");
          return key && value !== "" ? { key, value: String(value) } : null;
        })
        .filter(Boolean);
    }
    if (raw && typeof raw === "object") {
      return Object.entries(raw)
        .map(([k, v]) => ({ key: String(k).trim(), value: String(v) }))
        .filter((item) => item.key && item.value);
    }
    return [];
  }, [product?.customAttributes]);

  // Warranty text resolution (from root field or customAttributes)
  const warrantyText = useMemo(() => {
    if (product?.warranty) return String(product.warranty);
    const attr = customAttributesList.find((a) => a.key.toLowerCase().includes("warr"));
    return attr ? attr.value : "";
  }, [product?.warranty, customAttributesList]);

  // Keyboard navigation for lightbox
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

  // ── Add to Cart (with button loader and limited quantity protection) ──
  const handleAddToCart = async () => {
    if (!user) return openLogin();
    if (isOutOfStock || isAddingToCart) return;

    try {
      setIsAddingToCart(true);
      const cartOptions = {
        ...selectedOptions,
        variantId: activeVariant?.id || "",
        sku: currentSku || "",
        price: currentSellingPrice,
        size: selectedOptions.size || "",
        color: selectedOptions.color || "",
        stock: stockQty,
      };

      const finalQuantity = Math.max(1, Math.min(qty, maxAllowedQty || 5));

      await addToCart({
        userId: user.uid,
        product: {
          ...product,
          price: currentMrp || currentSellingPrice,
          offerPrice: currentSellingPrice,
          sku: currentSku || product.sku,
        },
        quantity: finalQuantity,
        options: cartOptions,
      });

      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 2500);
    } catch (err) {
      console.error("Error adding to cart:", err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlist = async () => {
    if (!user) return openLogin();
    await saveWishlistItem({ userId: user.uid, product });
    setWishlistAdded(true);
    setTimeout(() => setWishlistAdded(false), 2000);
  };

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

        {/* Quick Specs / Meta Chips (SKU, Weight, Warranty, etc.) */}
        {(currentSku || customAttributesList.length > 0) && (
          <div className="product-hero__meta-chips">
            {currentSku && (
              <span className="product-hero__meta-chip product-hero__meta-chip--sku">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                SKU: {currentSku}
              </span>
            )}
            {customAttributesList.map((attr, idx) => (
              <span key={idx} className="product-hero__meta-chip">
                <span className="product-hero__meta-key">{attr.key.charAt(0).toUpperCase() + attr.key.slice(1)}:</span>
                <span className="product-hero__meta-val">{attr.value}</span>
              </span>
            ))}
          </div>
        )}

        {/* Rating */}
        {(product.averageRating > 0 || product.reviewCount > 0) && (
          <div className="product-hero__rating-row">
            <span className="product-hero__stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg
                  key={s}
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={s <= Math.round(product.averageRating || 0) ? "#f59e0b" : "none"}
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
            </span>
            <span className="product-hero__rating-text">{product.averageRating?.toFixed(1)}</span>
            {product.reviewCount > 0 && (
              <span className="product-hero__review-count">({product.reviewCount} reviews)</span>
            )}
          </div>
        )}

        <p className="product-hero__description">
          {product.shortDescription || (typeof product.description === "string" ? product.description : "")}
        </p>

        {/* Dynamic Price Display */}
        <div className="product-hero__price-row">
          <span className="product-hero__price-new">
            {formatPrice(currentSellingPrice)}
          </span>
          {discountPct && currentMrp && (
            <span className="product-hero__price-old">
              {formatPrice(currentMrp)}
            </span>
          )}
          {discountPct && (
            <span className="product-hero__discount-badge">-{discountPct}%</span>
          )}
        </div>

        {/* Stock status */}
        {isOutOfStock ? (
          <span className="product-hero__stock product-hero__stock--out">Out of Stock</span>
        ) : isLowStock ? (
          <span className="product-hero__stock product-hero__stock--low">
            Only {stockQty} left! Order soon
          </span>
        ) : stockQty > 0 ? (
          <span className="product-hero__stock product-hero__stock--in">
            In Stock ({stockQty} available)
          </span>
        ) : null}

        {/* Vendor pill */}
        <div className="product-hero__seller-pill">
          <span className="product-hero__seller-label">Sold & Shipped by:</span>
          <a href="#about-vendor" className="product-hero__seller-link">
            {product.vendorName || product.brand || "Nitroxx Official Store"}
            <span className="product-hero__seller-badge" title="Verified Marketplace Seller">✓</span>
          </a>
        </div>

        {/* ── Dynamic Option Dimensions (e.g. Color, Size, etc.) ── */}
        {optionDimensions.map((dim) => {
          const selectedVal = selectedOptions[dim.key] || "";
          const isColorDim = dim.key.includes("color");

          return (
            <div key={dim.key} className="product-hero__dimension-group">
              <p className="product-hero__size-label">
                {dim.label}: <strong>{selectedVal || "Select"}</strong>
              </p>

              {isColorDim ? (
                <div className="product-hero__color-pills">
                  {dim.values.map((val) => {
                    const isSelected =
                      String(selectedVal).trim().toLowerCase() === String(val).trim().toLowerCase();
                    const hex = getColorHex(val);
                    return (
                      <button
                        key={val}
                        type="button"
                        className={`product-hero__color-pill${isSelected ? " active" : ""}`}
                        onClick={() => setSelectedOptions((prev) => ({ ...prev, [dim.key]: val }))}
                        title={val}
                      >
                        <span
                          className="product-hero__color-swatch-dot"
                          style={{ backgroundColor: hex }}
                        />
                        <span>{val}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="product-hero__option-pills">
                  {dim.values.map((val) => {
                    const isSelected =
                      String(selectedVal).trim().toLowerCase() === String(val).trim().toLowerCase();
                    return (
                      <button
                        key={val}
                        type="button"
                        className={`product-hero__option-pill${
                          String(val).length > 2 ? " product-hero__option-pill--wide" : ""
                        }${isSelected ? " active" : ""}`}
                        onClick={() => setSelectedOptions((prev) => ({ ...prev, [dim.key]: val }))}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Quantity (Limited quantity control) */}
        <div className="product-hero__qty-header">
          <p className="product-hero__qty-label">Quantity</p>
          <span className="product-hero__qty-limit-tag">
            (Max {maxAllowedQty} units per order)
          </span>
        </div>
        <div className="product-hero__qty-control">
          <button
            type="button"
            className="product-hero__qty-btn"
            onClick={() => setQty((prev) => Math.max(1, prev - 1))}
            disabled={isOutOfStock || qty <= 1 || isAddingToCart}
            title={qty <= 1 ? "Minimum 1 item" : "Decrease quantity"}
            aria-label="Decrease quantity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
            </svg>
          </button>
          <div className="product-hero__qty-divider" />
          <span className="product-hero__qty-value">{qty}</span>
          <div className="product-hero__qty-divider" />
          <button
            type="button"
            className="product-hero__qty-btn"
            onClick={() => setQty((prev) => Math.min(maxAllowedQty, prev + 1))}
            disabled={isOutOfStock || qty >= maxAllowedQty || isAddingToCart}
            title={qty >= maxAllowedQty ? `Maximum limited quantity of ${maxAllowedQty} reached` : "Increase quantity"}
            aria-label="Increase quantity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
          </button>
        </div>

        {/* Action buttons (with Add to Cart loader button) */}
        <div className="product-hero__actions">
          <button
            type="button"
            className={`product-hero__btn-cart${cartAdded ? " added" : ""}${isAddingToCart ? " loading" : ""}`}
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAddingToCart}
          >
            {isAddingToCart ? (
              <>
                <span className="product-hero__btn-spinner" />
                <span>Adding to Cart...</span>
              </>
            ) : cartAdded ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Added to Cart!</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
              </>
            )}
          </button>
          <button
            type="button"
            className={`product-hero__btn-wishlist${wishlistAdded ? " added" : ""}`}
            onClick={handleWishlist}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={wishlistAdded ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishlistAdded ? "Saved!" : "Wishlist"}
          </button>
        </div>

        {/* Trust badges */}
        <div className="product-hero__trust-badges">
          {warrantyText && (
            <div className="product-hero__badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>{warrantyText.toLowerCase().includes("warr") ? warrantyText : `${warrantyText} Warranty`}</span>
            </div>
          )}
          {product.returnPolicy && (
            <div className="product-hero__badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
              <span>{product.returnPolicy}</span>
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
            <button
              className="ph-lightbox__arrow ph-lightbox__arrow--left"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((p) => (p === 0 ? productImages.length - 1 : p - 1));
              }}
              aria-label="Previous"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
          )}

          <div className="ph-lightbox__content" onClick={(e) => e.stopPropagation()}>
            <img src={productImages[lightboxIndex]} alt={`${product.name} ${lightboxIndex + 1}`} className="ph-lightbox__img" />
            <div className="ph-lightbox__counter">{lightboxIndex + 1} / {productImages.length}</div>
          </div>

          {productImages.length > 1 && (
            <button
              className="ph-lightbox__arrow ph-lightbox__arrow--right"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((p) => (p === productImages.length - 1 ? 0 : p + 1));
              }}
              aria-label="Next"
            >
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
