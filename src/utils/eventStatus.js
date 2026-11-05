import { toDate } from "./dataFormatters";

/**
 * Parses any date representation (Firestore Timestamp, ISO string, Date object, YYYY-MM-DD)
 * @param {any} val - The input date value
 * @param {boolean} endOfDay - If true and value is a date-only string (length <= 10), set time to 23:59:59.999
 * @returns {Date | null}
 */
export const parseEventDate = (val, endOfDay = false) => {
  if (!val) return null;
  const d = toDate(val);
  if (!d) return null;

  const result = new Date(d.getTime());
  if (endOfDay && typeof val === "string" && val.trim().length <= 10) {
    result.setHours(23, 59, 59, 999);
  }
  return result;
};

/**
 * Determines the comprehensive registration and lifecycle status of an event.
 *
 * @param {Object} event - The normalized or raw event object
 * @returns {Object} Status resolution details
 */
export const getEventStatusInfo = (event) => {
  if (!event) {
    return {
      isCompleted: false,
      isCancelled: false,
      isSoldOut: false,
      isRegistrationClosed: false,
      isRegistrationUpcoming: false,
      canBook: false,
      statusKey: "unavailable",
      badgeText: "Unavailable",
      badgeClass: "ed-status--unavailable",
      message: "Event details are unavailable.",
    };
  }

  const now = new Date();
  const rawStatus = String(event.status || "").toLowerCase().trim();

  // 1. Check Explicit Cancellation
  if (rawStatus === "cancelled" || rawStatus === "canceled" || event.isCancelled === true) {
    return {
      isCompleted: false,
      isCancelled: true,
      isSoldOut: false,
      isRegistrationClosed: true,
      isRegistrationUpcoming: false,
      canBook: false,
      statusKey: "cancelled",
      badgeText: "Cancelled",
      badgeClass: "ed-status--cancelled",
      message: "This event has been cancelled by the organizer.",
    };
  }

  // 2. Check Event Completion
  // A: Explicit status flag in Firestore (e.g. "Completed", "Complete", "Ended")
  const isExplicitComplete =
    rawStatus === "complete" ||
    rawStatus === "completed" ||
    rawStatus === "ended" ||
    event.isCompleted === true;

  // B: Date passed (endDate takes precedence, then startDate / date)
  const rawEnd = event.endDate || event.endsAt;
  const rawStart = event.startDate || event.date || event.eventDate || event.startsAt;
  const endDateObj = parseEventDate(rawEnd, true) || parseEventDate(rawStart, true);

  const isDatePassed = endDateObj ? now.getTime() > endDateObj.getTime() : false;

  if (isExplicitComplete || isDatePassed) {
    return {
      isCompleted: true,
      isCancelled: false,
      isSoldOut: false,
      isRegistrationClosed: true,
      isRegistrationUpcoming: false,
      canBook: false,
      statusKey: "completed",
      badgeText: "Completed",
      badgeClass: "ed-status--completed",
      message: "This event is completed.",
    };
  }

  // 3. Check Capacity / Sold Out
  const capacity = Number(event.capacity || event.totalTickets || event.maxCapacity || 0);
  const registered = Number(
    event.registeredCount ||
    event.bookedCount ||
    event.soldCount ||
    event.totalBookings ||
    0
  );
  const isExplicitSoldOut =
    event.isSoldOut === true ||
    rawStatus === "sold_out" ||
    rawStatus === "soldout";
  const isCapacityFull = capacity > 0 && registered >= capacity;

  if (isExplicitSoldOut || isCapacityFull) {
    return {
      isCompleted: false,
      isCancelled: false,
      isSoldOut: true,
      isRegistrationClosed: true,
      isRegistrationUpcoming: false,
      canBook: false,
      statusKey: "sold_out",
      badgeText: "Sold Out",
      badgeClass: "ed-status--soldout",
      message: "All tickets for this event are sold out.",
    };
  }

  // 4. Check Registration Window (Start / End)
  const rawRegStart = event.registrationStart || event.registrationStartDate || event.registrationOpens;
  const rawRegEnd = event.registrationEnd || event.registrationEndDate || event.registrationCloses || event.registrationDeadline;

  const regStartObj = parseEventDate(rawRegStart, false);
  const regEndObj = parseEventDate(rawRegEnd, true);

  // A: Registration not yet open
  if (regStartObj && now.getTime() < regStartObj.getTime()) {
    const startText = event.registrationStartText || rawRegStart;
    return {
      isCompleted: false,
      isCancelled: false,
      isSoldOut: false,
      isRegistrationClosed: false,
      isRegistrationUpcoming: true,
      canBook: false,
      statusKey: "registration_upcoming",
      badgeText: "Registration Opens Soon",
      badgeClass: "ed-status--upcoming",
      message: `Registration opens on ${startText}.`,
    };
  }

  // B: Registration closed
  const isExplicitRegClosed =
    event.registrationOpen === false ||
    event.isRegistrationOpen === false ||
    event.registrationClosed === true ||
    String(event.registrationStatus || "").toLowerCase().trim() === "closed" ||
    String(event.registrationStatus || "").toLowerCase().trim() === "ended";

  const isRegDeadlinePassed = regEndObj ? now.getTime() > regEndObj.getTime() : false;

  if (isExplicitRegClosed || isRegDeadlinePassed) {
    return {
      isCompleted: false,
      isCancelled: false,
      isSoldOut: false,
      isRegistrationClosed: true,
      isRegistrationUpcoming: false,
      canBook: false,
      statusKey: "registration_closed",
      badgeText: "Registration Closed",
      badgeClass: "ed-status--closed",
      message: "Registration for this event has closed.",
    };
  }

  // 5. Open for Booking
  return {
    isCompleted: false,
    isCancelled: false,
    isSoldOut: false,
    isRegistrationClosed: false,
    isRegistrationUpcoming: false,
    canBook: true,
    statusKey: "open",
    badgeText: "Book Ticket",
    badgeClass: "ed-status--open",
    message: "Registration is open.",
  };
};

