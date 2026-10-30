import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";
import { getOrdersByPaymentId, getOrdersByOrderId } from "../../../payments/placeOrder";

export default function MyOrders() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Search parameters support: ?payment_id=... or ?orderId=...
  const paymentIdParam = searchParams.get("payment_id") || searchParams.get("paymentId");
  const orderIdParam = searchParams.get("orderId") || searchParams.get("orderID");

  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [activeTrackPkgIdx, setActiveTrackPkgIdx] = useState(0);

  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Directly fetched orders when queried by payment_id or orderId param
  const [directFetchedOrders, setDirectFetchedOrders] = useState([]);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  // 1. Fetch from users/{userId}/order
  const { data: userOrderData, loading: loadingUserOrder } = useCollection(
    user?.uid ? `users/${user.uid}/order` : null
  );

  // 2. Fetch from user/{userId}/order (singular collection "user")
  const { data: userSingularOrderData } = useCollection(
    user?.uid ? `user/${user.uid}/order` : null
  );

  // 3. Fetch from users/{userId}/orders (plural)
  const { data: userPluralOrdersData } = useCollection(
    user?.uid ? `users/${user.uid}/orders` : null
  );

  // 4. Fetch from global orders collection
  const { data: globalOrdersData, loading: loadingGlobal } = useCollection(COLLECTIONS.orders, {
    where: user?.uid ? [["userId", "==", user.uid]] : [["userId", "==", "NO_USER"]],
    limit: 60,
  });

  const loading = loadingUserOrder && loadingGlobal;

  // Handle URL query parameters (?payment_id=... or ?orderId=...)
  useEffect(() => {
    if (paymentIdParam) {
      setSearchInput(paymentIdParam);
      setCommittedSearch(paymentIdParam);
      getOrdersByPaymentId(paymentIdParam).then((res) => {
        if (res && res.length > 0) {
          setDirectFetchedOrders(res);
        }
      });
    } else if (orderIdParam) {
      setSearchInput(orderIdParam);
      setCommittedSearch(orderIdParam);
      getOrdersByOrderId(orderIdParam).then((res) => {
        if (res && res.length > 0) {
          setDirectFetchedOrders(res);
        }
      });
    }
  }, [paymentIdParam, orderIdParam]);

  // Combine and deduplicate raw Firestore documents
  const allRawDocs = useMemo(() => {
    const docMap = new Map();
    const addAll = (list) => {
      (list || []).forEach((doc) => {
        const key =
          doc?.id ||
          doc?.orderDocId ||
          (doc?.vendorOrderId ? `${doc.paymentId || doc.payment_id}_${doc.vendorOrderId}` : null);
        if (key && !docMap.has(key)) {
          docMap.set(key, doc);
        }
      });
    };

    addAll(userOrderData);
    addAll(userSingularOrderData);
    addAll(userPluralOrdersData);
    addAll(globalOrdersData);
    addAll(directFetchedOrders);

    return Array.from(docMap.values());
  }, [userOrderData, userSingularOrderData, userPluralOrdersData, globalOrdersData, directFetchedOrders]);

  /**
   * Group raw orders by payment_id (or paymentId, orderId, orderID)
   * so that multiple vendor documents from a single checkout are consolidated
   * into one unified order with separate vendor packages.
   */
  const parsedFirestoreOrders = useMemo(() => {
    const groupsMap = new Map();

    allRawDocs.forEach((doc) => {
      // Grouping key: shared paymentId/payment_id, or whole orderId/orderID, or doc.id
      const groupKey =
        doc.payment_id ||
        doc.paymentId ||
        doc.orderID ||
        doc.orderId ||
        doc.orderNumber ||
        doc.id;

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, []);
      }
      groupsMap.get(groupKey).push(doc);
    });

    const list = Array.from(groupsMap.entries()).map(([groupKey, docs]) => {
      const primary = docs[0] || {};

      // Whole Order ID: format NTX123456789ORD
      const wholeOrderId =
        primary.orderID ||
        primary.orderId ||
        (primary.orderNumber?.startsWith("NTX") ? primary.orderNumber : null) ||
        primary.orderNumber ||
        `OD${String(groupKey).slice(-16).toUpperCase()}`;

      const paymentId = primary.payment_id || primary.paymentId || "";

      // Parse individual vendor packages
      const vendorPackages = docs.map((doc) => {
        const rawStatus = String(doc.status || doc.orderStatus || "confirmed").toLowerCase();
        let status = "confirmed";
        let statusMessage =
          doc.statusMessage || `Your items are confirmed with ${doc.vendorName || "vendor"}.`;
        if (rawStatus.includes("cancel")) {
          status = "cancelled";
          statusMessage = "Order package was cancelled.";
        } else if (rawStatus.includes("ship")) {
          status = "shipping";
          statusMessage = "Package is in transit with courier partner.";
        } else if (rawStatus.includes("deliver")) {
          status = "delivered";
          statusMessage = "Package has been delivered.";
        }

        const items = (doc.items || []).map((it) => ({
          name: it.name || it.productSnapshot?.name || "Motorcycle Gear",
          specs:
            it.specs ||
            (it.options?.size || it.options?.color
              ? `Size: ${it.options?.size || "Standard"} • Color: ${it.options?.color || "Standard"}`
              : `Color: ${it.color || "Standard"} • Size: ${it.size || "Standard"}`),
          image:
            it.image ||
            it.productSnapshot?.image ||
            "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80",
          price: Number(it.price || it.unitPrice || 0),
          quantity: Number(it.quantity || 1),
        }));

        const packageSubtotal =
          Number(doc.vendorTotal ?? doc.totalAmount ?? doc.total ?? doc.subtotal ?? doc.price) ||
          items.reduce((sum, it) => sum + it.price * it.quantity, 0);

        // Vendor Order ID: format ODR123456VNTX
        const vendorOrderId =
          doc.vendorOrderId ||
          (doc.orderNumber && doc.orderNumber !== wholeOrderId ? doc.orderNumber : null) ||
          doc.id;

        return {
          id: doc.id,
          vendorId: doc.vendorId || "nitroxx-default-vendor",
          vendorName: doc.vendorName || "Nitroxx Partner",
          vendorOrderId: vendorOrderId,
          status,
          statusMessage,
          subtotal: packageSubtotal,
          items:
            items.length > 0
              ? items
              : [
                  {
                    name: doc.itemName || "Motorcycle Accessory",
                    specs: "Standard",
                    image:
                      doc.image ||
                      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80",
                    price: packageSubtotal,
                    quantity: 1,
                  },
                ],
          rawDoc: doc,
        };
      });

      // Flatten items across packages
      const allItems = vendorPackages.flatMap((pkg) => pkg.items);
      const firstItem = allItems[0] || {
        name: primary.itemName || "Motorcycle Accessory",
        specs: "Standard",
        image:
          primary.image ||
          "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=400&q=80",
        price: 0,
        quantity: 1,
      };

      // Grand Total: check overallOrderTotal or sum package subtotals
      const grandTotal =
        Number(primary.overallOrderTotal) ||
        vendorPackages.reduce((sum, pkg) => sum + pkg.subtotal, 0);

      // Overall status resolution across packages
      const allDelivered = vendorPackages.every((p) => p.status === "delivered");
      const allCancelled = vendorPackages.every((p) => p.status === "cancelled");
      const anyShipping = vendorPackages.some((p) => p.status === "shipping");
      const overallStatus = allDelivered
        ? "delivered"
        : allCancelled
        ? "cancelled"
        : anyShipping
        ? "shipping"
        : "confirmed";

      const overallStatusMessage =
        vendorPackages.length > 1
          ? `${vendorPackages.length} packages processed from ${vendorPackages.length} vendors.`
          : vendorPackages[0]?.statusMessage || primary.statusMessage || "Your order has been confirmed.";

      const getMillis = (v) =>
        v?.toDate
          ? v.toDate().getTime()
          : v?.toMillis
          ? v.toMillis()
          : v?.seconds
          ? v.seconds * 1000
          : Number(v) || 0;

      const createdAtMillis = Math.max(...docs.map((d) => getMillis(d.createdAt)));
      const dateText =
        createdAtMillis > 0
          ? new Date(createdAtMillis).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : primary.dateText || "Recent Order";

      const deliveryAddress =
        primary.deliveryAddress ||
        (primary.shippingAddress?.street
          ? `${primary.shippingAddress.street}, ${primary.shippingAddress.city}`
          : primary.shipping?.address
          ? `${primary.shipping.address}, ${primary.shipping.city || ""}`
          : "Delivery address on file");

      const paymentMode = primary.paymentMode || primary.paymentMethod || "Prepaid (Razorpay)";

      const vendorNames = vendorPackages.map((p) => p.vendorName);
      const vendorOrderIds = vendorPackages.map((p) => p.vendorOrderId);

      // Card titles & specs
      const cardTitle =
        allItems.length > 1
          ? `${firstItem.name} + ${allItems.length - 1} more item${allItems.length - 1 > 1 ? "s" : ""}`
          : firstItem.name;

      const cardSpecs =
        vendorPackages.length > 1
          ? `Vendors: ${vendorNames.join(", ")}`
          : firstItem.specs;

      return {
        id: groupKey,
        orderId: wholeOrderId,
        orderID: wholeOrderId,
        orderNumber: wholeOrderId,
        paymentId,
        payment_id: paymentId,
        status: overallStatus,
        statusMessage: overallStatusMessage,
        dateText,
        createdAtMillis,
        deliveryAddress,
        paymentMode,
        price: grandTotal,
        totalAmount: grandTotal,
        items: allItems,
        itemCount: allItems.reduce((acc, it) => acc + (it.quantity || 1), 0),
        firstItem,
        cardTitle,
        cardSpecs,
        image: primary.image || firstItem.image,
        vendorPackages,
        vendorPackagesCount: vendorPackages.length,
        vendorNames,
        vendorOrderIds,
        sharedNote: primary.sharedNote || null,
      };
    });

    return list.sort((a, b) => b.createdAtMillis - a.createdAtMillis);
  }, [allRawDocs]);

  // Auto-open order if matching payment_id or orderId URL parameter is provided
  useEffect(() => {
    if (!hasAutoOpened && (paymentIdParam || orderIdParam) && parsedFirestoreOrders.length > 0) {
      const match = parsedFirestoreOrders.find(
        (o) =>
          (paymentIdParam && (o.paymentId === paymentIdParam || o.payment_id === paymentIdParam)) ||
          (orderIdParam &&
            (o.orderId === orderIdParam ||
              o.orderID === orderIdParam ||
              o.vendorOrderIds?.includes(orderIdParam)))
      );
      if (match) {
        setSelectedOrder(match);
        setHasAutoOpened(true);
      }
    }
  }, [paymentIdParam, orderIdParam, parsedFirestoreOrders, hasAutoOpened]);

  // Search trigger
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setCommittedSearch(searchInput);
  };

  const filteredOrders = useMemo(() => {
    return parsedFirestoreOrders.filter((ord) => {
      // Filter tab
      if (activeFilter === "delivered" && ord.status !== "delivered") return false;
      if (activeFilter === "shipping" && ord.status !== "shipping" && ord.status !== "confirmed")
        return false;
      if (activeFilter === "cancelled" && ord.status !== "cancelled") return false;

      // Committed search filter: check orderId, paymentId, vendorOrderId, vendor names, and item names
      if (committedSearch.trim()) {
        const q = committedSearch.toLowerCase();
        const matchOrderNum =
          ord.orderNumber?.toLowerCase().includes(q) || ord.orderId?.toLowerCase().includes(q);
        const matchPaymentId =
          ord.paymentId?.toLowerCase().includes(q) || ord.payment_id?.toLowerCase().includes(q);
        const matchVendorOrderId = ord.vendorOrderIds?.some((vid) =>
          vid?.toLowerCase().includes(q)
        );
        const matchVendorName = ord.vendorNames?.some((vn) => vn?.toLowerCase().includes(q));
        const matchItemName = ord.items?.some((it) => it.name?.toLowerCase().includes(q));
        const matchSpecs = ord.items?.some((it) => (it.specs || "").toLowerCase().includes(q));

        if (
          !matchOrderNum &&
          !matchPaymentId &&
          !matchVendorOrderId &&
          !matchVendorName &&
          !matchItemName &&
          !matchSpecs
        ) {
          return false;
        }
      }

      return true;
    });
  }, [parsedFirestoreOrders, activeFilter, committedSearch]);

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

  const handleOpenTracking = (ord) => {
    setTrackingOrder(ord);
    setActiveTrackPkgIdx(0);
  };

  return (
    <div className="nx-orders-page-wrap">
      {/* Search Header Row with input + blue button */}
      <form className="nx-orders-search-form" onSubmit={handleSearchSubmit}>
        <div className="nx-orders-search-input-wrap">
          <input
            type="search"
            placeholder="Search by Order ID (NTX...), Vendor Order ID (ODR...), Payment ID (pay_...), or Product"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="nx-orders-search-input-field"
          />
        </div>
        <button type="submit" className="nx-orders-search-action-btn">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
          All Orders ({parsedFirestoreOrders.length})
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
                {/* Optional Alert pill banner */}
                {ord.sharedNote && (
                  <div className="nx-order-shared-banner">
                    <span className="nx-order-shared-icon">👥</span>
                    <span>{ord.sharedNote}</span>
                  </div>
                )}

                <div className="nx-order-horizontal-content">
                  {/* Column 1: Product Thumbnail */}
                  <div className="nx-order-thumb-column">
                    <div className="nx-order-thumb-wrapper" style={{ position: "relative" }}>
                      <img src={ord.image} alt={ord.cardTitle} className="nx-order-thumb-img" />
                      {ord.vendorPackagesCount > 1 && (
                        <span
                          style={{
                            position: "absolute",
                            bottom: "4px",
                            right: "4px",
                            background: "rgba(0,0,0,0.85)",
                            color: "#38bdf8",
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "1px 5px",
                            borderRadius: "4px",
                            border: "1px solid rgba(56,189,248,0.3)",
                          }}
                        >
                          {ord.vendorPackagesCount} pkgs
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Product Name & Specs */}
                  <div className="nx-order-info-column">
                    <h3 className="nx-order-item-title" title={ord.cardTitle}>
                      {ord.cardTitle}
                    </h3>
                    <p className="nx-order-item-specs">{ord.cardSpecs}</p>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "6px",
                      }}
                    >
                      <span className="nx-order-id-tag">Order #{ord.orderId}</span>
                      {ord.vendorPackagesCount > 1 && (
                        <span className="nx-order-vendor-tag">
                          📦 {ord.vendorPackagesCount} Vendor Packages
                        </span>
                      )}
                    </div>
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

                    {/* If multi-vendor, show mini status badges for each vendor package */}
                    {ord.vendorPackagesCount > 1 && (
                      <div className="nx-order-packages-mini-pills">
                        {ord.vendorPackages.map((pkg) => (
                          <span key={pkg.vendorOrderId} className="nx-mini-pkg-pill">
                            <strong>{pkg.vendorName}:</strong> {pkg.status}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Rate & Review link */}
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
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
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
                          onClick={() => handleOpenTracking(ord)}
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
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
                <img src={reviewOrder.image} alt={reviewOrder.cardTitle} />
                <div>
                  <h5>{reviewOrder.cardTitle}</h5>
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
                          className={`nx-review-star-btn ${
                            star <= reviewRating ? "is-selected" : ""
                          }`}
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

      {/* View Details Modal with Multi-Vendor Package Breakdown */}
      {selectedOrder && (
        <div className="profile-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div
            className="profile-modal nx-order-details-modal"
            style={{ maxWidth: "680px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Order Details</h3>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontFamily: "monospace",
                    display: "block",
                    marginTop: "4px",
                  }}
                >
                  Whole Order ID: #{selectedOrder.orderId}
                </span>
              </div>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setSelectedOrder(null)}
              >
                &times;
              </button>
            </div>

            <div className="nx-order-modal-body">
              {/* Meta Grid */}
              <div
                className="nx-order-modal-meta"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}
              >
                <div>
                  <span className="nx-modal-label">Status:</span>
                  <strong className={`nx-modal-status status-${selectedOrder.status}`}>
                    {selectedOrder.status.toUpperCase()}
                  </strong>
                </div>
                <div>
                  <span className="nx-modal-label">Payment ID:</span>
                  <strong
                    style={{
                      fontFamily: "monospace",
                      fontSize: "12px",
                      wordBreak: "break-all",
                    }}
                  >
                    {selectedOrder.payment_id || selectedOrder.paymentId || "Online (Prepaid)"}
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

              {/* Delivery Address */}
              <div className="nx-modal-address-box">
                <span className="nx-modal-label">Delivery Address:</span>
                <p>{selectedOrder.deliveryAddress}</p>
              </div>

              {/* Packages breakdown per vendor */}
              <div style={{ marginTop: "6px" }}>
                <h4 className="nx-modal-items-heading">
                  Packages by Vendor ({selectedOrder.vendorPackages.length})
                </h4>
                <div className="nx-modal-vendor-packages-list">
                  {selectedOrder.vendorPackages.map((pkg) => (
                    <div className="nx-modal-vendor-package-card" key={pkg.vendorOrderId}>
                      <div className="nx-modal-pkg-header">
                        <div className="nx-modal-pkg-vendor-info">
                          <span className="nx-modal-pkg-vendor-badge">Vendor</span>
                          <strong className="nx-modal-pkg-vendor-name">{pkg.vendorName}</strong>
                          <span className="nx-modal-pkg-suborder-id">
                            Package ID: {pkg.vendorOrderId}
                          </span>
                        </div>
                        <span className={`nx-modal-status status-${pkg.status}`}>
                          {pkg.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="nx-modal-items-list">
                        {pkg.items.map((item, idx) => (
                          <div className="nx-modal-item-row" key={idx}>
                            <img
                              src={item.image}
                              alt={item.name}
                              className="nx-modal-item-img"
                            />
                            <div className="nx-modal-item-info">
                              <h5>{item.name}</h5>
                              <span className="nx-modal-item-specs">{item.specs}</span>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginTop: "4px",
                                }}
                              >
                                <span className="nx-modal-item-qty">Qty: {item.quantity}</span>
                                <strong className="nx-modal-item-price">
                                  ₹{item.price?.toLocaleString("en-IN")}
                                </strong>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="nx-modal-pkg-footer">
                        <span>Vendor Package Subtotal:</span>
                        <strong>₹{pkg.subtotal?.toLocaleString("en-IN")}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Row */}
              <div className="nx-modal-total-row">
                <span>Total Amount Paid (All Packages)</span>
                <strong>₹{selectedOrder.price?.toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Track Order Timeline Modal */}
      {trackingOrder && (
        <div className="profile-modal-backdrop" onClick={() => setTrackingOrder(null)}>
          <div
            className="profile-modal"
            style={{ maxWidth: "580px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Shipment Tracking</h3>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#94a3b8",
                    fontFamily: "monospace",
                    display: "block",
                    marginTop: "4px",
                  }}
                >
                  Order #{trackingOrder.orderId}
                </span>
              </div>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setTrackingOrder(null)}
              >
                &times;
              </button>
            </div>

            {/* If multi-package, render vendor package tabs */}
            {trackingOrder.vendorPackagesCount > 1 && (
              <div className="nx-tracking-pkg-tabs">
                {trackingOrder.vendorPackages.map((pkg, idx) => (
                  <button
                    type="button"
                    key={pkg.vendorOrderId}
                    className={`nx-tracking-pkg-tab ${
                      activeTrackPkgIdx === idx ? "is-active" : ""
                    }`}
                    onClick={() => setActiveTrackPkgIdx(idx)}
                  >
                    <span>{pkg.vendorName}</span>
                    <span className="nx-tracking-pkg-tab-badge">{pkg.vendorOrderId}</span>
                  </button>
                ))}
              </div>
            )}

            {(() => {
              const currentPkg =
                trackingOrder.vendorPackages[activeTrackPkgIdx] ||
                trackingOrder.vendorPackages[0] ||
                trackingOrder;
              const pkgStatus = currentPkg.status || trackingOrder.status;
              const pkgOrderId = currentPkg.vendorOrderId || trackingOrder.orderId;

              return (
                <div className="nx-tracking-timeline">
                  <div className="nx-track-step is-done">
                    <div className="nx-track-node" />
                    <div className="nx-track-content">
                      <h5>Package Confirmed</h5>
                      <p>
                        Package #{pkgOrderId} verified and processed by{" "}
                        {currentPkg.vendorName || "vendor"}
                      </p>
                    </div>
                  </div>
                  <div className="nx-track-step is-done">
                    <div className="nx-track-node" />
                    <div className="nx-track-content">
                      <h5>Packed & Inspected</h5>
                      <p>Quality check passed and sealed for shipment</p>
                    </div>
                  </div>
                  <div
                    className={`nx-track-step ${
                      pkgStatus === "shipping" || pkgStatus === "delivered" ? "is-done" : ""
                    }`}
                  >
                    <div className="nx-track-node" />
                    <div className="nx-track-content">
                      <h5>In Transit (BlueDart Express)</h5>
                      <p>
                        Tracking ID: BD9827361928IN • Estimated Delivery: {trackingOrder.dateText}
                      </p>
                    </div>
                  </div>
                  <div className={`nx-track-step ${pkgStatus === "delivered" ? "is-done" : ""}`}>
                    <div className="nx-track-node" />
                    <div className="nx-track-content">
                      <h5>Delivered</h5>
                      <p>Package delivered to {trackingOrder.deliveryAddress || "recipient address"}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
