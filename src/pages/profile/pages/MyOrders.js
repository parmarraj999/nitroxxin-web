import FilterPills from "../components/FilterPills";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";
import { normalizeProduct } from "../../../services/normalizers";

const jacketImage =
  "https://i.pinimg.com/736x/db/b1/48/dbb148ec3cfbe0bad158b7fb64d17541.jpg";

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
        return (
          <article className="order-card" key={order.id}>
            <img src={product.image || jacketImage} alt={product.name} />
            <div className="order-info">
              <p>{product.category}</p>
              <h2>{product.name}</h2>
              <strong>{product.brand}</strong>
              <p>Order Id #{order.orderId}</p>
              <h3>{product.offerPriceText || product.priceText || order.total}</h3>
              <span>{order.status}</span>
              <div className="order-progress">
                {["Pending", "Confirmed", "Processing", "Shipped", "Delivered"].map((step, index) => (
                  <div className="order-step" key={step}>
                    <i />
                    <strong>{step}</strong>
                    <span>{order.status === step ? "Now" : ""}</span>
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
