import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";
import { removeWishlistItem } from "../../../services/commerceService";

export default function Wishlist() {
  const { user } = useAuth();
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Fetch wishlist items from user/userId/wishlist (singular) and users/userId/wishlist (plural)
  const { data: userWishlistItems = [], loading: userWishlistLoading } = useCollection(
    user?.uid ? `user/${user.uid}/wishlist` : null,
    { limit: 50 }
  );

  const { data: usersPluralWishlistItems = [] } = useCollection(
    user?.uid ? `users/${user.uid}/wishlist` : null,
    { limit: 50 }
  );

  // Fetch legacy wishlist items for backwards compatibility
  const { data: legacyWishlistItems = [] } = useCollection(
    COLLECTIONS.wishlist,
    {
      where: user?.uid ? [["userId", "==", user.uid]] : [["userId", "==", "NO_USER"]],
      limit: 50,
    }
  );

  const wishlistData = useMemo(() => {
    const map = new Map();
    [...legacyWishlistItems, ...usersPluralWishlistItems, ...userWishlistItems].forEach((item) => {
      if (item && item.id) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }, [userWishlistItems, usersPluralWishlistItems, legacyWishlistItems]);

  const loading = userWishlistLoading && !wishlistData.length;

  const [removedIds, setRemovedIds] = useState([]);

  const handleRemove = async (docId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setRemovedIds((prev) => [...prev, docId]);
    setFeedbackMsg("Item removed from wishlist");
    setTimeout(() => setFeedbackMsg(""), 2500);

    if (user?.uid) {
      try {
        await removeWishlistItem({ userId: user.uid, docId });
      } catch (err) {
        console.error("Failed to remove item from wishlist:", err);
      }
    }
  };

  // Map real Firestore wishlist items
  const actualItems = (wishlistData || []).map((item) => {
    const product = item.productSnapshot || item.product || item.eventSnapshot || item;
    const category = product.category || "";
    const name = product.name || product.title || "Gear";
    const image = product.image || product.imageUrl || product.banner;
    const price = Number(product.offerPrice || product.price || 0);

    return {
      id: item.id,
      productId: item.productId || product.id,
      category,
      name,
      image,
      price,
      brand: product.brand,
    };
  });

  const displayItems = actualItems.filter(
    (item) => !removedIds.includes(item.id)
  );

  return (
    <div className="nx-wishlist-page-wrap">
      {/* Top Header */}
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
        /* 3-Column Responsive Grid matching user's reference image */
        <div className="nx-wishlist-grid">
          {displayItems.map((item) => {
            const title = item.category || item.name || "Gear";
            const targetUrl = item.productId ? `/product/${item.productId}` : `/accessories`;

            return (
              <div className="nx-wishlist-card" key={item.id}>
                {/* Product Media Area with Dislike Button on Image */}
                <div className="nx-wishlist-media">
                  <Link to={targetUrl} className="nx-wishlist-img-link" title={title}>
                    <img
                      src={item.image || "/assets/images/wishlist-helmet.jpg"}
                      alt={title}
                      className="nx-wishlist-img"
                      loading="lazy"
                    />
                  </Link>

                  {/* Dislike button on top of the image */}
                  <button
                    type="button"
                    className="nx-wishlist-dislike-btn"
                    onClick={(e) => handleRemove(item.id, e)}
                    title="Dislike / Remove from wishlist"
                    aria-label={`Dislike ${title}`}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
                    </svg>
                  </button>
                </div>

                {/* Category or Title on bottom after image */}
                <div className="nx-wishlist-caption">
                  <Link to={targetUrl} className="nx-wishlist-caption-title">
                    {title}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
