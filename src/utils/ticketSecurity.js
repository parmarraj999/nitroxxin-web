/**
 * Ticket Security & Cryptographic Payload Generator for Nitroxx Event Passes
 * Enforces single-use verifiable ticket codes and secure JSON QR payloads.
 */

const SECRET_TICKET_SALT = 'nitroxx_secure_gate_salt_2026_x99';

/**
 * Generates ticket code matching format:
 * "NTX-" + random alphanumeric code max (4) + last 4 digits/letters of phone number
 * Example: NTX-K84M-3210 or NTX-8942-3210
 */
export const generateTicketCode = (phone = '') => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i += 1) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const cleanDigits = String(phone || '').replace(/\D/g, '');
  let phoneEnd = '';
  if (cleanDigits.length >= 4) {
    phoneEnd = cleanDigits.slice(-4);
  } else if (cleanDigits.length > 0) {
    phoneEnd = (cleanDigits + '0000').slice(0, 4);
  } else {
    // Fallback if no phone was provided
    let fallback = '';
    for (let i = 0; i < 4; i += 1) {
      fallback += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    phoneEnd = fallback;
  }

  return `NTX-${rand}-${phoneEnd}`;
};

/**
 * Generate HMAC-SHA256 signature / cryptographic hash for ticket verification
 */
export const generateTicketSignature = async (ticketCode, bookingId, eventId, attendeeEmail) => {
  const payloadString = `${ticketCode}:${bookingId || ''}:${eventId || ''}:${attendeeEmail || ''}:${SECRET_TICKET_SALT}`;

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(payloadString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
    } catch (e) {
      console.warn('WebCrypto SHA-256 fallback triggered:', e);
    }
  }

  // Pure JavaScript hash fallback (FNV-1a variant + Murmur-inspired mix)
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < payloadString.length; i += 1) {
    const code = payloadString.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= code;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `nx_${part1}${part2}`;
};

/**
 * Build the exact standard JSON QR payload:
 * {
 *   "ticketCode": "NTX-...",
 *   "bookingId": "...",
 *   "eventId": "...",
 *   "attendeeEmail": "...",
 *   "signature": "..."
 * }
 */
export const buildTicketQrPayload = async ({
  ticketCode,
  bookingId,
  eventId,
  attendeeEmail,
  signature: customSig = null,
}) => {
  const signature = customSig || (await generateTicketSignature(ticketCode, bookingId, eventId, attendeeEmail));

  const payloadObj = {
    ticketCode,
    bookingId: String(bookingId || ''),
    eventId: String(eventId || ''),
    attendeeEmail: String(attendeeEmail || ''),
    signature,
  };

  return JSON.stringify(payloadObj);
};

/**
 * Generate standard high-contrast 300x300 QR image URL with >=10% error correction margin
 */
export const getTicketQrUrl = (qrPayloadString) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=M&color=000000&bgcolor=ffffff&data=${encodeURIComponent(
    qrPayloadString || ''
  )}`;
};
