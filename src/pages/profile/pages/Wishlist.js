import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";
import { normalizeEvent, normalizeProduct } from "../../../services/normalizers";

const products = [
  { name: "Leather Shoes", image: "/assets/images/category-shoes.png" },
  {
    name: "Helmet",
    image: "https://i.pinimg.com/736x/9d/40/ba/9d40ba856ab1c616c406aa420c9c384f.jpg",
  },
  {
    name: "Jacket",
    image: "https://i.pinimg.com/736x/db/b1/48/dbb148ec3cfbe0bad158b7fb64d17541.jpg",
  },
  {
    name: "Jacket",
    image: "https://i.pinimg.com/736x/db/b1/48/dbb148ec3cfbe0bad158b7fb64d17541.jpg",
  },
  { name: "Leather Shoes", image: "/assets/images/category-shoes.png" },
  {
    name: "Helmet",
    image: "https://i.pinimg.com/736x/9d/40/ba/9d40ba856ab1c616c406aa420c9c384f.jpg",
  },
];

export default function Wishlist() {
  const { user } = useAuth();
  const { data } = useCollection(COLLECTIONS.wishlist, {
    where: [["userId", "==", user?.uid]],
    limit: 50,
  });
  const items = data.length ? data : products;

  return (
    <section className="profile-screen profile-screen--narrow">
      <h1>Wishlist ({items.length})</h1>
      <div className="profile-divider" />
      <div className="wishlist-grid">
        {items.map((item, index) => {
          const saved = item.type === "event" ? normalizeEvent(item.eventSnapshot || item) : normalizeProduct(item.productSnapshot || item);
          const href = item.type === "event" ? `/event/${saved.id}` : `/product/${saved.id}`;
          return (
            <Link className="wishlist-item" key={item.id || `${saved.name}-${index}`} to={href}>
              <img src={saved.image} alt={saved.name || saved.title} />
              <h3>{saved.name || saved.title}</h3>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
