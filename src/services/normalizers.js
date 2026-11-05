import { firstImage, formatDate, formatDateTime, formatPrice } from "../utils/dataFormatters";
import { extractVendorIdFromData, extractVendorNameFromData } from "./vendorResolver";

export const normalizeProduct = (doc) => {
  const data = doc.data ? doc.data() : doc;
  const id = data.productId || doc.id || data.id;

  const mrp = Number(data.price ?? data.pricing?.mrp ?? data.mrp ?? data.regularPrice ?? 0);
  const selling = Number(data.pricing?.sellingPrice ?? data.salePrice ?? data.discountPrice ?? 0);
  const rawOffer = Number(data.offerPrice ?? data.pricing?.offerPrice ?? 0);

  const offerPrice = rawOffer > 0 ? rawOffer : (selling > 0 ? selling : (mrp > 0 ? mrp : 0));
  const price = mrp > 0 ? mrp : offerPrice;

  const category = data.categoryName || data.category || data.categoryId || "";
  const subcategory = data.subcategory || data.subCategory || data.subCategoryName || data.subcategoryId || "";
  const brand = data.brandName || data.brand || data.brandId || "";
  const vendorId = extractVendorIdFromData(data);
  const vendorName = extractVendorNameFromData(data, brand || "Authorized Vendor");
  const manufacturer = data.manufacturer || data.maker || "";

  const keywords = [
    ...(Array.isArray(data.seo?.keywords) ? data.seo.keywords : []),
    ...(Array.isArray(data.keywords) ? data.keywords : []),
  ];
  const tags = [
    ...(Array.isArray(data.seo?.tags) ? data.seo.tags : []),
    ...(Array.isArray(data.tags) ? data.tags : []),
  ];

  // Normalize customAttributes (e.g. [{ key: "weight", value: "1450g" }, { key: "warrenty", value: "5 year" }])
  const rawCustomAttributes = data.customAttributes || data.attributes?.custom || [];
  let customAttributes = [];
  if (Array.isArray(rawCustomAttributes)) {
    customAttributes = rawCustomAttributes
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const key = String(item.key || item.name || item.label || item.attribute || "").trim();
        const value = item.value !== undefined ? item.value : (item.val !== undefined ? item.val : "");
        return key ? { key, value } : null;
      })
      .filter(Boolean);
  } else if (rawCustomAttributes && typeof rawCustomAttributes === "object") {
    customAttributes = Object.entries(rawCustomAttributes)
      .map(([k, v]) => ({ key: String(k).trim(), value: v }))
      .filter((item) => item.key && item.value !== "" && item.value !== null && item.value !== undefined);
  }

  // Normalize variants (array of { id, options: { color, size, ... }, price, sku, stock })
  const rawVariants = Array.isArray(data.variants)
    ? data.variants
    : Array.isArray(data.variantList)
    ? data.variantList
    : [];

  const variants = rawVariants.map((v, idx) => ({
    id: v.id || v.variantId || `var_${idx}_${Date.now()}`,
    options: (v.options && typeof v.options === "object") ? v.options : {},
    price: v.price !== undefined && v.price !== null && v.price !== "" ? Number(v.price) : undefined,
    offerPrice: v.offerPrice !== undefined && v.offerPrice !== null && v.offerPrice !== "" ? Number(v.offerPrice) : undefined,
    sku: v.sku || "",
    stock: v.stock !== undefined && v.stock !== null && v.stock !== "" ? Number(v.stock) : (v.quantity !== undefined ? Number(v.quantity) : undefined),
    image: v.image || v.imageUrl || "",
  }));

  // Auto-fill warranty and weight if missing from top-level but present in customAttributes
  let warranty = data.warranty || data.attributes?.warranty || "";
  if (!warranty && customAttributes.length) {
    const w = customAttributes.find((a) => a.key.toLowerCase().includes("warr"));
    if (w) warranty = String(w.value);
  }

  let weight = data.weight || data.attributes?.weight || "";
  if (!weight && customAttributes.length) {
    const wt = customAttributes.find((a) => a.key.toLowerCase() === "weight");
    if (wt) weight = String(wt.value);
  }

  // If top-level price is 0 or missing, but variants exist with prices, use min variant price
  let finalPrice = price;
  let finalOfferPrice = offerPrice;
  if (finalPrice <= 0 && variants.length) {
    const varPrices = variants.map((v) => v.price).filter((p) => p !== undefined && !isNaN(p) && p > 0);
    if (varPrices.length) {
      finalPrice = Math.min(...varPrices);
      finalOfferPrice = finalPrice;
    }
  }

  return {
    ...data,
    id,
    name: data.title || data.name || "Product",
    title: data.title || data.name || "Product",
    category,
    categoryName: category,
    subcategory,
    subCategory: subcategory,
    brand,
    brandName: brand,
    vendorId,
    vendorName,
    manufacturer,
    keywords,
    tags,
    customAttributes,
    variants,
    warranty,
    weight,
    image: firstImage(data),
    images: data.media?.galleryImages || data.images || data.gallery || [firstImage(data)].filter(Boolean),
    price: finalPrice,
    offerPrice: finalOfferPrice,
    priceText: formatPrice(finalPrice, data.priceText),
    offerPriceText: formatPrice(finalOfferPrice, data.offerPriceText),
    stock: Number(data.inventory?.stockQuantity ?? data.stock ?? data.quantity ?? 0),
    status: String(data.status || "published").toLowerCase(),
    averageRating: Number(data.averageRating ?? data.rating ?? 0),
    reviewCount: Number(data.reviewCount ?? data.reviewsCount ?? data.numReviews ?? 0),
  };
};

export const normalizeEvent = (doc) => {
  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id;

  const source = data.ticketPackages || data.packages || data.ticketTiers || data.tickets || data.pricing?.packages || [];
  const packages = Array.isArray(source) ? source : Object.entries(source || {}).map(([key, val]) => ({ id: key, ...val }));

  let price = data.price ?? data.ticketPrice ?? data.startingPrice;
  let ticketPrice = data.ticketPrice;
  let hasPackages = false;

  if (packages.length > 0) {
    const packagePrices = packages
      .map(p => Number(p.price ?? p.amount))
      .filter(p => !isNaN(p) && isFinite(p));
    if (packagePrices.length > 0) {
      price = Math.min(...packagePrices);
      ticketPrice = null; // force fallback to priceText on detail page
      hasPackages = true;
    }
  }

  const formattedPrice = formatPrice(price, data.priceText);
  let priceText = formattedPrice;
  if (price !== undefined && price !== null) {
    if (price === 0) {
      priceText = "Free";
    } else if (hasPackages) {
      priceText = `Starts from ${formattedPrice}`;
    }
  }

  const rawBikeReq = data.bikeRequirements || data.bikeRequirement || null;
  const hasDirectBikeProps = Boolean(
    data.bikeType ||
    data.bikeModel ||
    data.bikeBrand ||
    data.brand ||
    data.model ||
    data.minimumCC ||
    data.engineCC ||
    data.bikeEngineCC ||
    data.bikeCriteria ||
    data.specificBikeRequired
  );

  const resolvedBikeReq = (rawBikeReq && typeof rawBikeReq === 'object')
    ? {
        ...rawBikeReq,
        bikeType: rawBikeReq.bikeType || data.bikeType || "",
        brand: rawBikeReq.brand || rawBikeReq.bikeBrand || data.bikeBrand || data.brand || "",
        model: rawBikeReq.model || rawBikeReq.bikeModel || data.bikeModel || data.model || "",
        engineCC: rawBikeReq.engineCC || rawBikeReq.bikeEngineCC || rawBikeReq.engineCc || data.bikeEngineCC || data.engineCC || data.minimumCC || "",
        criteria: rawBikeReq.criteria || rawBikeReq.bikeCriteria || data.bikeCriteria || "",
      }
    : (hasDirectBikeProps
      ? {
          bikeType: data.bikeType || "",
          brand: data.bikeBrand || data.brand || "",
          model: data.bikeModel || data.model || "",
          engineCC: data.bikeEngineCC || data.engineCC || data.minimumCC || "",
          criteria: data.bikeCriteria || "",
        }
      : null);

  const hasBikeDetails = resolvedBikeReq && Object.values(resolvedBikeReq).some(v => v !== null && v !== undefined && String(v).trim() !== "");
  const isExplicitlyDisabled = data.specificBikeRequired === false && !rawBikeReq?.specificBikeRequired;
  const bikeRequirements = (!isExplicitlyDisabled && hasBikeDetails) ? resolvedBikeReq : null;

  const ticketTemplateUrl =
    data.ticketTemplateUrl ||
    data.templateUrl ||
    data.ticketTemplate?.url ||
    data.ticketTemplate?.imageUrl ||
    data.ticketTemplate?.image ||
    "";

  return {
    ...data,
    id,
    name: data.name || data.title || "Event",
    title: data.title || data.name || "Event",
    image: data.bannerImage || firstImage(data),
    images: data.galleryImages || data.images || data.gallery || [data.bannerImage || firstImage(data)].filter(Boolean),
    banner: data.bannerImage || data.banner || data.bannerUrl || firstImage(data),
    date: data.date || data.eventDate || data.startsAt || data.startDate,
    dateText: data.dateText || formatDate(data.date || data.eventDate || data.startsAt || data.startDate),
    dateTimeText: data.dateTimeText || formatDateTime(data.date || data.eventDate || data.startsAt || data.startDate),
    location: data.locationName || data.location || data.address || "",
    price,
    ticketPrice,
    priceText,
    category: data.categoryName || data.category || data.categoryId || "",
    hostId: data.hostId || data.organizerId || "",
    status: String(data.status || "Published"),
    ticketTemplateUrl,
    bikeRequirements,
  };
};

export const normalizeCategory = (doc) => {
  const data = doc.data ? doc.data() : doc;
  return {
    ...data,
    id: doc.id || data.id,
    label: data.label || data.name || data.title || "Category",
    title: data.title || data.name || data.label || "Category",
    image: firstImage(data),
  };
};

export const isFeatureForYou = (item) => {
  if (!item) return false;
  return (
    item.featureForYou === true ||
    item.featuredForYou === true ||
    item.isFeaturedForYou === true ||
    item.feature_for_you === true ||
    item.featured_for_you === true ||
    String(item.featureForYou || "").toLowerCase() === "true" ||
    String(item.featuredForYou || "").toLowerCase() === "true"
  );
};

export const normalizeBrand = (doc) => {
  const data = doc.data ? doc.data() : doc;
  const featured = isFeatureForYou(data);
  return {
    ...data,
    id: doc.id || data.id,
    label: data.label || data.name || data.title || "Brand",
    alt: data.alt || data.name || data.title || "Brand",
    image: data.logo || data.logoUrl || firstImage(data),
    featureForYou: featured,
    featuredForYou: featured,
  };
};

export const normalizeSubcategory = (doc) => {
  const data = doc.data ? doc.data() : doc;
  return {
    ...data,
    id: doc.id || data.id,
    label: data.label || data.name || data.title || "Sub-category",
    image: data.image || data.imageUrl || data.thumbnail || null,
    parentId: data.parentId || data.categoryId || data.parent || null,
    description: data.description || "",
    productCount: data.productCount || data.count || null,
  };
};
