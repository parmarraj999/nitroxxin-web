import "./featuresSection.css";

export function FeaturesSection({ product }) {
  const features = [
    ...(Array.isArray(product?.features) ? product.features : []),
    ...(Array.isArray(product?.highlights) ? product.highlights : []),
  ].filter(Boolean);

  return (
    <div className="features">
      <h2 className="features__title">Features</h2>
      {features.length ? features.map((text, i) => (
        <p key={i} className="features__item">{text}</p>
      )) : <p className="features__item">Feature details will appear after the vendor publishes them.</p>}
    </div>
  );
}
