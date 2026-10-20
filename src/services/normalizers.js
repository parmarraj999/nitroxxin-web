import { firstImage, formatDate, formatDateTime, formatPrice } from "../utils/dataFormatters";

export const normalizeProduct = (doc) => {
  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id;

  const mrp = Number(data.price ?? data.pricing?.mrp ?? data.mrp ?? data.regularPrice ?? 0);
  const selling = Number(data.pricing?.sellingPrice ?? data.salePrice ?? data.discountPrice ?? 0);
  const rawOffer = Number(data.offerPrice ?? data.pricing?.offerPrice ?? 0);

  const offerPrice = rawOffer > 0 ? rawOffer : (selling > 0 ? selling : (mrp > 0 ? mrp : 0));
  const price = mrp > 0 ? mrp : offerPrice;

  const category = data.categoryName || data.category || data.categoryId || "";
  const subcategory = data.subcategory || data.subCategory || data.subCategoryName || data.subcategoryId || "";
  const brand = data.brandName || data.brand || data.brandId || "";
  const vendorName = data.vendorName || data.vendor?.name || data.shopName || data.businessName || "";
  const manufacturer = data.manufacturer || data.maker || "";

  const keywords = [
    ...(Array.isArray(data.seo?.keywords) ? data.seo.keywords : []),
    ...(Array.isArray(data.keywords) ? data.keywords : []),
  ];
  const tags = [
    ...(Array.isArray(data.seo?.tags) ? data.seo.tags : []),
    ...(Array.isArray(data.tags) ? data.tags : []),
  ];

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
    vendorId: data.vendorId || data.vendor?.id || "",
    vendorName,
    manufacturer,
    keywords,
    tags,
    image: firstImage(data),
    images: data.media?.galleryImages || data.images || data.gallery || [firstImage(data)].filter(Boolean),
    price,
    offerPrice,
    priceText: formatPrice(price, data.priceText),
    offerPriceText: formatPrice(offerPrice, data.offerPriceText),
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
  const hasDirectBikeProps = Boolean(data.bikeType || data.bikeModel || data.bikeBrand || data.minimumCC || data.engineCC);
  const resolvedBikeReq = (rawBikeReq && typeof rawBikeReq === 'object')
    ? {
        ...rawBikeReq,
        bikeType: rawBikeReq.bikeType || data.bikeType || "",
        brand: rawBikeReq.brand || data.bikeBrand || data.brand || "",
        model: rawBikeReq.model || data.bikeModel || data.model || "",
        engineCC: rawBikeReq.engineCC || rawBikeReq.engineCc || data.engineCC || data.minimumCC || "",
        criteria: rawBikeReq.criteria || rawBikeReq.bikeCriteria || data.bikeCriteria || "",
      }
    : (hasDirectBikeProps
      ? {
          bikeType: data.bikeType || "",
          brand: data.bikeBrand || data.brand || "",
          model: data.bikeModel || data.model || "",
          engineCC: data.engineCC || data.minimumCC || "",
          criteria: data.bikeCriteria || "",
        }
      : null);

  const hasBikeDetails = resolvedBikeReq && Object.values(resolvedBikeReq).some(v => v !== null && v !== undefined && String(v).trim() !== "");
  const bikeRequirements = hasBikeDetails ? resolvedBikeReq : null;

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
