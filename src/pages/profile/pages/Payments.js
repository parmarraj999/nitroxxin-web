import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { COLLECTIONS, db, serverTimestamp } from "../../../services/firebase";

export default function Payments() {
  const { user } = useAuth();
  const [showAddUpi, setShowAddUpi] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: savedMethods, loading: loadingMethods } = useCollection(
    user?.uid ? `users/${user.uid}/payment_methods` : null,
    { orderBy: [["createdAt", "desc"]] }
  );

  const { data: bookings } = useCollection(COLLECTIONS.bookings, {
    where: user?.uid ? [["userId", "==", user.uid]] : [["userId", "==", "NO_USER"]],
    limit: 10,
    orderBy: [["createdAt", "desc"]],
  });

  const { data: orders } = useCollection(COLLECTIONS.orders, {
    where: user?.uid ? [["userId", "==", user.uid]] : [["userId", "==", "NO_USER"]],
    limit: 10,
    orderBy: [["createdAt", "desc"]],
  });

  const transactions = [
    ...(bookings || []).map((b) => ({
      id: b.id,
      title: b.title || b.eventSnapshot?.title || "Event Registration",
      amount: b.total || b.price || 0,
      type: "Event Pass",
      status: b.paymentStatus || "paid",
      date: b.dateText || b.dates || "Recent",
    })),
    ...(orders || []).map((o) => ({
      id: o.id,
      title: o.items?.[0]?.productSnapshot?.name || `Gear Order #${o.orderId || o.id?.slice(-4)}`,
      amount: o.totalAmount || o.total || 0,
      type: "Store Order",
      status: o.paymentStatus || "paid",
      date: "Recent",
    })),
  ];

  const handleSaveUpi = async (e) => {
    e.preventDefault();
    if (!user?.uid || !upiId.trim() || !upiId.includes("@")) {
      alert("Please enter a valid UPI ID (e.g. username@okhdfcbank)");
      return;
    }

    setIsSaving(true);
    try {
      await db().collection("users").doc(user.uid).collection("payment_methods").add({
        type: "UPI",
        identifier: upiId.trim(),
        label: "UPI Virtual Payment Address",
        createdAt: serverTimestamp(),
      });
      setUpiId("");
      setShowAddUpi(false);
    } catch (err) {
      console.error("Failed to save UPI:", err);
      alert("Could not save UPI ID. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMethod = async (id) => {
    if (!user?.uid || !id) return;
    try {
      await db().collection("users").doc(user.uid).collection("payment_methods").doc(id).delete();
    } catch (err) {
      console.error("Failed to delete payment method:", err);
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-page-header">
        <div>
          <h1 className="profile-page-title">Payments</h1>
          <p className="profile-page-subtitle">
            Manage your saved UPI accounts, card tokens, and view transaction statements
          </p>
        </div>
        <button
          type="button"
          className="profile-btn-primary"
          onClick={() => setShowAddUpi(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add UPI ID
        </button>
      </div>

      <div className="profile-payment-section">
        <h3 className="profile-section-heading">Saved Payment Methods</h3>

        {loadingMethods ? (
          <div className="profile-spinner" />
        ) : savedMethods.length === 0 ? (
          <div className="profile-payment-card-empty">
            <div className="profile-payment-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div>
              <h4>No payment methods saved</h4>
              <p>Add your UPI ID for 1-click checkout on rides and motorcycle gear.</p>
            </div>
          </div>
        ) : (
          <div className="profile-payment-methods-grid">
            {savedMethods.map((m) => (
              <div className="profile-payment-method-card" key={m.id}>
                <div className="profile-payment-method-top">
                  <span className="profile-badge-active">{m.type}</span>
                  <button
                    type="button"
                    className="profile-btn-icon-danger"
                    onClick={() => handleDeleteMethod(m.id)}
                    title="Remove method"
                  >
                    &times;
                  </button>
                </div>
                <h4 className="profile-payment-method-val">{m.identifier}</h4>
                <p className="profile-payment-method-lbl">{m.label || "Preferred Payment Account"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="profile-payment-section" style={{ marginTop: 32 }}>
        <h3 className="profile-section-heading">Recent Payment Activity</h3>
        {transactions.length === 0 ? (
          <div className="profile-empty-state" style={{ padding: "30px 20px" }}>
            <p>No recent payment transactions recorded.</p>
          </div>
        ) : (
          <div className="profile-tx-list">
            {transactions.map((tx, idx) => (
              <div className="profile-tx-row" key={tx.id || idx}>
                <div className="profile-tx-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="profile-tx-info">
                  <h4>{tx.title}</h4>
                  <p>{tx.type} &bull; {tx.date}</p>
                </div>
                <div className="profile-tx-amount">
                  <strong>₹{Number(tx.amount).toLocaleString("en-IN")}</strong>
                  <span className="profile-tx-status status-paid">{tx.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddUpi && (
        <div className="profile-modal-backdrop" onClick={() => setShowAddUpi(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Add UPI ID</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setShowAddUpi(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveUpi} className="profile-form">
              <div className="profile-form-group">
                <label>Virtual Payment Address (VPA) *</label>
                <input
                  type="text"
                  placeholder="e.g. mobileNumber@upi, rider@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  required
                />
                <span className="profile-form-hint">
                  Your UPI ID will be verified during payment checkout.
                </span>
              </div>
              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="profile-btn-secondary"
                  onClick={() => setShowAddUpi(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save UPI Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
