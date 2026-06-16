import "./featuresSection.css";

const features = [
  "Knox SPS 303 palm sliders eliminate the grab effect in a fall, shielding your scaphoid from serious injury on urban roads or weekend rides",
  "Memory foam-backed dual-density knuckle protectors, pre-curved fit, and finger accordions deliver zero break-in time and smooth control at every stoplight",
  "Abrasion-resistant goatskin leather and heavy-duty 3D air mesh are built for Indian summers - CE Level 1 certified, and tested to outperform Level 2 benchmarks where it counts",
];

export function FeaturesSection() {
  return (
    <div className="features">
      <h2 className="features__title">Features</h2>
      {features.map((text, i) => (
        <p key={i} className="features__item">{text}</p>
      ))}
    </div>
  );
}
