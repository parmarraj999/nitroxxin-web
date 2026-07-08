import { Link } from "react-router-dom";
import "./accessoriesRelatedProduct.css";
import { useCollection } from "../../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../../services/firebase";
import { normalizeProduct } from "../../../../services/normalizers";

function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-card__image-wrap">
        {product.image ? <img className="product-card__image" src={product.image} alt={product.name} /> : <span>No image</span>}
        <button className="product-card__heart-btn" aria-label="Add to wishlist" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>
        </button>
      </div>
      <div className="product-card__info">
        <p className="product-card__category">{product.category || product.brand}</p>
        <div className="product-card__name-row">
          <p className="product-card__name">{product.name}</p>
          <span className="product-card__price">{product.offerPriceText || product.priceText || product.price}</span>
        </div>
        <button className="product-card__add-btn" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          View
        </button>
      </div>
    </Link>
  );
}

export function RelatedProducts({ product }) {
  const { data } = useCollection(COLLECTIONS.products, { limit: 16 });
  const related = data
    .map(normalizeProduct)
    .filter((item) => item.id !== product?.id)
    .filter((item) => {
      if (!product) return true;
      return item.category === product.category || item.brand === product.brand || item.vendorId === product.vendorId;
    })
    .slice(0, 8);

  if (!related.length) return null;

  return (
    <section className="related-products">
      <div className="related-products__grid">
        {related.map((item) => <ProductCard key={item.id} product={item} />)}
      </div>
    </section>
  );
}
