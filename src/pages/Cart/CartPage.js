import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCollection } from "../../hooks/useFirestore";
import { COLLECTIONS } from "../../services/firebase";
import { normalizeProduct } from "../../services/normalizers";
import { placeOrder, removeCartItem, updateCartQuantity } from "../../services/commerceService";

export default function CartPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { data: cartItems } = useCollection(COLLECTIONS.cart, {
    where: [["userId", "==", user?.uid]],
    limit: 50,
  });
  const [shipping, setShipping] = useState({
    name: profile?.fullName || profile?.displayName || "",
    phone: profile?.phone || "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [error, setError] = useState("");

  const total = cartItems.reduce((sum, item) => {
    const product = normalizeProduct(item.productSnapshot || {});
    return sum + Number(product.offerPrice ?? product.price ?? 0) * Number(item.quantity || 1);
  }, 0);

  const submitOrder = async () => {
    try {
      setError("");
      await placeOrder({ user, profile, cartItems, shipping });
      navigate("/profile/accessories");
    } catch (orderError) {
      setError(orderError.message);
    }
  };

  return (
    <div className="products-page">
      <div style={{ padding: "40px" }}>
        <h1 className="products-page__title">Cart</h1>
        <div className="products-page__grid">
          {cartItems.map((item) => {
            const product = normalizeProduct(item.productSnapshot || {});
            return (
              <article className="product-card" key={item.id}>
                <Link to={`/product/${product.id}`}>
                  <div className="product-card__image">
                    {product.image && <img src={product.image} alt={product.name} />}
                  </div>
                  <h3>{product.name}</h3>
                </Link>
                <div className="product-card__price">{product.offerPriceText || product.priceText || product.price}</div>
                <div className="product-card__emi">
                  Qty
                  <button onClick={() => updateCartQuantity(item.id, Math.max(1, Number(item.quantity || 1) - 1))}>-</button>
                  <span>{item.quantity || 1}</span>
                  <button onClick={() => updateCartQuantity(item.id, Number(item.quantity || 1) + 1)}>+</button>
                  <button onClick={() => removeCartItem(item.id)}>Remove</button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="products-page__topbar">
          <div className="products-page__left">
            <span className="products-page__count">Total: ₹{total.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="products-filter products-filter--open">
          {Object.keys(shipping).map((field) => (
            <div className="products-filter__column" key={field}>
              <h4>{field}</h4>
              <input value={shipping[field]} onChange={(event) => setShipping((prev) => ({ ...prev, [field]: event.target.value }))} />
            </div>
          ))}
        </div>

        {error && <p style={{ color: "#c62828" }}>{error}</p>}
        <button className="products-page__filter-btn products-page__filter-btn--active" onClick={submitOrder} disabled={!cartItems.length}>
          Place Order
        </button>
      </div>
    </div>
  );
}
