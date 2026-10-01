import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useAuthModal } from "../../components/AuthModal/useAuthModal";
import { useCollection } from "../../hooks/useFirestore";
import { COLLECTIONS, db, serverTimestamp } from "../../services/firebase";
import { normalizeProduct } from "../../services/normalizers";
import { removeCartItem, updateCartQuantity } from "../../services/commerceService";
import { makePayment } from "../../payments/makePayment";
import "./CartPage.css";

const money = (value) => `Rs. ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

export default function CartPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { openLogin } = useAuthModal();
  const { data: cartItems = [], loading } = useCollection(COLLECTIONS.cart, {
    where: user?.uid ? [["userId", "==", user.uid]] : [["userId", "==", "NO_USER"]],
    limit: 50,
  });

  // Fetch saved delivery addresses from users/{userId}/address
  const { data: rawSavedAddresses = [] } = useCollection(
    user?.uid ? `users/${user.uid}/address` : null
  );

  const savedAddresses = useMemo(() => {
    return [...rawSavedAddresses].sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      const getMillis = (v) => (v?.toMillis ? v.toMillis() : v?.seconds ? v.seconds * 1000 : (Number(v) || 0));
      return getMillis(b.createdAt) - getMillis(a.createdAt);
    });
  }, [rawSavedAddresses]);

  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isCustomAddress, setIsCustomAddress] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(false);

  const [shipping, setShipping] = useState({
    name: profile?.fullName || profile?.name || profile?.displayName || user?.fullName || user?.displayName || "",
    phone: profile?.phone || profile?.phoneNumber || user?.phone || user?.phoneNumber || "",
    address: profile?.address || profile?.street || "",
    city: profile?.city || "",
    state: profile?.state || "",
    pincode: profile?.pincode || profile?.postalCode || "",
  });

  // Automatically select default address from savedAddresses when loaded
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0 && !selectedAddressId && !isCustomAddress) {
      const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      if (def) {
        setSelectedAddressId(def.id);
        setShipping({
          name: def.name || profile?.fullName || user?.fullName || "",
          phone: def.phone || profile?.phone || user?.phone || "",
          address: def.street || def.address || "",
          city: def.city || "",
          state: def.state || "",
          pincode: def.pincode || def.postalCode || "",
        });
      }
    }
  }, [savedAddresses, selectedAddressId, isCustomAddress, profile, user]);

  // Keep shipping name and phone synced with user account when custom
  useEffect(() => {
    if ((user || profile) && isCustomAddress) {
      setShipping((prev) => ({
        ...prev,
        name: prev.name || profile?.fullName || profile?.name || user?.fullName || "",
        phone: prev.phone || profile?.phone || user?.phone || "",
      }));
    }
  }, [user, profile, isCustomAddress]);

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setIsCustomAddress(false);
    setShipping({
      name: addr.name || "",
      phone: addr.phone || "",
      address: addr.street || addr.address || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || addr.postalCode || "",
    });
  };

  const handleEnterNewAddress = () => {
    setSelectedAddressId(null);
    setIsCustomAddress(true);
    setShipping({
      name: profile?.fullName || user?.fullName || "",
      phone: profile?.phone || user?.phone || "",
      address: "",
      city: "",
      state: "",
      pincode: "",
    });
  };

  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [coupon, setCoupon] = useState("");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);

  const summary = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => {
      const product = normalizeProduct(item.productSnapshot || {});
      return sum + Number(product.offerPrice ?? product.price ?? 0) * Number(item.quantity || 1);
    }, 0);
    const gst = Math.round(subtotal * 0.18);
    const shippingFee = deliveryMethod === "express" ? 249 : deliveryMethod === "same-day" ? 499 : subtotal > 2999 ? 0 : 99;
    const platformFee = cartItems.length ? 29 : 0;
    const discount = coupon === "NITROXX10" ? Math.min(750, Math.round(subtotal * 0.1)) : 0;
    return { subtotal, gst, shippingFee, platformFee, discount, total: Math.max(0, subtotal + gst + shippingFee + platformFee - discount) };
  }, [cartItems, coupon, deliveryMethod]);

  const submitOrder = async () => {
    if (!user) {
      openLogin();
      return;
    }

    const missing = Object.entries(shipping).find(([, value]) => !String(value || "").trim());
    if (missing) {
      setError("Please complete all delivery address fields before checkout.");
      return;
    }

    // Auto-save new address to users/{userId}/address if requested
    if (saveToProfile && user?.uid && (isCustomAddress || savedAddresses.length === 0)) {
      try {
        const colRef = db().collection("users").doc(user.uid).collection("address");
        const docRef = colRef.doc();
        await docRef.set({
          id: docRef.id,
          name: shipping.name.trim(),
          phone: shipping.phone.trim(),
          street: shipping.address.trim(),
          address: shipping.address.trim(),
          city: shipping.city.trim(),
          state: shipping.state.trim() || "Madhya Pradesh",
          pincode: shipping.pincode.trim(),
          postalCode: shipping.pincode.trim(),
          type: "Home",
          isDefault: savedAddresses.length === 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (saveErr) {
        console.warn("Failed to auto-save address to profile:", saveErr);
      }
    }

    try {
      setPlacing(true);
      setError("");

      await makePayment({
        amount: summary.total,
        cartItems,
        user,
        profile,
        shipping: { ...shipping, deliveryMethod, coupon, totals: summary },
        navigate,
        setLoading: setPlacing,
        onError: (err) => {
          setError(err.message || "Payment process could not be completed.");
          setPlacing(false);
        },
        onSuccess: (orderResult) => {
          setPlacing(false);
          console.log("Payment successful, order recorded:", orderResult);
        },
      });
    } catch (orderError) {
      setError(orderError.message || "Failed to initiate payment.");
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="nx-empty-state nx-empty-state--light">
          <h3>Loading cart</h3>
          <p>Syncing your cart from Firestore.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <header className="cart-page__header">
        <div className="cart-page__title-group">
          <button className="cart-page__back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <FiArrowLeft size={24} />
          </button>
          <div>
            <p>Nitroxx checkout</p>
            <h1>Shopping Cart</h1>
          </div>
        </div>
        <Link to="/accessories">Continue shopping</Link>
      </header>

      {!cartItems.length ? (
        <div className="nx-empty-state nx-empty-state--light">
          <h3>Your cart is empty</h3>
          <p>Add products from Accessories and they will stay synced here in real time.</p>
        </div>
      ) : (
        <div className="cart-page__layout">
          <main className="cart-page__items">
            {cartItems.map((item) => {
              const product = normalizeProduct(item.productSnapshot || {});
              const quantity = Number(item.quantity || 1);
              return (
                <article className="cart-item" key={item.id}>
                  <Link to={`/product/${product.id}`} className="cart-item__image">
                    {product.image ? <img src={product.image} alt={product.name} /> : <span>No image</span>}
                  </Link>
                  <div className="cart-item__body">
                    <p>{product.brand || product.category}</p>
                    <h2>{product.name}</h2>
                    <span>Variant: {item.options?.size || item.options?.color || "Standard"}</span>
                    <strong>{product.offerPriceText || product.priceText || money(product.offerPrice || product.price)}</strong>
                    <div className="cart-item__actions">
                      <button onClick={() => updateCartQuantity(item.id, Math.max(1, quantity - 1))}>-</button>
                      <span>{quantity}</span>
                      <button onClick={() => updateCartQuantity(item.id, quantity + 1)}>+</button>
                      <button onClick={() => removeCartItem(item.id)}>Remove</button>
                    </div>
                  </div>
                </article>
              );
            })}

            <section className="cart-panel">
              <div className="cart-panel__header">
                <h2>Delivery Address</h2>
                {user && (
                  <Link to="/profile/saved-addresses" className="cart-manage-addr-link">
                    Manage Addresses ➔
                  </Link>
                )}
              </div>

              {/* Saved Addresses Picker (when user has saved addresses in users/{userId}/address) */}
              {user && savedAddresses.length > 0 && (
                <div className="cart-saved-addresses-wrapper">
                  <div className="cart-saved-addresses-top">
                    <span className="cart-saved-addresses-title">Select from saved addresses:</span>
                    <button
                      type="button"
                      className={`cart-new-addr-toggle-btn ${isCustomAddress ? 'is-active' : ''}`}
                      onClick={() => {
                        if (isCustomAddress) {
                          const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
                          if (def) handleSelectAddress(def);
                        } else {
                          handleEnterNewAddress();
                        }
                      }}
                    >
                      {isCustomAddress ? '← Use Saved Address' : '+ Add / Enter Different Address'}
                    </button>
                  </div>

                  {!isCustomAddress && (
                    <div className="cart-saved-addresses-grid">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        const isHome = (addr.type || 'Home').toLowerCase() === 'home';

                        return (
                          <div
                            key={addr.id}
                            className={`cart-addr-card ${isSelected ? 'is-selected' : ''}`}
                            onClick={() => handleSelectAddress(addr)}
                          >
                            <div className="cart-addr-card__radio-col">
                              <span className={`cart-addr-radio-circle ${isSelected ? 'is-checked' : ''}`}>
                                {isSelected && <span className="cart-addr-radio-dot" />}
                              </span>
                            </div>
                            <div className="cart-addr-card__details">
                              <div className="cart-addr-card__tags">
                                <span className={`cart-addr-tag ${isHome ? 'home' : 'work'}`}>
                                  {addr.type || 'Home'}
                                </span>
                                {addr.isDefault && (
                                  <span className="cart-addr-default-tag">DEFAULT</span>
                                )}
                              </div>
                              <h4 className="cart-addr-name">{addr.name}</h4>
                              <p className="cart-addr-street">
                                {addr.street || addr.address}
                                {addr.city ? `, ${addr.city}` : ''}
                                {addr.state ? `, ${addr.state}` : ''}
                                {(addr.pincode || addr.postalCode) ? ` - ${addr.pincode || addr.postalCode}` : ''}
                              </p>
                              {addr.phone && (
                                <p className="cart-addr-phone">Mobile: {addr.phone}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Form Grid for custom address entry or when no saved addresses exist */}
              {(isCustomAddress || savedAddresses.length === 0) ? (
                <div className="cart-custom-address-form">
                  {savedAddresses.length > 0 && (
                    <h3 className="cart-form-section-title">Enter Delivery Details</h3>
                  )}
                  <div className="cart-form-grid">
                    <label>
                      <span>Full Name *</span>
                      <input
                        value={shipping.name}
                        onChange={(e) => setShipping((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Raj Parmar"
                        required
                      />
                    </label>
                    <label>
                      <span>Mobile Number *</span>
                      <input
                        value={shipping.phone}
                        onChange={(e) => setShipping((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="+91 8869959066"
                        required
                      />
                    </label>
                    <label className="cart-form-full-width">
                      <span>Street Address / Flat / Building *</span>
                      <input
                        value={shipping.address}
                        onChange={(e) => setShipping((prev) => ({ ...prev, address: e.target.value }))}
                        placeholder="374/2, Sector C, Shakti Nagar"
                        required
                      />
                    </label>
                    <label>
                      <span>City *</span>
                      <input
                        value={shipping.city}
                        onChange={(e) => setShipping((prev) => ({ ...prev, city: e.target.value }))}
                        placeholder="Bhopal"
                        required
                      />
                    </label>
                    <label>
                      <span>State *</span>
                      <input
                        value={shipping.state}
                        onChange={(e) => setShipping((prev) => ({ ...prev, state: e.target.value }))}
                        placeholder="Madhya Pradesh"
                        required
                      />
                    </label>
                    <label>
                      <span>PIN Code *</span>
                      <input
                        value={shipping.pincode}
                        onChange={(e) => setShipping((prev) => ({ ...prev, pincode: e.target.value }))}
                        placeholder="487001"
                        required
                      />
                    </label>
                  </div>

                  {user && (
                    <label className="cart-save-to-profile-checkbox">
                      <input
                        type="checkbox"
                        checked={saveToProfile}
                        onChange={(e) => setSaveToProfile(e.target.checked)}
                      />
                      <span>Save this address to my profile for future orders</span>
                    </label>
                  )}
                </div>
              ) : (
                <div className="cart-selected-address-bar">
                  <div className="cart-selected-address-info">
                    <span className="cart-selected-pill">Delivering to</span>
                    <strong>{shipping.name}</strong> • {shipping.phone}
                    <p>{shipping.address}, {shipping.city}, {shipping.state} - {shipping.pincode}</p>
                  </div>
                  <button
                    type="button"
                    className="cart-change-address-btn"
                    onClick={handleEnterNewAddress}
                  >
                    + Enter Different Address
                  </button>
                </div>
              )}
            </section>
          </main>

          <aside className="cart-summary">
            <h2>Order Summary</h2>
            <label>
              <span>Delivery Method</span>
              <select value={deliveryMethod} onChange={(event) => setDeliveryMethod(event.target.value)}>
                <option value="standard">Standard</option>
                <option value="express">Express</option>
                <option value="same-day">Same Day</option>
                <option value="pickup">Store Pickup</option>
              </select>
            </label>
            <label>
              <span>Coupon</span>
              <input value={coupon} onChange={(event) => setCoupon(event.target.value.toUpperCase())} placeholder="NITROXX10" />
            </label>
            <dl>
              <div><dt>Subtotal</dt><dd>{money(summary.subtotal)}</dd></div>
              <div><dt>GST</dt><dd>{money(summary.gst)}</dd></div>
              <div><dt>Shipping</dt><dd>{money(summary.shippingFee)}</dd></div>
              <div><dt>Platform fee</dt><dd>{money(summary.platformFee)}</dd></div>
              <div><dt>Discount</dt><dd>-{money(summary.discount)}</dd></div>
              <div className="cart-summary__total"><dt>Grand Total</dt><dd>{money(summary.total)}</dd></div>
            </dl>
            {error && <p className="cart-error">{error}</p>}
            <button className="cart-pay-btn" onClick={submitOrder} disabled={placing}>
              {placing ? (
                <span className="cart-pay-loading">
                  <span className="cart-spinner" /> Initiating Razorpay…
                </span>
              ) : (
                <span>Pay {money(summary.total)} with Razorpay ➔</span>
              )}
            </button>
            <div className="cart-security-badge">
              <span>🔒 100% Secure Checkout via Razorpay</span>
              <span className="cart-security-methods">UPI • Cards • NetBanking • EMI</span>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
