import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { db, serverTimestamp } from "../../../services/firebase";

export default function Wallet() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [customAmount, setCustomAmount] = useState("500");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: walletTx } = useCollection(
    user?.uid ? `users/${user.uid}/wallet_transactions` : null,
    { orderBy: [["createdAt", "desc"]] }
  );

  const { data: userTx } = useCollection(
    user?.uid ? `users/${user.uid}/transactions` : null,
    { orderBy: [["createdAt", "desc"]] }
  );

  const mergedTx = React.useMemo(() => {
    const map = new Map();
    const addAll = (list) => {
      (list || []).forEach((t) => {
        const id = t.id || t.transactionId;
        if (id && !map.has(id)) {
          map.set(id, {
            ...t,
            amount: Number(t.amount || 0),
            title: t.title || t.description || "Transaction",
            dateText: t.dateText || (t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString("en-IN") : "Recent"),
            status: t.status || "success",
            type: t.type || "debit",
          });
        }
      });
    };
    addAll(walletTx);
    addAll(userTx);
    return Array.from(map.values());
  }, [walletTx, userTx]);

  const [localTxList, setLocalTxList] = useState(null);
  const transactions = localTxList || mergedTx;

  // Compute live District Money Balance from real user transactions
  const totalBalance = transactions.reduce((acc, curr) => {
    if (curr.type === "credit" || curr.type === "refund") {
      return acc + Number(curr.amount || 0);
    }
    if (curr.type === "debit" && curr.status !== "failed") {
      return Math.max(0, acc - Number(curr.amount || 0));
    }
    return acc;
  }, 0);

  const filteredTx = transactions.filter((tx) => {
    if (filter === "All") return true;
    if (filter === "Debit") return tx.type === "debit";
    if (filter === "Credit") return tx.type === "credit";
    if (filter === "Refunds") return tx.type === "refund" || tx.type === "credit";
    return true;
  });

  const handleAddMoney = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(customAmount);
    if (!amountVal || amountVal <= 0) return;

    setIsProcessing(true);
    const newTx = {
      id: `tx-${Date.now()}`,
      title: "Add Money - UPI Recharge",
      category: "wallet",
      type: "credit",
      dateText: `on ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}, at ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase()}`,
      amount: amountVal,
      status: "success",
    };

    if (user?.uid) {
      try {
        await db().collection("users").doc(user.uid).collection("wallet_transactions").add({
          ...newTx,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Failed to add transaction to Firestore:", err);
      }
    }

    setLocalTxList((prev) => [newTx, ...(prev || transactions)]);
    setIsProcessing(false);
    setShowAddModal(false);
  };

  const getTxIcon = (item) => {
    if (item.category === "event" || item.title?.toLowerCase().includes("event")) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
          <path d="M9 18V5l12-2v13" />
          <path d="M6 8l12-2" />
        </svg>
      );
    }
    if (item.category === "ticket" || item.title?.toLowerCase().includes("failed")) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="2" y1="7" x2="7" y2="7" />
          <line x1="2" y1="17" x2="7" y2="17" />
          <line x1="17" y1="17" x2="22" y2="17" />
          <line x1="17" y1="7" x2="22" y2="7" />
        </svg>
      );
    }
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    );
  };

  return (
    <div className="nx-wallet-page-wrap">
      {/* Top Header matching Screenshot 3 */}
      <div className="nx-wallet-header">
        <Link to="/profile" className="nx-wallet-back-btn" title="Back to Profile">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
      </div>

      {/* Desktop Dashboard Grid */}
      <div className="nx-wallet-desktop-layout">
        {/* Hero Section matching Screenshot 3 */}
        <div className="nx-wallet-hero-card">
          {/* Glowing 3D Purple Wallet Graphic with Radiant Green Banknotes */}
          <div className="nx-wallet-3d-visual">
            <div className="nx-wallet-glow-aura" />
            <svg width="140" height="130" viewBox="0 0 160 140" fill="none" className="nx-wallet-svg-illus">
              <defs>
                {/* Glowing Green Cash Gradients */}
                <linearGradient id="cashGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="100%" stopColor="#15803d" />
                </linearGradient>
                <linearGradient id="cashGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#86efac" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
                {/* Purple 3D Wallet Leather Gradients */}
                <linearGradient id="walletGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="50%" stopColor="#7e22ce" />
                  <stop offset="100%" stopColor="#4c1d95" />
                </linearGradient>
                <linearGradient id="walletGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#6b21a8" />
                </linearGradient>
                <filter id="cashGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Fanned Out Green Neon Cash Notes */}
              <g filter="url(#cashGlow)">
                <path d="M45 42 L75 14 L110 32 L80 60 Z" fill="url(#cashGrad1)" opacity="0.9" />
                <path d="M55 36 L85 10 L120 28 L90 54 Z" fill="url(#cashGrad2)" opacity="0.95" />
                <path d="M68 32 L98 6 L130 24 L100 50 Z" fill="#86efac" />
              </g>

              {/* Purple 3D Wallet Main Shell */}
              <rect x="24" y="44" width="112" height="74" rx="20" fill="url(#walletGrad1)" />
              <rect x="28" y="48" width="104" height="66" rx="16" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" />
              
              {/* Wallet Front Flap with Metallic Fastener */}
              <path d="M24 64 Q80 84 136 64 L136 94 Q80 114 24 94 Z" fill="url(#walletGrad2)" />
              <circle cx="80" cy="85" r="9" fill="#e9d5ff" />
              <circle cx="80" cy="85" r="5" fill="#581c87" />
            </svg>
          </div>

          {/* District Money Balance matching Screenshot 3 */}
          <div className="nx-wallet-balance-wrap">
            <h2 className="nx-wallet-balance-value">
              ₹{totalBalance.toFixed(2)}
            </h2>
            <span className="nx-wallet-balance-label">DISTRICT MONEY BALANCE</span>
          </div>

          {/* Solid White Add Money Button matching Screenshot 3 */}
          <button
            type="button"
            className="nx-wallet-add-btn"
            onClick={() => setShowAddModal(true)}
          >
            Add money
          </button>
        </div>

        {/* Transaction History Section matching Screenshot 3 */}
        <div className="nx-wallet-tx-section">
          <h3 className="nx-wallet-tx-heading">Transaction history</h3>

          {/* Filter Pills matching Screenshot 3: All, Debit, Credit, Refunds */}
          <div className="nx-wallet-filter-tabs">
            {["All", "Debit", "Credit", "Refunds"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`nx-wallet-filter-pill${filter === tab ? " is-active" : ""}`}
                onClick={() => setFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Transactions List */}
          <div className="nx-wallet-tx-list">
            {filteredTx.length === 0 ? (
              <div className="nx-wallet-empty-tx">
                <p>No transactions found for this category.</p>
              </div>
            ) : (
              filteredTx.map((tx) => (
                <div className="nx-wallet-tx-card" key={tx.id}>
                  {/* Left: Square Icon + Title + Timestamp */}
                  <div className="nx-wallet-tx-left">
                    <div className="nx-wallet-tx-icon-box">
                      {getTxIcon(tx)}
                    </div>
                    <div className="nx-wallet-tx-info">
                      <h4 className="nx-wallet-tx-title">{tx.title}</h4>
                      <p className="nx-wallet-tx-date">{tx.dateText}</p>
                    </div>
                  </div>

                  {/* Right: Amount */}
                  <div className="nx-wallet-tx-amount">
                    ₹{Number(tx.amount).toLocaleString("en-IN")}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddModal && (
        <div className="profile-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Add District Money</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddMoney} className="profile-modal-form">
              <div className="profile-form-group">
                <label>Enter Recharge Amount (₹)</label>
                <input
                  type="number"
                  min="50"
                  max="50000"
                  step="50"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="500"
                  required
                />
              </div>

              {/* Quick Presets */}
              <div className="nx-wallet-presets-row">
                {[500, 1000, 2000, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="nx-wallet-preset-pill"
                    onClick={() => setCustomAmount(String(preset))}
                  >
                    +₹{preset}
                  </button>
                ))}
              </div>

              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="profile-btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-btn-primary"
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : `Recharge ₹${customAmount}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
