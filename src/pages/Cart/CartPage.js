import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { useCollection } from "../../hooks/useFirestore";
import { COLLECTIONS } from "../../services/firebase";
import { normalizeProduct } from "../../services/normalizers";
import { placeOrder, removeCartItem, updateCartQuantity } from "../../services/commerceService";
import "./CartPage.css";

const money = (value) => `Rs. ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;

export default function CartPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { data: cartItems, loading } = useCollection(COLLECTIONS.cart, {
    where: [["userId", "==", user?.uid]],
    limit: 50,
  });
  const [shipping, setShipping] = useState({
    name: profile?.fullName || profile?.name || profile?.displayName || user?.fullName || user?.displayName || "",
    phone: profile?.phone || profile?.phoneNumber || user?.phone || user?.phoneNumber || "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
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
    const missing = Object.entries(shipping).find(([, value]) => !String(value || "").trim());
    if (missing) {
      setError("Complete delivery address before checkout.");
      return;
    }
    try {
      setPlacing(true);
      setError("");
      await placeOrder({ user, profile, cartItems, shipping: { ...shipping, deliveryMethod, coupon, totals: summary } });
      navigate("/profile/accessories");
    } catch (orderError) {
      setError(orderError.message);
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
              <h2>Delivery Address</h2>
              <div className="cart-form-grid">
                {Object.keys(shipping).map((field) => (
                  <label key={field}>
                    <span>{field.replace(/\b\w/g, (letter) => letter.toUpperCase())}</span>
                    <input value={shipping[field]} onChange={(event) => setShipping((prev) => ({ ...prev, [field]: event.target.value }))} />
                  </label>
                ))}
              </div>
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
            <button onClick={submitOrder} disabled={placing}>
              {placing ? "Creating order..." : "Place Order"}
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
