import { firstImage, formatDate, formatDateTime, formatPrice } from "../utils/dataFormatters";

export const normalizeProduct = (doc) => {
  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id;
  const price = data.price ?? data.pricing?.mrp ?? data.mrp ?? data.regularPrice;
  const offerPrice = data.offerPrice ?? data.pricing?.sellingPrice ?? data.salePrice ?? data.discountPrice ?? price;

  return {
    ...data,
    id,
    name: data.title || data.name || "Product",
    title: data.title || data.name || "Product",
    category: data.categoryName || data.category || data.categoryId || "",
    brand: data.brandName || data.brand || data.brandId || "",
    vendorId: data.vendorId || data.vendor?.id || "",
    vendorName: data.vendorName || data.vendor?.name || data.shopName || "",
    image: firstImage(data),
    images: data.media?.galleryImages || data.images || data.gallery || [firstImage(data)].filter(Boolean),
    price,
    offerPrice,
    priceText: formatPrice(price, data.priceText),
    offerPriceText: formatPrice(offerPrice, data.offerPriceText),
    stock: Number(data.inventory?.stockQuantity ?? data.stock ?? data.quantity ?? 0),
    status: data.status || "active",
  };
};

export const normalizeEvent = (doc) => {
  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id;
  const price = data.price ?? data.ticketPrice ?? data.startingPrice;

  return {
    ...data,
    id,
    name: data.name || data.title || "Event",
    title: data.title || data.name || "Event",
    image: firstImage(data),
    images: data.images || data.gallery || [firstImage(data)].filter(Boolean),
    banner: data.banner || data.bannerUrl || firstImage(data),
    date: data.date || data.eventDate || data.startsAt || data.startDate,
    dateText: data.dateText || formatDate(data.date || data.eventDate || data.startsAt || data.startDate),
    dateTimeText: data.dateTimeText || formatDateTime(data.date || data.eventDate || data.startsAt || data.startDate),
    location: data.locationName || data.location || data.address || "",
    price,
    priceText: formatPrice(price, data.priceText),
    category: data.categoryName || data.category || data.categoryId || "",
    status: data.status || "upcoming",
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

export const normalizeBrand = (doc) => {
  const data = doc.data ? doc.data() : doc;
  return {
    ...data,
    id: doc.id || data.id,
    label: data.label || data.name || data.title || "Brand",
    alt: data.alt || data.name || data.title || "Brand",
    image: data.logo || data.logoUrl || firstImage(data),
  };
};
