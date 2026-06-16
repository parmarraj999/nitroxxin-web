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
  return (
    <section className="profile-screen profile-screen--narrow">
      <h1>Wishlist (6)</h1>
      <div className="profile-divider" />
      <div className="wishlist-grid">
        {products.map((product, index) => (
          <article className="wishlist-item" key={`${product.name}-${index}`}>
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
          </article>
        ))}
      </div>
    </section>
  );
}
