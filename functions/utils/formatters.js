/**
 * Data Formatters & Extractor Utilities for Nitroxx Tickets
 */

/**
 * Format any date input (Timestamp, Date, string, number) into clean human-readable date and time.
 */
function formatEventDateTime(dateVal, fallbackText) {
  if (fallbackText && typeof fallbackText === 'string' && !fallbackText.includes('T00:00')) {
    return fallbackText;
  }
  if (!dateVal) return 'Date to be announced';

  let d;
  if (typeof dateVal?.toDate === 'function') {
    d = dateVal.toDate();
  } else if (dateVal instanceof Date) {
    d = dateVal;
  } else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
    d = new Date(dateVal);
  } else {
    return 'Date to be announced';
  }

  if (isNaN(d.getTime())) return fallbackText || 'Date to be announced';

  try {
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return d.toDateString();
  }
}

/**
 * Format amount as Indian Rupees or Free
 */
function formatCurrency(amount, currency = 'INR') {
  const val = Number(amount || 0);
  if (val <= 0) return 'FREE';
  const prefix = currency === 'INR' ? '₹' : `${currency} `;
  return `${prefix}${val.toLocaleString('en-IN')}`;
}

/**
 * Safely extract attendee full name
 */
function getAttendeeName(booking) {
  if (!booking) return 'Valued Racer';
  const name =
    booking.bookingContact?.name ||
    booking.bookingContact?.fullName ||
    booking.attendee?.name ||
    booking.name ||
    booking.customerName ||
    booking.participantName ||
    'Valued Racer';
  return String(name).trim();
}

/**
 * Safely extract attendee email
 */
function getAttendeeEmail(booking) {
  if (!booking) return null;
  const email =
    booking.bookingContact?.email ||
    booking.attendee?.email ||
    booking.email ||
    booking.participantEmail;
  return email && typeof email === 'string' && email.includes('@')
    ? email.trim().toLowerCase()
    : null;
}

/**
 * Generate or retrieve ticket code
 */
function getTicketCode(booking, bookingId) {
  if (booking?.ticketCode && String(booking.ticketCode).trim()) {
    return String(booking.ticketCode).trim().toUpperCase();
  }
  if (booking?.ticketNumber && String(booking.ticketNumber).trim()) {
    return String(booking.ticketNumber).trim().toUpperCase();
  }
  const cleanId = String(bookingId || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  return `NTX-${cleanId || Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * Extract ticket tier / pass title
 */
function getTicketTier(booking) {
  if (!booking) return 'Confirmed Entry Pass';
  const tier =
    booking.tierName ||
    booking.packageName ||
    booking.ticketType ||
    booking.ticketPlan?.tiers?.[0]?.name ||
    booking.joinAs ||
    'Confirmed Entry Pass';
  return String(tier).trim();
}

/**
 * Extract organizer name
 */
function getOrganizerName(event) {
  if (!event) return 'Nitroxx Motorsports Official';
  const org =
    event.organizer ||
    event.hostName ||
    event.creatorName ||
    event.businessName ||
    'Nitroxx Motorsports Official';
  return String(org).trim();
}

module.exports = {
  formatEventDateTime,
  formatCurrency,
  getAttendeeName,
  getAttendeeEmail,
  getTicketCode,
  getTicketTier,
  getOrganizerName,
};
