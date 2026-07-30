import { useState } from "react";
import "./featuresSection.css";

function ExpandableText({ text, maxLen = 300 }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  if (text.length <= maxLen) return <p className="features__text">{text}</p>;
  return (
    <div>
      <p className="features__text">
        {expanded ? text : `${text.slice(0, maxLen)}...`}
      </p>
      <button className="features__expand-btn" onClick={() => setExpanded((e) => !e)}>
        {expanded ? "Read less ↑" : "Read more ↓"}
      </button>
    </div>
  );
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`features__faq-item${open ? " open" : ""}`}>
      <button className="features__faq-q" onClick={() => setOpen((o) => !o)}>
        <span>{question}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points={open ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
        </svg>
      </button>
      {open && <p className="features__faq-a">{answer}</p>}
    </div>
  );
}

const extractFaqs = (rawFaqs) => {
  if (!Array.isArray(rawFaqs)) return [];
  return rawFaqs.map((faq) => {
    if (typeof faq === "string") {
      const parts = faq.split(/[:?]\s+/);
      return { q: parts[0], a: parts.slice(1).join(": ") || faq };
    }
    return { q: faq.question || faq.q || faq.Q || "", a: faq.answer || faq.a || faq.A || "" };
  }).filter((f) => f.q);
};

export function FeaturesSection({ product }) {
  const highlights = Array.isArray(product?.highlights) ? product.highlights : [];
  const features = Array.isArray(product?.features) ? product.features : [];
  const keyFeatures = Array.isArray(product?.keyFeatures) ? product.keyFeatures : [];

  const allFeatures = [
    ...keyFeatures.length ? keyFeatures : [],
    ...features.filter((f) => !keyFeatures.includes(f)),
    ...highlights.filter((h) => !features.includes(h) && !keyFeatures.includes(h)),
  ].filter(Boolean);

  const fullDescription = typeof product?.fullDescription === "string" ? product.fullDescription : "";
  const faqs = extractFaqs(product?.faq || product?.faqs);
  const videoLinks = Array.isArray(product?.videoLinks) ? product.videoLinks.filter(Boolean) : [];

  return (
    <div className="features">
      {/* Full description */}
      {fullDescription && (
        <div className="features__block">
          <h2 className="features__title">Description</h2>
          <ExpandableText text={fullDescription} maxLen={400} />
        </div>
      )}

      {/* Features / Highlights */}
      {allFeatures.length > 0 && (
        <div className="features__block">
          <h2 className="features__title">Features & Highlights</h2>
          <ul className="features__list">
            {allFeatures.map((text, i) => (
              <li key={i} className="features__list-item">
                <span className="features__bullet">✓</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!fullDescription && !allFeatures.length && (
        <div className="features__block">
          <h2 className="features__title">Features</h2>
          <p className="features__empty">Feature details will appear after the vendor publishes them.</p>
        </div>
      )}

      {/* Video links */}
      {videoLinks.length > 0 && (
        <div className="features__block">
          <h2 className="features__title">Videos</h2>
          <div className="features__videos">
            {videoLinks.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="features__video-link">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Watch Video {videoLinks.length > 1 ? i + 1 : ""}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      {faqs.length > 0 && (
        <div className="features__block">
          <h2 className="features__title">FAQ</h2>
          <div className="features__faqs">
            {faqs.map((f, i) => (
              <FaqItem key={i} question={f.q} answer={f.a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
