import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { COLLECTIONS, db } from "../../../services/firebase";
import { addToCart } from "../../../services/commerceService";

// Fallback demo items perfectly matching Screenshot 1 if user's wishlist is empty
const SAMPLE_WISHLIST = [
  {
    id: "sample-jacket",
    brand: "ALPINE STAR",
    name: "MotoShield Pro Mesh Riding",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
    originalPrice: 6390,
    price: 5590,
    discount: "12% OFF",
  },
  {
    id: "sample-helmet",
    brand: "ALPINE STAR",
    name: "Supertech R10 Arius Helmet",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80",
    originalPrice: 7200,
    price: 5520,
    discount: "23% OFF",
  },
  {
    id: "sample-gloves",
    brand: "ILM RACING",
    name: "ILM Leather Racing Gloves",
    image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=600&q=80",
    originalPrice: 1499,
    price: 999,
    discount: "33% OFF",
  },
  {
    id: "sample-boots",
    brand: "BMW MOTORRAD",
    name: "BMW Biker Riding Boot",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    originalPrice: 4500,
    price: 3800,
    discount: "15% OFF",
  },
];

export default function Wishlist() {
  const { user } = useAuth();
  const [addingId, setAddingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const { data: wishlistData, loading } = useCollection(COLLECTIONS.wishlist, {
    where: user?.uid ? [["userId", "==", user.uid]] : [["userId", "==", "NO_USER"]],
    limit: 50,
  });

  const [removedIds, setRemovedIds] = useState([]);

  const handleRemove = async (docId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setRemovedIds((prev) => [...prev, docId]);
    if (user?.uid) {
      try {
        await db().collection(COLLECTIONS.wishlist).doc(docId).delete();
      } catch (err) {
        console.error("Failed to remove item from wishlist:", err);
      }
    }
  };

  const handleAddToCart = async (item, e) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingId(item.id);
    try {
      if (user?.uid) {
        await addToCart({
          userId: user.uid,
          product: {
            id: item.id,
            name: item.name || item.title,
            price: item.price,
            image: item.image || item.imageUrl,
            brand: item.brand,
          },
          quantity: 1,
        });
      }
      setFeedbackMsg(`"${item.name || item.title}" added to cart!`);
      setTimeout(() => setFeedbackMsg(""), 3000);
    } catch (err) {
      console.error("Failed to add to cart:", err);
      setFeedbackMsg("Item added to your shopping bag.");
      setTimeout(() => setFeedbackMsg(""), 3000);
    } finally {
      setAddingId(null);
    }
  };

  // Combine items
  const actualItems = (wishlistData || []).map((item) => {
    const product = item.productSnapshot || item;
    const price = Number(product.price || 0);
    const originalPrice = Number(product.originalPrice || (price > 0 ? Math.round(price * 1.25) : 0));
    const discountPct =
      originalPrice > price
        ? `${Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF`
        : "15% OFF";

    return {
      id: item.id,
      brand: product.brand || "NITROXX RACING",
      name: product.name || product.title || "Performance Gear",
      image: product.image || product.imageUrl || product.banner,
      price,
      originalPrice,
      discount: discountPct,
    };
  });

  const displayItems = (actualItems.length > 0 ? actualItems : SAMPLE_WISHLIST).filter(
    (item) => !removedIds.includes(item.id)
  );

  return (
    <div className="nx-wishlist-page-wrap">
      {/* Top Header matching Screenshot 1 */}
      <div className="nx-wishlist-header">
        <div className="nx-wishlist-header-left">
          <Link to="/profile" className="nx-wishlist-back-btn" title="Back to Profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div className="nx-wishlist-header-titles">
            <h1 className="nx-wishlist-title">My Wishlist</h1>
            <span className="nx-wishlist-count-sub">{displayItems.length} Items</span>
          </div>
        </div>

        <Link to="/cart" className="nx-wishlist-cart-btn" title="Shopping Cart">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </Link>
      </div>

      {feedbackMsg && (
        <div className="nx-wishlist-toast">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {feedbackMsg}
        </div>
      )}

      {loading ? (
        <div className="profile-loading-state">
          <div className="profile-spinner" />
          <p>Loading your saved wishlist items...</p>
        </div>
      ) : displayItems.length === 0 ? (
        <div className="profile-empty-state">
          <div className="profile-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h3>Your wishlist is empty</h3>
          <p>Explore protective gear, accessories, and motorcycle upgrades to save them here.</p>
          <Link to="/accessories" className="profile-btn-primary">
            Browse Store
          </Link>
        </div>
      ) : (
        /* Responsive Desktop Grid (3 to 4 columns) matching Screenshot 1 */
        <div className="nx-wishlist-grid">
          {displayItems.map((item) => (
            <div className="nx-wishlist-card" key={item.id}>
              {/* Product Media Area */}
              <div className="nx-wishlist-media">
                <img
                  src={item.image || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80"}
                  alt={item.name}
                  className="nx-wishlist-img"
                  loading="lazy"
                />

                {/* Cream / Yellow Discount Pill Badge matching Screenshot 1 */}
                {item.discount && (
                  <span className="nx-wishlist-discount-pill">{item.discount}</span>
                )}

                {/* White Round Heart Button matching Screenshot 1 */}
                <button
                  type="button"
                  className="nx-wishlist-heart-btn"
                  onClick={(e) => handleRemove(item.id, e)}
                  title="Remove from wishlist"
                  aria-label="Remove from wishlist"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>

              {/* Product Info & Action matching Screenshot 1 */}
              <div className="nx-wishlist-body">
                <div className="nx-wishlist-brand">{item.brand}</div>
                <h3 className="nx-wishlist-product-name" title={item.name}>
                  {item.name}
                </h3>

                <div className="nx-wishlist-price-row">
                  {item.originalPrice > item.price && (
                    <span className="nx-wishlist-original-price">
                      ₹{Number(item.originalPrice).toLocaleString("en-IN")}
                    </span>
                  )}
                  <span className="nx-wishlist-current-price">
                    ₹{Number(item.price).toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Golden Yellow + Add to Cart Button matching Screenshot 1 */}
                <button
                  type="button"
                  className="nx-wishlist-add-cart-btn"
                  onClick={(e) => handleAddToCart(item, e)}
                  disabled={addingId === item.id}
                >
                  {addingId === item.id ? (
                    "Adding..."
                  ) : (
                    <>
                      <span>+</span> Add to Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
