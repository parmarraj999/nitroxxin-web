import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import "./ComboSection.css";
import { useDocument } from "../../hooks/useFirestore";
import { useAccessoriesContext } from "../../context/AccessoriesContext";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../AuthModal/useAuthModal";
import { addToCart } from "../../services/commerceService";

// Fallback high-value combos if none configured yet in Firestore
const DEFAULT_FALLBACK_COMBOS = [
  {
    id: "combo-starter-touring",
    title: "Street & Touring Duo Bundle",
    subtitle: "Complete high-speed protection with aerodynamic full-face helmet, armored mesh gloves & carbon face balaclava.",
    badge: "🔥 Bestseller Combo",
    discountText: "Save 25% OFF",
    bannerUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
    productList: [
      {
        id: "combo-prod-1",
        title: "Axor Apex Venom Aerodynamic Helmet",
        name: "Axor Apex Venom Helmet",
        brand: "Axor",
        category: "Helmets",
        price: 4999,
        offerPrice: 4299,
        imageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "combo-prod-2",
        title: "Kevlar Reinforced Touchscreen Riding Gloves",
        name: "Kevlar Touchscreen Gloves",
        brand: "Rynox",
        category: "Riding Gloves",
        price: 2499,
        offerPrice: 1999,
        imageUrl: "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "combo-prod-3",
        title: "Anti-Pollution Thermal Rider Balaclava",
        name: "Thermal Rider Balaclava",
        brand: "Nitroxx",
        category: "Balaclava",
        price: 899,
        offerPrice: 599,
        imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
  {
    id: "combo-urban-commuter",
    title: "Urban Commuter Pro Bundle",
    subtitle: "Heavy-duty abrasion resistance with CE-Level 2 armored jacket, tactical knee guards & waterproof magnetic tank bag.",
    badge: "⚡ Flash Deal",
    discountText: "Save 20% OFF",
    bannerUrl: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80",
    productList: [
      {
        id: "combo-prod-4",
        title: "Airframe CE-Level 2 Armored Riding Jacket",
        name: "Airframe Armored Jacket",
        brand: "Alpinestars",
        category: "Riding Jackets",
        price: 7999,
        offerPrice: 6799,
        imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "combo-prod-5",
        title: "BioArmor Ergonomic Dual Bionic Knee Guards",
        name: "BioArmor Knee Guards",
        brand: "Scoyco",
        category: "Protection",
        price: 2899,
        offerPrice: 2299,
        imageUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80",
      },
      {
        id: "combo-prod-6",
        title: "Heavy-Duty Magnetic Waterproof Tank Bag",
        name: "Waterproof Tank Bag",
        brand: "ViaTerra",
        category: "Luggage",
        price: 2599,
        offerPrice: 1999,
        imageUrl: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80",
      },
    ],
  },
];

export default function ComboSection({
  theme = "light",
  sectionTitle = "COMBO OFFERS & RIDER BUNDLES",
  sectionSubtitle = "Curated protection and riding gear packages bundled together with exclusive discounts.",
}) {
  const { user } = useAuth();
  const { openLogin } = useAuthModal();
  const accessoriesCtx = useAccessoriesContext();
  const rawCatalogProducts = accessoriesCtx?.products;
  const catalogProducts = useMemo(() => rawCatalogProducts || [], [rawCatalogProducts]);

  // Fetch combo configurations from page_layouts / accessories_layout (and fallbacks)
  const { data: primaryLayout } = useDocument("page_layouts", "accessories_layout");
  const { data: fallbackLayout } = useDocument("page_layouts", "accessories");
  const { data: singularLayout } = useDocument("page_layout", "accessories_layout");

  // Determine active combos list
  const combos = useMemo(() => {
    const raw =
      primaryLayout?.combos ||
      fallbackLayout?.combos ||
      singularLayout?.combos ||
      [];

    if (Array.isArray(raw) && raw.length > 0) {
      // Validate that at least one combo has products
      const valid = raw.filter((c) => c && c.title);
      if (valid.length > 0) return valid;
    }
    return DEFAULT_FALLBACK_COMBOS;
  }, [primaryLayout, fallbackLayout, singularLayout]);

  const [activeComboIndex, setActiveComboIndex] = useState(0);
  const [addingAll, setAddingAll] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const activeCombo = combos[activeComboIndex] || combos[0] || DEFAULT_FALLBACK_COMBOS[0];

  // Resolve products in the active combo with catalog items
  const resolvedProducts = useMemo(() => {
    const list = activeCombo?.productList || [];
    return list.map((item, idx) => {
      const itemId = typeof item === "string" ? item : item.id || item.productId;
      const matched = catalogProducts.find((p) => String(p.id) === String(itemId));

      const title =
        matched?.title ||
        matched?.name ||
        (typeof item === "object" ? item.title || item.name : "Riding Gear");
      const brand =
        matched?.brand ||
        (typeof item === "object" ? item.brand : "Nitroxx Gear");
      const image =
        matched?.image ||
        matched?.imageUrl ||
        matched?.banner ||
        (typeof item === "object" ? item.imageUrl || item.image : "");
      const offerPrice = Number(
        matched?.offerPrice ?? (typeof item === "object" ? item.offerPrice ?? item.price : 0)
      );
      const regularPrice = Number(
        matched?.price ?? (typeof item === "object" ? item.price ?? item.regularPrice : 0)
      );

      return {
        id: itemId || `combo-item-${idx}`,
        productId: matched?.id || itemId,
        title,
        brand,
        image: image || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
        offerPrice: offerPrice > 0 ? offerPrice : (regularPrice > 0 ? regularPrice : 1999),
        regularPrice: regularPrice > offerPrice ? regularPrice : Math.round((offerPrice || 1999) * 1.25),
        rawProduct: matched || (typeof item === "object" ? item : { id: itemId, title }),
      };
    });
  }, [activeCombo, catalogProducts]);

  // Aggregate pricing
  const totalOfferPrice = useMemo(() => {
    return resolvedProducts.reduce((acc, p) => acc + Number(p.offerPrice || 0), 0);
  }, [resolvedProducts]);

  const totalRegularPrice = useMemo(() => {
    return resolvedProducts.reduce((acc, p) => acc + Number(p.regularPrice || 0), 0);
  }, [resolvedProducts]);

  const totalSavings = Math.max(0, totalRegularPrice - totalOfferPrice);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Add entire combo to user's cart
  const handleAddEntireCombo = async () => {
    if (!user) {
      openLogin();
      return;
    }

    if (!resolvedProducts.length) return;

    setAddingAll(true);
    try {
      for (const item of resolvedProducts) {
        await addToCart({
          userId: user.uid,
          product: item.rawProduct || item,
          quantity: 1,
          options: { comboId: activeCombo.id, comboTitle: activeCombo.title },
        });
      }
      showToast(`🎉 Added ${resolvedProducts.length} items from "${activeCombo.title}" to your cart!`);
    } catch (err) {
      console.error("Failed to add combo to cart:", err);
      showToast("Could not add combo to cart. Please try again.");
    } finally {
      setAddingAll(false);
    }
  };

  // Quick add single item from combo
  const handleAddSingleItem = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openLogin();
      return;
    }

    try {
      await addToCart({
        userId: user.uid,
        product: item.rawProduct || item,
        quantity: 1,
      });
      showToast(`Added "${item.title}" to cart!`);
    } catch (err) {
      console.error("Failed to add product to cart:", err);
    }
  };

  return (
    <section className={`combo-section combo-section--${theme}`}>
      <div className="combo-container">
        {/* Section Header */}
        <div className="combo-header">
          <div className="combo-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Special Value Deals
          </div>

          <div className="combo-header-top">
            <div>
              <h2 className="combo-title">{sectionTitle}</h2>
              <p className="combo-subtitle">{sectionSubtitle}</p>
            </div>

            {/* Multiple Combos Tabs */}
            {combos.length > 1 && (
              <div className="combo-tabs">
                {combos.map((combo, idx) => (
                  <button
                    key={combo.id || idx}
                    type="button"
                    className={`combo-tab-btn ${activeComboIndex === idx ? "active" : ""}`}
                    onClick={() => setActiveComboIndex(idx)}
                  >
                    {combo.title || `Combo #${idx + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Combo Showcase Card */}
        <div className="combo-card">
          {/* Left Side: Combo Hero Box */}
          <div
            className="combo-promo-hero"
            style={{
              backgroundImage: `url(${activeCombo.bannerUrl || activeCombo.banner || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80"})`,
            }}
          >
            <div className="combo-promo-overlay" />
            <div className="combo-promo-content">
              <span className="combo-promo-badge">
                {activeCombo.badge || "🔥 Combo Deal"}
              </span>
              <h3 className="combo-promo-title">{activeCombo.title}</h3>
              <p className="combo-promo-sub">{activeCombo.subtitle}</p>

              <div className="combo-promo-discount-tag">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                {activeCombo.discountText || (totalSavings > 0 ? `Save Rs. ${totalSavings.toLocaleString("en-IN")}` : "Bundle Savings")}
              </div>
            </div>
          </div>

          {/* Right Side: Bundled Items + Pricing Flow */}
          <div className="combo-bundle-content">
            <div className="combo-bundle-header">
              <div className="combo-bundle-header-left">
                <div className="combo-bundle-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <h4 className="combo-bundle-tagline">Items Included In This Package</h4>
              </div>
              <span className="combo-bundle-count">
                {resolvedProducts.length} Items Starred
              </span>
            </div>

            {/* Products Flow with Plus Connectors */}
            <div className="combo-products-flow">
              {resolvedProducts.map((prod, idx) => (
                <React.Fragment key={prod.id || idx}>
                  <Link
                    to={prod.productId ? `/product/${prod.productId}` : "/accessories"}
                    className="combo-product-card"
                    title={`View ${prod.title}`}
                  >
                    <div className="combo-product-thumb">
                      <img src={prod.image} alt={prod.title} loading="lazy" />
                    </div>
                    <span className="combo-product-brand">{prod.brand}</span>
                    <h5 className="combo-product-title">{prod.title}</h5>
                    <div className="combo-product-bottom-row">
                      <div className="combo-product-price-row">
                        <span className="combo-product-price">
                          Rs. {Number(prod.offerPrice).toLocaleString("en-IN")}
                        </span>
                        {prod.regularPrice > prod.offerPrice && (
                          <span className="combo-product-mrp">
                            Rs. {Number(prod.regularPrice).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="combo-quick-add-btn"
                        onClick={(e) => handleAddSingleItem(e, prod)}
                        title={`Add ${prod.title} to cart`}
                        aria-label={`Add ${prod.title} to cart`}
                      >
                        + Add
                      </button>
                    </div>
                  </Link>

                  {idx < resolvedProducts.length - 1 && (
                    <div className="combo-connector-plus" title="Bundled Together">
                      +
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Bottom Summary Bar & Action */}
            <div className="combo-summary-box">
              <div className="combo-price-details">
                <span className="combo-price-label">Special Combo Bundle Price</span>
                <div className="combo-pricing-row">
                  <span className="combo-final-price">
                    Rs. {totalOfferPrice.toLocaleString("en-IN")}
                  </span>
                  {totalRegularPrice > totalOfferPrice && (
                    <span className="combo-regular-price">
                      Rs. {totalRegularPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                  {totalSavings > 0 && (
                    <span className="combo-savings-pill">
                      Instant Save Rs. {totalSavings.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="combo-add-btn"
                onClick={handleAddEntireCombo}
                disabled={addingAll}
              >
                {addingAll ? (
                  "Adding Bundle..."
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    Add Entire Combo To Cart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Feedback Toast */}
      {toastMsg && (
        <div className="combo-toast">
          <svg className="combo-toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {toastMsg}
        </div>
      )}
    </section>
  );
}
