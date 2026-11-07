const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const toFlexibleDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value.toDate === 'function') {
    try {
      const d = value.toDate();
      if (d instanceof Date && !Number.isNaN(d.getTime())) return d;
    } catch {}
  }
  if (typeof value === 'object' && (value.seconds || value._seconds)) {
    const sec = value.seconds || value._seconds;
    const d = new Date(sec * 1000);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (typeof value === 'number') {
    const d = new Date(value > 1e11 ? value : value * 1000);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // YYYY-MM-DD or YYYY/MM/DD
    const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymdMatch) {
      const year = parseInt(ymdMatch[1], 10);
      const month = parseInt(ymdMatch[2], 10) - 1;
      const day = parseInt(ymdMatch[3], 10);
      const d = new Date(year, month, day);
      if (!Number.isNaN(d.getTime())) return d;
    }

    // DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const d = new Date(year, month, day);
      if (!Number.isNaN(d.getTime())) return d;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

export const formatDisplayDate = (value, fallback = "") => {
  if (!value) return fallback;
  const date = toFlexibleDate(value);
  if (!date) {
    if (typeof value === 'string' && value.trim()) return value;
    return fallback;
  }
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month}, ${year}`;
};

export const formatDisplayTime = (rawTime, fallbackDate = null) => {
  if (rawTime && typeof rawTime === 'string') {
    const trimmed = rawTime.trim();
    if (!trimmed) return '';

    // "5:30 am", "05:30 PM", "9 AM"
    const ampmMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm)$/i);
    if (ampmMatch) {
      const h = parseInt(ampmMatch[1], 10);
      const m = ampmMatch[2] || '00';
      const meridiem = ampmMatch[3].toUpperCase();
      return `${h}:${m} ${meridiem}`;
    }

    // 24-hr format: "17:30", "05:30", "05:30:00", "9:00"
    const militaryMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (militaryMatch) {
      let h = parseInt(militaryMatch[1], 10);
      const m = militaryMatch[2];
      const meridiem = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${m} ${meridiem}`;
    }

    // Range: "06:00 - 18:00" or "6:00 AM - 9:00 PM"
    if (trimmed.includes('-') || trimmed.toLowerCase().includes(' to ')) {
      const parts = trimmed.split(/\s*[-–—]\s*|\s+to\s+/i);
      if (parts.length === 2) {
        const start = formatDisplayTime(parts[0]);
        const end = formatDisplayTime(parts[1]);
        if (start && end) return `${start} - ${end}`;
        if (start) return start;
      }
    }

    // Full string containing time e.g. "Sat, 05 Dec, 8:00 AM"
    const extractedTime = trimmed.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM|am|pm))/i);
    if (extractedTime && extractedTime[1] !== trimmed) {
      return formatDisplayTime(extractedTime[1]);
    }

    // Single number like "9"
    const singleNum = trimmed.match(/^(\d{1,2})$/);
    if (singleNum) {
      let h = parseInt(singleNum[1], 10);
      const meridiem = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:00 ${meridiem}`;
    }

    return trimmed;
  }

  if (fallbackDate) {
    const d = toFlexibleDate(fallbackDate);
    if (d) {
      const hours = d.getHours();
      const minutes = d.getMinutes();
      if (hours !== 0 || minutes !== 0) {
        const meridiem = hours >= 12 ? 'PM' : 'AM';
        const h = hours % 12 || 12;
        const m = String(minutes).padStart(2, '0');
        return `${h}:${m} ${meridiem}`;
      }
    }
  }

  return '';
};

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
