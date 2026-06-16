import "./accessoriesRelatedProduct.css";


const products = [
  { id: 1, image: 'https://i.pinimg.com/736x/db/b1/48/dbb148ec3cfbe0bad158b7fb64d17541.jpg', category: "Rider Wear", name: "Leather Jacket", price: "$1200" },
  { id: 2, image: 'https://i.pinimg.com/736x/db/b1/48/dbb148ec3cfbe0bad158b7fb64d17541.jpg', category: "Rider Wear", name: "Leather Jacket", price: "$1200" },
  { id: 3, image: 'https://i.pinimg.com/736x/db/b1/48/dbb148ec3cfbe0bad158b7fb64d17541.jpg', category: "Rider Wear", name: "Leather Jacket", price: "$1200" },
  { id: 4, image: 'https://i.pinimg.com/736x/db/b1/48/dbb148ec3cfbe0bad158b7fb64d17541.jpg', category: "Rider Wear", name: "Leather Jacket", price: "$1200" },
];

function ProductCard({ product }) {
  return (
    <div className="product-card">
      <div className="product-card__image-wrap">
        <img className="product-card__image" src={product.image} alt={product.name} />
        <button className="product-card__heart-btn" aria-label="Add to wishlist">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart-icon lucide-heart"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>
        </button>
      </div>
      <div className="product-card__info">
        <p className="product-card__category">{product.category}</p>
        <div className="product-card__name-row">
          <p className="product-card__name">{product.name}</p>
          <span className="product-card__price">{product.price}</span>
        </div>
        <button className="product-card__add-btn">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-cart-icon lucide-shopping-cart"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          Add to Cart
        </button>
      </div>
    </div>
  );
}

export function RelatedProducts() {
  return (
    <section className="related-products">
      <div className="related-products__grid">
        {[...products, ...products].map((product, i) => (
          <ProductCard key={i} product={{ ...product, id: i }} />
        ))}
      </div>
    </section>
  );
}
