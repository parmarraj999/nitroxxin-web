import "./additionalInfo.css";

const labelize = (key) =>
  String(key || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());

/** Safely convert any value to a renderable string. */
const toRenderable = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(toRenderable).filter(Boolean).join(", ");
  if (typeof value === "object") {
    // Handle objects like { value: 500, unit: "kg" }
    const parts = [];
    if (value.value !== undefined) parts.push(value.value);
    if (value.unit !== undefined) parts.push(value.unit);
    if (parts.length) return parts.join(" ");
    // Fallback: join all values
    return Object.values(value).map(toRenderable).filter(Boolean).join(", ");
  }
  return String(value);
};

export function AdditionalInfo({ product }) {
  const specs = product?.specifications || product?.additionalInfo || {};
  const rows = [
    ["Brand", product?.brand],
    ["Category", product?.category],
    ["Subcategory", product?.subcategory || product?.subcategoryName],
    ["Compatibility", product?.compatibility],
    ["Dimensions", product?.dimensions],
    ["Weight", product?.weight],
    ["Warranty", product?.warranty],
    ["Return Policy", product?.returnPolicy],
    ...Object.entries(specs).map(([key, value]) => [labelize(key), value]),
  ].filter(([, value]) => {
    const str = toRenderable(value);
    return str !== undefined && str !== null && str.trim() !== "";
  });

  return (
    <div className="additional-info">
      <h3 className="additional-info__title">Additional Information</h3>
      {rows.length ? rows.map(([key, value]) => (
        <div key={key} className="additional-info__row">
          <span className="additional-info__key">{key}</span>
          <span className="additional-info__value">{toRenderable(value)}</span>
        </div>
      )) : <p className="additional-info__value">Specifications will appear after the vendor updates this product.</p>}
    </div>
  );
}
