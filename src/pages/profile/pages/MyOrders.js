import FilterPills from "../components/FilterPills";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";
import { normalizeProduct } from "../../../services/normalizers";

export default function MyOrders() {
  const { user } = useAuth();
  const { data } = useCollection(COLLECTIONS.orders, {
    where: [["userId", "==", user?.uid]],
    orderBy: [["createdAt", "desc"]],
    limit: 50,
  });

  return (
    <section className="profile-screen profile-screen--wide">
      <div className="orders-head">
        <h1>My Orders</h1>
        <label className="orders-search">
          <span>&#8981;</span>
          <input type="search" placeholder="Search..." />
        </label>
      </div>
      <div className="profile-divider" />
      <FilterPills items={["All", "Delivered", "Confirm", "Shipped"]} />
      {data.length ? data.map((order) => {
        const product = normalizeProduct(order.items?.[0]?.productSnapshot || {});
        const status = String(order.status || "pending").toLowerCase();
        const timeline = ["pending", "confirmed", "packed", "shipped", "out for delivery", "delivered"];
        const currentIndex = Math.max(0, timeline.indexOf(status));
        return (
          <article className="order-card" key={order.id}>
            {product.image ? <img src={product.image} alt={product.name} /> : <div className="order-card__image-empty">No image</div>}
            <div className="order-info">
              <p>{product.category}</p>
              <h2>{product.name}</h2>
              <strong>{product.brand}</strong>
              <p>Order ID #{order.orderId || order.id}</p>
              <p>Payment: {order.paymentStatus || "pending"} | Method: {order.paymentMethod || "online"}</p>
              <p>Courier: {order.courier || order.deliveryPartner || "Awaiting assignment"}</p>
              <p>Tracking: {order.trackingNumber || "Generated after shipping"}</p>
              <h3>Rs. {Number(order.totalAmount || order.total || 0).toLocaleString("en-IN")}</h3>
              <span>{status.replace(/\b\w/g, (letter) => letter.toUpperCase())}</span>
              <div className="order-progress">
                {timeline.slice(0, 5).map((step, index) => (
                  <div className="order-step" key={step}>
                    <i className={index <= currentIndex ? "is-complete" : ""} />
                    <strong>{step.replace(/\b\w/g, (letter) => letter.toUpperCase())}</strong>
                    <span>{status === step ? "Now" : ""}</span>
                    {index < 4 && <b />}
                  </div>
                ))}
              </div>
            </div>
          </article>
        );
      }) : <p>No orders yet.</p>}
    </section>
  );
}
