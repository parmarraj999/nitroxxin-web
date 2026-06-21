export const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDate = (value, fallback = "") => {
  const date = toDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

export const formatDateTime = (value, fallback = "") => {
  const date = toDate(value);
  if (!date) return fallback;
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export const formatPrice = (value, fallback = "") => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback || String(value || "");
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(number);
};

export const firstImage = (item) => {
  if (!item) return "";
  if (item.media?.primaryImage) return item.media.primaryImage;
  if (Array.isArray(item.media?.galleryImages) && item.media.galleryImages.length) return item.media.galleryImages[0];
  if (Array.isArray(item.images) && item.images.length) return item.images[0];
  if (Array.isArray(item.gallery) && item.gallery.length) return item.gallery[0];
  return item.image || item.imageUrl || item.banner || item.bannerUrl || item.photoURL || "";
};

export const slug = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
