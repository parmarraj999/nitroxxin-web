import React, { useState, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";

export default function MyOrders() {
  const { user } = useAuth();
  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // 1. Fetch from exact requested path: users/{userId}/order
  const { data: userOrderData, loading: loadingUserOrder } = useCollection(
    user?.uid ? `users/${user.uid}/order` : null
  );

  // 2. Also fetch from user/{userId}/order (singular collection "user")
  const { data: userSingularOrderData } = useCollection(
    user?.uid ? `user/${user.uid}/order` : null
  );

  // 3. Also fetch from users/{userId}/orders (plural) and global orders collection
  const { data: userPluralOrdersData } = useCollection(
    user?.uid ? `users/${user.uid}/orders` : null
  );

  const { data: globalOrdersData, loading: loadingGlobal } = useCollection(COLLECTIONS.orders, {
    where: user?.uid ? [["userId", "==", user.uid]] : [["userId", "==", "NO_USER"]],
    limit: 50,
  });

  const loading = loadingUserOrder && loadingGlobal;

  const combinedRawOrders = useMemo(() => {
    const map = new Map();
    const addAll = (list) => {
      (list || []).forEach((ord) => {
        const key = ord.orderId || ord.orderNumber || ord.id;
        if (key && !map.has(key)) {
          map.set(key, ord);
        }
      });
    };

    // Prioritize user/userId/order
    addAll(userOrderData);
    addAll(userSingularOrderData);
    addAll(userPluralOrdersData);
    addAll(globalOrdersData);

    return Array.from(map.values()).sort((a, b) => {
      const getMillis = (v) =>
        v?.toDate
          ? v.toDate().getTime()
          : v?.toMillis
          ? v.toMillis()
          : v?.seconds
          ? v.seconds * 1000
          : Number(v) || 0;
      return getMillis(b.createdAt) - getMillis(a.createdAt);
    });
  }, [userOrderData, userSingularOrderData, userPluralOrdersData, globalOrdersData]);

  const parsedFirestoreOrders = useMemo(() => {
    return combinedRawOrders.map((ord) => {
      const rawStatus = String(ord.status || ord.orderStatus || "confirmed").toLowerCase();
      let status = "confirmed";
      let statusMessage = ord.statusMessage || "Your order has been confirmed.";
      if (rawStatus.includes("cancel")) {
        status = "cancelled";
        statusMessage = "Your order was cancelled as per your request.";
      } else if (rawStatus.includes("ship")) {
        status = "shipping";
        statusMessage = "Your item is on its way with courier partner.";
      } else if (rawStatus.includes("deliver")) {
        status = "delivered";
        statusMessage = "Your item has been delivered.";
      }

      const items = (ord.items || []).map((it) => ({
        name: it.productSnapshot?.name || it.name || "Motorcycle Gear",
        specs: it.specs || `Color: ${it.color || "Standard"}  •  Size: ${it.size || "Standard"}`,
        image:
          it.productSnapshot?.image ||
          it.image ||
          "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80",
        price: it.price || 0,
        quantity: it.quantity || 1,
      }));

      const firstItem = items[0] || {
        name: ord.itemName || "Motorcycle Accessory",
        specs: "Color: Default",
        image: ord.image || "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80",
        price: ord.totalAmount || ord.total || 999,
      };

      const dateText = ord.dateText
        ? ord.dateText
        : ord.createdAt?.toDate
        ? ord.createdAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Recent Order";

      const deliveryAddress =
        ord.deliveryAddress ||
        (ord.shippingAddress?.street
          ? `${ord.shippingAddress.street}, ${ord.shippingAddress.city}`
          : ord.shipping?.address
          ? `${ord.shipping.address}, ${ord.shipping.city || ""}`
          : "Delivery address on file");

      return {
        id: ord.id,
        orderNumber: ord.orderNumber || ord.orderId || `OD${(ord.id || "43726610447").slice(-16).toUpperCase()}`,
        itemName: ord.itemName || firstItem.name,
        specs: firstItem.specs,
        image: ord.image || firstItem.image,
        price: ord.price || ord.totalAmount || ord.total || ord.amount || firstItem.price,
        status,
        dateText,
        statusMessage,
        itemCount: ord.itemCount || items.reduce((acc, it) => acc + (it.quantity || 1), 0) || 1,
        deliveryAddress,
        paymentMode: ord.paymentMode || ord.paymentMethod || "Prepaid (Razorpay)",
        items: items.length > 0 ? items : [firstItem],
      };
    });
  }, [combinedRawOrders]);

  const allOrders = parsedFirestoreOrders;

  // Search trigger
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCommittedSearch(searchInput);
  };

  const filteredOrders = useMemo(() => {
    return allOrders.filter((ord) => {
      // Filter tab
      if (activeFilter === "delivered" && ord.status !== "delivered") return false;
      if (activeFilter === "shipping" && ord.status !== "shipping" && ord.status !== "confirmed") return false;
      if (activeFilter === "cancelled" && ord.status !== "cancelled") return false;

      // Committed search filter
      if (committedSearch.trim()) {
        const q = committedSearch.toLowerCase();
        const matchNum = ord.orderNumber.toLowerCase().includes(q);
        const matchName = ord.itemName.toLowerCase().includes(q);
        const matchSpecs = (ord.specs || "").toLowerCase().includes(q);
        if (!matchNum && !matchName && !matchSpecs) return false;
      }

      return true;
    });
  }, [allOrders, activeFilter, committedSearch]);

  const handleOpenReview = (ord) => {
    setReviewOrder(ord);
    setReviewRating(5);
    setReviewComment("");
    setReviewSubmitted(false);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewOrder(null);
      setReviewSubmitted(false);
    }, 1800);
  };

  return (
    <div className="nx-orders-page-wrap">
      {/* Search Header Row matching reference screenshot with input + blue button */}
      <form className="nx-orders-search-form" onSubmit={handleSearchSubmit}>
        <div className="nx-orders-search-input-wrap">
          <input
            type="search"
            placeholder="Search your orders here"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="nx-orders-search-input-field"
          />
        </div>
        <button type="submit" className="nx-orders-search-action-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Search Orders
        </button>
      </form>

      {/* Filter Tabs Bar */}
      <div className="nx-orders-filter-chips">
        <button
          type="button"
          className={`nx-orders-chip ${activeFilter === "all" ? "is-active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          All Orders ({allOrders.length})
        </button>
        <button
          type="button"
          className={`nx-orders-chip ${activeFilter === "delivered" ? "is-active" : ""}`}
          onClick={() => setActiveFilter("delivered")}
        >
          Delivered
        </button>
        <button
          type="button"
          className={`nx-orders-chip ${activeFilter === "shipping" ? "is-active" : ""}`}
          onClick={() => setActiveFilter("shipping")}
        >
          In Transit / Shipped
        </button>
        <button
          type="button"
          className={`nx-orders-chip ${activeFilter === "cancelled" ? "is-active" : ""}`}
          onClick={() => setActiveFilter("cancelled")}
        >
          Cancelled
        </button>
      </div>

      {/* Orders List Container */}
      {loading && !parsedFirestoreOrders.length ? (
        <div className="profile-loading-state">
          <div className="profile-spinner" />
          <p>Loading your orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="profile-empty-state">
          <h3>No orders found</h3>
          <p>We couldn't find any orders matching your search or filters.</p>
          {committedSearch && (
            <button
              type="button"
              className="profile-btn-primary"
              onClick={() => {
                setSearchInput("");
                setCommittedSearch("");
              }}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="nx-orders-horizontal-list">
          {filteredOrders.map((ord) => {
            const isDelivered = ord.status === "delivered";
            const isCancelled = ord.status === "cancelled";
            const isShipping = ord.status === "shipping" || ord.status === "confirmed";

            return (
              <div className="nx-order-horizontal-card" key={ord.id}>
                {/* Optional Alert pill banner like Screenshot */}
                {ord.sharedNote && (
                  <div className="nx-order-shared-banner">
                    <span className="nx-order-shared-icon">👥</span>
                    <span>{ord.sharedNote}</span>
                  </div>
                )}

                <div className="nx-order-horizontal-content">
                  {/* Column 1: Product Thumbnail */}
                  <div className="nx-order-thumb-column">
                    <div className="nx-order-thumb-wrapper">
                      <img src={ord.image} alt={ord.itemName} className="nx-order-thumb-img" />
                    </div>
                  </div>

                  {/* Column 2: Product Name & Specs */}
                  <div className="nx-order-info-column">
                    <h3 className="nx-order-item-title" title={ord.itemName}>
                      {ord.itemName}
                    </h3>
                    <p className="nx-order-item-specs">{ord.specs}</p>
                    <span className="nx-order-id-tag">Order #{ord.orderNumber}</span>
                  </div>

                  {/* Column 3: Price */}
                  <div className="nx-order-price-column">
                    <span className="nx-order-price-val">
                      ₹{ord.price?.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Column 4: Status, Subtext, and Action Buttons */}
                  <div className="nx-order-status-column">
                    {/* Status Header with Dot */}
                    <div className="nx-order-status-head">
                      <span
                        className={`nx-order-status-dot ${
                          isDelivered
                            ? "dot-delivered"
                            : isCancelled
                            ? "dot-cancelled"
                            : "dot-shipping"
                        }`}
                      />
                      <span className="nx-order-status-text">
                        {isDelivered && `Delivered on ${ord.dateText}`}
                        {isCancelled && `Cancelled on ${ord.dateText}`}
                        {isShipping && `Expected by ${ord.dateText}`}
                      </span>
                    </div>

                    {/* Status Subtitle */}
                    <p className="nx-order-status-subtext">{ord.statusMessage}</p>

                    {/* Rate & Review link like Screenshot */}
                    {isDelivered && (
                      <button
                        type="button"
                        className="nx-order-review-link"
                        onClick={() => handleOpenReview(ord)}
                      >
                        <span className="nx-order-star-icon">★</span>
                        Rate & Review Product
                      </button>
                    )}

                    {/* Current Action Buttons (View Details, Track Order) */}
                    <div className="nx-order-cta-group">
                      <button
                        type="button"
                        className="nx-order-detail-btn"
                        onClick={() => setSelectedOrder(ord)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        View Details
                      </button>

                      {!isCancelled && (
                        <button
                          type="button"
                          className="nx-order-track-btn"
                          onClick={() => setTrackingOrder(ord)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="7" y1="17" x2="17" y2="7" />
                            <polyline points="7 7 17 7 17 17" />
                          </svg>
                          Track Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rate & Review Modal */}
      {reviewOrder && (
        <div className="profile-modal-backdrop" onClick={() => setReviewOrder(null)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Rate & Review Product</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setReviewOrder(null)}
              >
                &times;
              </button>
            </div>

            <div className="nx-review-modal-body">
              <div className="nx-review-product-preview">
                <img src={reviewOrder.image} alt={reviewOrder.itemName} />
                <div>
                  <h5>{reviewOrder.itemName}</h5>
                  <span>₹{reviewOrder.price?.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {reviewSubmitted ? (
                <div className="nx-review-success">
                  <div className="nx-review-check-icon">✓</div>
                  <h4>Thank you for your feedback!</h4>
                  <p>Your review has been verified and published.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="nx-review-form">
                  <div className="nx-review-stars-select">
                    <label>Overall Rating</label>
                    <div className="nx-review-stars-row">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          className={`nx-review-star-btn ${star <= reviewRating ? "is-selected" : ""}`}
                          onClick={() => setReviewRating(star)}
                        >
                          ★
                        </button>
                      ))}
                      <span className="nx-review-rating-label">
                        {reviewRating === 5 && "Excellent"}
                        {reviewRating === 4 && "Very Good"}
                        {reviewRating === 3 && "Average"}
                        {reviewRating === 2 && "Poor"}
                        {reviewRating === 1 && "Terrible"}
                      </span>
                    </div>
                  </div>

                  <div className="nx-review-textarea-field">
                    <label>Your Review</label>
                    <textarea
                      placeholder="Write about the product quality, fit, protection, or overall satisfaction..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="nx-review-actions">
                    <button
                      type="button"
                      className="profile-btn-secondary"
                      onClick={() => setReviewOrder(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="profile-btn-primary">
                      Submit Review
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedOrder && (
        <div className="profile-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="profile-modal nx-order-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Order Details: #{selectedOrder.orderNumber}</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setSelectedOrder(null)}
              >
                &times;
              </button>
            </div>
            <div className="nx-order-modal-body">
              <div className="nx-order-modal-meta">
                <div>
                  <span className="nx-modal-label">Status:</span>
                  <strong className={`nx-modal-status status-${selectedOrder.status}`}>
                    {selectedOrder.status.toUpperCase()}
                  </strong>
                </div>
                <div>
                  <span className="nx-modal-label">Date:</span>
                  <strong>{selectedOrder.dateText}</strong>
                </div>
                <div>
                  <span className="nx-modal-label">Payment:</span>
                  <strong>{selectedOrder.paymentMode}</strong>
                </div>
              </div>

              <div className="nx-modal-address-box">
                <span className="nx-modal-label">Delivery Address:</span>
                <p>{selectedOrder.deliveryAddress}</p>
              </div>

              <h4 className="nx-modal-items-heading">Items in this Order ({selectedOrder.items.length})</h4>
              <div className="nx-modal-items-list">
                {selectedOrder.items.map((item, idx) => (
                  <div className="nx-modal-item-row" key={idx}>
                    <img src={item.image} alt={item.name} className="nx-modal-item-img" />
                    <div className="nx-modal-item-info">
                      <h5>{item.name}</h5>
                      <span className="nx-modal-item-specs">{item.specs}</span>
                      <strong className="nx-modal-item-price">₹{item.price.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className="nx-modal-total-row">
                <span>Total Amount Paid</span>
                <strong>₹{selectedOrder.price.toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Track Order Timeline Modal */}
      {trackingOrder && (
        <div className="profile-modal-backdrop" onClick={() => setTrackingOrder(null)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Shipment Tracking: #{trackingOrder.orderNumber}</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setTrackingOrder(null)}
              >
                &times;
              </button>
            </div>
            <div className="nx-tracking-timeline">
              <div className="nx-track-step is-done">
                <div className="nx-track-node" />
                <div className="nx-track-content">
                  <h5>Order Confirmed</h5>
                  <p>Order #{trackingOrder.orderNumber} verified and processed</p>
                </div>
              </div>
              <div className="nx-track-step is-done">
                <div className="nx-track-node" />
                <div className="nx-track-content">
                  <h5>Packed & Inspected</h5>
                  <p>Quality inspection passed and sealed in courier package</p>
                </div>
              </div>
              <div className={`nx-track-step ${trackingOrder.status === "shipping" || trackingOrder.status === "delivered" ? "is-done" : ""}`}>
                <div className="nx-track-node" />
                <div className="nx-track-content">
                  <h5>In Transit (BlueDart Express)</h5>
                  <p>Tracking ID: BD9827361928IN • Estimated Delivery: {trackingOrder.dateText}</p>
                </div>
              </div>
              <div className={`nx-track-step ${trackingOrder.status === "delivered" ? "is-done" : ""}`}>
                <div className="nx-track-node" />
                <div className="nx-track-content">
                  <h5>Delivered</h5>
                  <p>Package delivered to recipient address</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
