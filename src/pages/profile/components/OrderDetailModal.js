import React, { useState, useEffect, useRef } from "react";
import "./OrderDetailModal.css";

export default function OrderDetailModal({ order, onClose, user }) {
  const [activePackageIdx, setActivePackageIdx] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const menuRef = useRef(null);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showMenu]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  // Order identifiers & values
  const orderId =
    order.orderID ||
    order.orderId ||
    order.orderNumber ||
    (order.id ? `INV-${String(order.id).slice(-6).toUpperCase()}` : "INV-110450");

  const paymentId = order.payment_id || order.paymentId || "";
  const totalAmount = Number(order.price ?? order.totalAmount ?? order.total ?? 0);
  const dateText = order.dateText || "24 Aug, 2026";
  const rawStatus = String(order.status || "confirmed").toLowerCase();

  // Status badge styling (Single authoritative status pill at top)
  const isDelivered = rawStatus.includes("deliver");
  const isShipping = rawStatus.includes("ship");
  const isCancelled = rawStatus.includes("cancel");

  const statusLabel = isCancelled
    ? "Cancelled"
    : isDelivered
    ? "Delivered"
    : isShipping
    ? "In Transit"
    : "Paid";

  const statusClass = isCancelled
    ? "is-cancelled"
    : isDelivered
    ? "is-delivered"
    : isShipping
    ? "is-shipping"
    : "is-paid";

  // Realistic Estimated Delivery calculation (§3: eliminate suspicious same-day delivery)
  const getEstimatedDeliveryDate = () => {
    if (order.estimatedDelivery && order.estimatedDelivery !== dateText) {
      return order.estimatedDelivery;
    }
    if (isDelivered) {
      return dateText;
    }
    if (order.createdAtMillis && order.createdAtMillis > 0) {
      const targetDate = new Date(order.createdAtMillis + 4 * 24 * 60 * 60 * 1000);
      return targetDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    // Fallback: 4 days from order issue date
    const parsed = new Date(dateText);
    if (!isNaN(parsed.getTime())) {
      parsed.setDate(parsed.getDate() + 4);
      return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    const future = new Date();
    future.setDate(future.getDate() + 4);
    return future.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const estimatedDelivery = getEstimatedDeliveryDate();

  // Customer / Billed to info
  const customerName =
    order.shippingAddress?.name ||
    order.shipping?.name ||
    user?.displayName ||
    user?.fullName ||
    "Nitroxx Rider";

  const customerEmail =
    order.shippingAddress?.email ||
    order.shipping?.email ||
    user?.email ||
    "rider@nitroxxin.com";

  const deliveryAddress =
    order.deliveryAddress ||
    order.shippingAddress?.street ||
    order.shipping?.address ||
    "Delivery address on file";

  // Multi-vendor packages breakdown (§4)
  const packages =
    order.vendorPackages && order.vendorPackages.length > 0
      ? order.vendorPackages
      : [
          {
            vendorName: order.vendorName || order.primaryVendorName || "Authorized Vendor",
            vendorOrderId: orderId,
            status: order.status,
            statusMessage: order.statusMessage,
            items: order.items || [],
            subtotal: totalAmount,
          },
        ];

  const currentPkg = packages[activePackageIdx] || packages[0];
  const currentPkgStatus = String(currentPkg.status || order.status || "confirmed").toLowerCase();

  // Items extraction with seller/vendor attribution (§4)
  const allItems =
    order.items && order.items.length > 0
      ? order.items
      : packages.flatMap((pkg) =>
          (pkg.items || []).map((it) => ({
            ...it,
            vendorName: it.vendorName || pkg.vendorName,
          }))
        );

  // Pricing calculations
  const computedSubtotal = allItems.reduce(
    (acc, it) => acc + Number(it.price || 0) * Number(it.quantity || 1),
    0
  );
  const subtotal = computedSubtotal > 0 ? computedSubtotal : totalAmount;
  // GST calculation (18% standard India e-commerce GST)
  const gstAmount = Math.round(subtotal * 0.18);
  const finalTotal = totalAmount > 0 ? totalAmount : subtotal + gstAmount;

  // Timeline Step Status Resolver (§3: exactly 3 unmistakable states: 'done' | 'current' | 'upcoming')
  const getTimelineStepState = (stepIndex) => {
    // Step 0: Order Placed & Paid
    // Step 1: Packed & Inspected
    // Step 2: In Transit
    // Step 3: Delivered
    if (isCancelled) {
      if (stepIndex === 0) return "done";
      return "upcoming";
    }

    if (currentPkgStatus.includes("deliver")) {
      return "done";
    }

    if (currentPkgStatus.includes("ship")) {
      if (stepIndex < 2) return "done";
      if (stepIndex === 2) return "current";
      return "upcoming";
    }

    // Default: 'confirmed' / 'processing'
    if (stepIndex === 0) return "done";
    if (stepIndex === 1) return "current";
    return "upcoming";
  };

  // Toast feedback helper (§7)
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2800);
  };

  // Helper: Copy string with visual confirmation
  const handleCopy = async (textToCopy, label = "Value") => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast(`${label} copied to clipboard!`);
    } catch {
      showToast(`Copied: ${textToCopy}`);
    }
    setShowMenu(false);
  };

  // Helper: Trigger Print / Download PDF with feedback state (§7)
  const handleDownloadPDF = () => {
    setIsDownloading(true);
    showToast("Preparing printable invoice...");
    setTimeout(() => {
      window.print();
      setIsDownloading(false);
    }, 450);
  };

  // Helper: Share or Copy Link (§7)
  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: `Invoice #${orderId}`,
      text: `Order Invoice #${orderId} from Nitroxx · Total: ₹${finalTotal.toLocaleString("en-IN")}`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast("Invoice shared successfully!");
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    handleCopy(`${shareData.text} · ${shareUrl}`, "Invoice link");
  };

  return (
    <div className="nx-dark-inv-backdrop" onClick={onClose}>
      <div
        className="nx-dark-inv-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Invoice Detail"
      >
        {/* Floating Toast Notification (§7 Status feedback) */}
        {toastMessage && (
          <div className="nx-dark-inv-toast">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Navigation Bar: Back Arrow, Centered Title, 3-Dots Menu (§10 44px targets, §12 Materials) */}
        <div className="nx-dark-inv-nav">
          <button
            type="button"
            className="nx-dark-inv-nav-btn"
            onClick={onClose}
            aria-label="Back / Close Invoice"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>

          <h2 className="nx-dark-inv-nav-title">Invoice Detail</h2>

          <div className="nx-dark-inv-more-wrap" ref={menuRef}>
            <button
              type="button"
              className="nx-dark-inv-nav-btn"
              onClick={() => setShowMenu((prev) => !prev)}
              aria-label="More invoice actions"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <circle cx="12" cy="19" r="1.5" fill="currentColor" />
              </svg>
            </button>

            {showMenu && (
              <div className="nx-dark-inv-menu-dropdown">
                <button
                  type="button"
                  className="nx-dark-inv-menu-item"
                  onClick={() => handleCopy(orderId, "Order ID")}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copy Order ID
                </button>
                {paymentId && (
                  <button
                    type="button"
                    className="nx-dark-inv-menu-item"
                    onClick={() => handleCopy(paymentId, "Payment ID")}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                    Copy Payment ID
                  </button>
                )}
                <button
                  type="button"
                  className="nx-dark-inv-menu-item"
                  onClick={() => {
                    setShowMenu(false);
                    handleDownloadPDF();
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Print / Save PDF
                </button>
                <button
                  type="button"
                  className="nx-dark-inv-menu-item"
                  onClick={() => {
                    setShowMenu(false);
                    handleShare();
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Share Invoice
                </button>
                <button
                  type="button"
                  className="nx-dark-inv-menu-item"
                  onClick={() => {
                    setShowMenu(false);
                    showToast("Connecting to Nitroxx Support...");
                  }}
                  style={{ color: "#93c5fd" }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                  Need Help / Support
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="nx-dark-inv-body">
          {/* Hero Section: ID with copy affordance, Status Badge, Big Amount, Issued Dates */}
          <div className="nx-dark-inv-hero">
            <div className="nx-dark-inv-id-row">
              <button
                type="button"
                className="nx-dark-inv-id-btn"
                onClick={() => handleCopy(orderId, "Order ID")}
                title="Click to copy Order ID"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                <span>{orderId}</span>
                <span className="nx-dark-inv-copy-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </span>
              </button>

              <span className={`nx-dark-inv-status-pill ${statusClass}`}>
                {statusLabel}
              </span>
            </div>

            {/* Hero Amount (§15 tight tracking) */}
            <div className="nx-dark-inv-big-amount">
              ₹{finalTotal.toLocaleString("en-IN")}
            </div>

            {/* Issued Date and Realistic Estimated Delivery (§3) */}
            <div className="nx-dark-inv-dates-grid">
              <div className="nx-dark-inv-date-col">
                <span className="nx-dark-inv-date-label">Issued Date</span>
                <span className="nx-dark-inv-date-val">{dateText}</span>
              </div>
              <div className="nx-dark-inv-date-col">
                <span className="nx-dark-inv-date-label">
                  {isDelivered ? "Delivered On" : "Estimated Delivery"}
                </span>
                <span className="nx-dark-inv-date-val">{estimatedDelivery}</span>
              </div>
            </div>

            {/* Solid hairline divider (§9 consistent styling) */}
            <div className="nx-dark-inv-solid-divider" />
          </div>

          {/* Billed to Card (§1 High contrast, §9 neutral avatar, §3 folded payment info) */}
          <div className="nx-dark-inv-card">
            <h4 className="nx-dark-inv-card-title">Billed to</h4>
            <div className="nx-dark-inv-user-row">
              <div className="nx-dark-inv-avatar">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={customerName} />
                ) : (
                  <span>{customerName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="nx-dark-inv-user-meta">
                <span className="nx-dark-inv-user-name">{customerName}</span>
                <span className="nx-dark-inv-user-contact">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  {customerEmail}
                </span>
                {deliveryAddress && (
                  <div className="nx-dark-inv-user-addr">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{deliveryAddress}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Folded single payment line (§3: removes duplicate status clutter) */}
            <div className="nx-dark-inv-pay-row">
              <span>Payment Mode: {order.paymentMode || "Online (Razorpay)"}</span>
              {paymentId && (
                <button
                  type="button"
                  className="nx-dark-inv-pay-btn"
                  onClick={() => handleCopy(paymentId, "Payment ID")}
                  title="Click to copy Payment Reference"
                >
                  <span>Ref: {paymentId.slice(0, 14)}...</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Order Timeline Card (§3 Three clear states, §4 Split shipments, §10 44px tabs) */}
          <div className="nx-dark-inv-card">
            <div className="nx-dark-timeline-header-row">
              <h4 className="nx-dark-inv-card-title">Order Timeline</h4>
              {packages.length > 1 && (
                <span className="nx-dark-timeline-split-badge">
                  Split Shipment · {packages.length} Packages
                </span>
              )}
            </div>

            {/* Multi-Vendor Package Selector Tabs if split shipments exist */}
            {packages.length > 1 && (
              <div className="nx-dark-timeline-tabs-wrap">
                <div className="nx-dark-timeline-tabs">
                  {packages.map((pkg, idx) => (
                    <button
                      type="button"
                      key={pkg.vendorOrderId || idx}
                      className={`nx-dark-timeline-tab ${
                        activePackageIdx === idx ? "is-active" : ""
                      }`}
                      onClick={() => setActivePackageIdx(idx)}
                    >
                      <span>Package {idx + 1}: {pkg.vendorName}</span>
                      <span style={{ opacity: 0.75, fontSize: "0.75rem" }}>
                        · #{pkg.vendorOrderId}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Stepper Steps (§3: done, current, upcoming) */}
            <div className="nx-dark-timeline-steps">
              {/* Step 1: Order Confirmed & Paid */}
              {(() => {
                const stepState = getTimelineStepState(0);
                return (
                  <div className={`nx-dark-timeline-step is-${stepState}`}>
                    <div className="nx-dark-timeline-node">
                      {stepState === "done" ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : stepState === "current" ? (
                        <div className="nx-dark-timeline-pulse-dot" />
                      ) : (
                        <span style={{ fontSize: "11px", fontWeight: 700 }}>1</span>
                      )}
                    </div>
                    <div className="nx-dark-timeline-content">
                      <div className="nx-dark-timeline-title-row">
                        <h5 className="nx-dark-timeline-title">Order Confirmed & Payment Verified</h5>
                        {stepState === "current" && (
                          <span className="nx-dark-timeline-badge-in-progress">In Progress</span>
                        )}
                      </div>
                      <p className="nx-dark-timeline-desc">
                        Order verified on {dateText} · Payment processed securely
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Step 2: Packed & Quality Inspected */}
              {(() => {
                const stepState = getTimelineStepState(1);
                return (
                  <div className={`nx-dark-timeline-step is-${stepState}`}>
                    <div className="nx-dark-timeline-node">
                      {stepState === "done" ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : stepState === "current" ? (
                        <div className="nx-dark-timeline-pulse-dot" />
                      ) : (
                        <span style={{ fontSize: "11px", fontWeight: 700 }}>2</span>
                      )}
                    </div>
                    <div className="nx-dark-timeline-content">
                      <div className="nx-dark-timeline-title-row">
                        <h5 className="nx-dark-timeline-title">Packed & Quality Inspected</h5>
                        {stepState === "current" && (
                          <span className="nx-dark-timeline-badge-in-progress">In Progress</span>
                        )}
                      </div>
                      <p className="nx-dark-timeline-desc">
                        Prepared by {currentPkg.vendorName || "vendor partner"} with tamper-proof packaging
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Step 3: In Transit */}
              {(() => {
                const stepState = getTimelineStepState(2);
                return (
                  <div className={`nx-dark-timeline-step is-${stepState}`}>
                    <div className="nx-dark-timeline-node">
                      {stepState === "done" ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : stepState === "current" ? (
                        <div className="nx-dark-timeline-pulse-dot" />
                      ) : (
                        <span style={{ fontSize: "11px", fontWeight: 700 }}>3</span>
                      )}
                    </div>
                    <div className="nx-dark-timeline-content">
                      <div className="nx-dark-timeline-title-row">
                        <h5 className="nx-dark-timeline-title">
                          {stepState === "done" ? "Transit Completed" : "In Transit (Express Courier)"}
                        </h5>
                        {stepState === "current" && (
                          <span className="nx-dark-timeline-badge-in-progress">Active Courier</span>
                        )}
                      </div>
                      <p className="nx-dark-timeline-desc">
                        {stepState === "upcoming"
                          ? "Awaiting dispatch to courier partner"
                          : `Dispatched via BlueDart Express · Tracking #${currentPkg.vendorOrderId}`}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Step 4: Delivered */}
              {(() => {
                const stepState = getTimelineStepState(3);
                return (
                  <div className={`nx-dark-timeline-step is-${stepState}`}>
                    <div className="nx-dark-timeline-node">
                      {stepState === "done" ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <span style={{ fontSize: "11px", fontWeight: 700 }}>4</span>
                      )}
                    </div>
                    <div className="nx-dark-timeline-content">
                      <div className="nx-dark-timeline-title-row">
                        <h5 className="nx-dark-timeline-title">
                          {isDelivered ? "Delivered Successfully" : "Delivery"}
                        </h5>
                      </div>
                      <p className="nx-dark-timeline-desc">
                        {isDelivered
                          ? `Package delivered to ${customerName}`
                          : `Estimated delivery by ${estimatedDelivery}`}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Item Details Card (§2 Wrap item names, §4 Seller attribution, §5 Tabular numerals) */}
          <div className="nx-dark-inv-card">
            <h4 className="nx-dark-inv-card-title">Item Details</h4>

            <div className="nx-dark-inv-items-table">
              {/* Table Column Headers */}
              <div className="nx-dark-inv-table-head">
                <span className="col-desc">Description</span>
                <span className="col-qty">QTY</span>
                <span className="col-price">Price</span>
              </div>

              {/* Table Item Rows with 2-line wrap and seller label */}
              {allItems.map((item, idx) => (
                <div className="nx-dark-inv-item-row" key={idx}>
                  <div className="nx-dark-inv-item-info">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="nx-dark-inv-item-thumb"
                      />
                    )}
                    <div className="nx-dark-inv-item-text">
                      <span className="nx-dark-inv-item-name" title={item.name}>
                        {item.name}
                      </span>
                      {item.specs && item.specs !== "Standard" && (
                        <span className="nx-dark-inv-item-specs">{item.specs}</span>
                      )}
                      <span className="nx-dark-inv-item-seller">
                        Sold by: {item.vendorName || currentPkg.vendorName || order.vendorName || "Authorized Vendor"}
                      </span>
                    </div>
                  </div>
                  <span className="nx-dark-inv-item-qty">{item.quantity || 1}</span>
                  <span className="nx-dark-inv-item-price">
                    ₹{Number(item.price || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}

              {/* Breakdown Rows: Subtotal, GST, Shipping (§5) */}
              <div className="nx-dark-inv-breakdown-row" style={{ marginTop: "10px" }}>
                <span>Subtotal</span>
                <span className="nx-dark-inv-breakdown-val">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="nx-dark-inv-breakdown-row">
                <span>GST (18% Included)</span>
                <span className="nx-dark-inv-breakdown-val">
                  ₹{gstAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="nx-dark-inv-breakdown-row">
                <span>Shipping Fee</span>
                <span className="nx-dark-inv-breakdown-val" style={{ color: "#34d399" }}>
                  FREE
                </span>
              </div>

              <div className="nx-dark-inv-breakdown-divider" />

              {/* Grand Total */}
              <div className="nx-dark-inv-total-row">
                <span className="nx-dark-inv-total-label">Total</span>
                <span className="nx-dark-inv-total-val">
                  ₹{finalTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar: Download PDF as deliberate primary (§6) & Share as secondary */}
        <div className="nx-dark-inv-footer">
          <button
            type="button"
            className="nx-dark-inv-btn-primary"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Saving PDF...</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="nx-dark-inv-btn-secondary"
            onClick={handleShare}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
