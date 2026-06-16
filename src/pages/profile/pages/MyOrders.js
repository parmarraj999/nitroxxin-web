import FilterPills from "../components/FilterPills";

const jacketImage =
  "https://i.pinimg.com/736x/db/b1/48/dbb148ec3cfbe0bad158b7fb64d17541.jpg";

export default function MyOrders() {
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
      <article className="order-card">
        <img src={jacketImage} alt="AXOR Helmet Apex Solid Black Dull" />
        <div className="order-info">
          <p>Rider Wear</p>
          <h2>AXOR Helmet Apex Solid Black Dull</h2>
          <strong>ALPINESTER</strong>
          <p>Order Id #4823832</p>
          <h3>$1200</h3>
          <span>Click to see more details</span>
          <div className="order-progress">
            {["Ordered", "Confirm", "Shipped", "Delivered"].map((step, index) => (
              <div className="order-step" key={step}>
                <i />
                <strong>{step}</strong>
                <span>15 Jan</span>
                {index < 3 && <b />}
              </div>
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}
