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
    const parts = [];
    if (value.value !== undefined) parts.push(value.value);
    if (value.unit !== undefined) parts.push(value.unit);
    if (parts.length) return parts.join(" ");
    return Object.values(value).map(toRenderable).filter(Boolean).join(", ");
  }
  return String(value);
};

const notEmpty = (value) => {
  const str = toRenderable(value);
  return str !== undefined && str !== null && str.trim() !== "" && str !== "false";
};

function InfoSection({ title, rows }) {
  const filtered = rows.filter(([, value]) => notEmpty(value));
  if (!filtered.length) return null;
  return (
    <div className="additional-info__section">
      <h4 className="additional-info__section-title">{title}</h4>
      {filtered.map(([key, value]) => (
        <div key={key} className="additional-info__row">
          <span className="additional-info__key">{key}</span>
          <span className="additional-info__value">{toRenderable(value)}</span>
        </div>
      ))}
    </div>
  );
}

export function AdditionalInfo({ product }) {
  // Extract custom attributes provided by the vendor
  const rawCustom = product?.customAttributes;
  const customRows = Array.isArray(rawCustom)
    ? rawCustom
        .map((item) => [labelize(item?.key || item?.name || item?.label || ""), item?.value ?? item?.val ?? ""])
        .filter(([k, v]) => k && notEmpty(v))
    : rawCustom && typeof rawCustom === "object"
    ? Object.entries(rawCustom)
        .map(([k, v]) => [labelize(k), v])
        .filter(([k, v]) => k && notEmpty(v))
    : [];

  // Extract variants options summary if variants array is present
  const variantColors = [];
  const variantSizes = [];
  const variantSkus = [];
  if (Array.isArray(product?.variants)) {
    product.variants.forEach((v) => {
      if (v?.options?.color && !variantColors.includes(v.options.color)) variantColors.push(v.options.color);
      if (v?.options?.size && !variantSizes.includes(v.options.size)) variantSizes.push(v.options.size);
      if (v?.sku && !variantSkus.includes(v.sku)) variantSkus.push(v.sku);
    });
  }

  // Product identity
  const identityRows = [
    ["Brand", product?.brand],
    ["Manufacturer", product?.manufacturer],
    ["Vendor", product?.vendorName],
    ["SKU", product?.sku || (variantSkus.length ? variantSkus.join(", ") : "")],
    ["Product Type", product?.productType],
    ["Collection", product?.collection],
    ["Country of Manufacture", product?.countryOfManufacture],
  ];

  // Physical specs (with fallbacks to custom attributes)
  const physicalRows = [
    ["Dimensions", product?.dimensions],
    ["Weight", product?.weight || customRows.find(([k]) => k.toLowerCase() === "weight")?.[1]],
    ["Material", product?.attributes?.material || customRows.find(([k]) => k.toLowerCase() === "material")?.[1]],
    ["Color Options", product?.colorOptions?.length ? product.colorOptions : (variantColors.length ? variantColors : null)],
    ["Size Options", product?.sizeOptions?.length ? product.sizeOptions : (variantSizes.length ? variantSizes : null)],
  ];

  // Safety & certifications
  const safety = product?.safety || {};
  const safetyRows = [
    ["CE Level 1", safety.CELevel1],
    ["CE Level 2", safety.CELevel2],
    ["ECE", safety.ECE],
    ["DOT", safety.DOT],
    ["BIS", safety.BIS],
    ["Reflective Panels", product?.attributes?.reflectivePanels],
    ["CE Armour", product?.attributes?.ceArmour],
    ["Waterproof", product?.attributes?.waterproof],
    ...Object.entries(safety)
      .filter(([k]) => !["CELevel1", "CELevel2", "ECE", "DOT", "BIS"].includes(k))
      .map(([k, v]) => [labelize(k), v]),
  ];

  // Policies (with warranty fallback to custom attributes like 'warrenty' or 'warranty')
  const shipping = product?.shipping || {};
  const warrantyVal = product?.warranty || customRows.find(([k]) => k.toLowerCase().includes("warr"))?.[1];
  const policyRows = [
    ["Return Policy", product?.returnPolicy || shipping.returnPolicy],
    ["Replacement Policy", product?.replacementPolicy],
    ["Warranty", warrantyVal],
    ["Dispatch Time", shipping.dispatchTime],
    ["Care Instructions", product?.careInstructions],
  ];

  // Compatibility
  const compat = product?.compatibilityDetail || {};
  const compatRows = [
    ["Bike Brand", compat.bikeBrand],
    ["Universal Product", compat.universalProduct],
    ["Compatible Bikes", product?.seo?.compatibleBikes],
    ...Object.entries(compat)
      .filter(([k]) => !["bikeBrand", "universalProduct"].includes(k))
      .map(([k, v]) => [labelize(k), v]),
  ];

  // Extra specs from Firestore fields
  const specs = product?.specifications || product?.additionalInfo || {};
  const specsRows = Object.entries(specs).map(([k, v]) => [labelize(k), v]);

  // Box contents
  const boxContents = product?.boxContents || [];

  return (
    <div className="additional-info">
      <h3 className="additional-info__title">Product Details</h3>

      <InfoSection title="Identity" rows={identityRows} />
      <InfoSection title="Physical Specs" rows={physicalRows} />

      {/* Vendor Custom Attributes & Specifications */}
      {customRows.length > 0 && (
        <InfoSection title="Custom Attributes & Specifications" rows={customRows} />
      )}

      {specsRows.length > 0 && <InfoSection title="Specifications" rows={specsRows} />}

      <InfoSection title="Safety & Certifications" rows={safetyRows} />
      <InfoSection title="Compatibility" rows={compatRows} />
      <InfoSection title="Policies & Shipping" rows={policyRows} />

      {boxContents.length > 0 && (
        <div className="additional-info__section">
          <h4 className="additional-info__section-title">Box Contents</h4>
          <ul className="additional-info__list">
            {boxContents.map((item, i) => (
              <li key={i} className="additional-info__list-item">{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
