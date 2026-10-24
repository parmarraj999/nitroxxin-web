const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');
const { db, FieldValue } = require('./config/firebase');
const { RESEND_API_KEY, SENDER_EMAIL } = require('./config/secrets');
const {
  formatEventDateTime,
  getAttendeeName,
  getAttendeeEmail,
  getTicketCode,
  getTicketTier,
  getOrganizerName,
} = require('./utils/formatters');


/**
 * ============================================================================
 * 1. AUTOMATED FIRESTORE TRIGGER: onBookingCreatedOrPaid
 * ============================================================================
 * Triggered automatically when a booking is created or updated in Firestore.
 * Handles:
 *  - Initial booking creation after instant Razorpay capture
 *  - Status update from 'pending' to 'paid' / 'confirmed'
 *  - Strict idempotency (never sends duplicate emails)
 *  - End-to-end QR generation, PDF creation, Storage upload, and Resend email
 */
exports.onBookingCreatedOrPaid = onDocumentWritten(
  {
    document: 'bookings/{bookingId}',
    secrets: [RESEND_API_KEY, SENDER_EMAIL],
    memory: '512MiB',
    timeoutSeconds: 120,
    maxInstances: 10, // Adheres to regional Cloud Run CPU quota (max 20)
    region: 'us-central1',
  },
  async (event) => {
    const bookingId = event.params.bookingId;

    // 1. Check if document was deleted
    if (!event.data?.after?.exists) {
      logger.info(`Booking document ${bookingId} was deleted. Skipping ticket generation.`);
      return;
    }

    const bookingRef = event.data.after.ref;
    const booking = event.data.after.data();
    const beforeData = event.data.before?.exists ? event.data.before.data() : null;

    logger.info(`[Booking Trigger] Evaluating booking ${bookingId} for event ${booking?.eventId}`);

    // 2. Loop & Recursion Guard: Ignore triggers caused by internal email status updates
    if (beforeData) {
      const internalPrefixes = ['email', 'ticketPdf', 'ticketCode', 'ticketNumber'];
      const hasExternalChanges = Object.keys({ ...beforeData, ...booking }).some((key) => {
        if (internalPrefixes.some((prefix) => key.startsWith(prefix))) {
          return false;
        }
        return JSON.stringify(beforeData[key]) !== JSON.stringify(booking[key]);
      });

      // If ONLY internal fields (like emailProcessing, emailFailedAt, emailError) changed,
      // this write was made by Cloud Functions itself. Return immediately to prevent infinite trigger loops!
      if (!hasExternalChanges) {
        logger.info(`[Self-Update Guard] Skipping booking ${bookingId} as only internal ticket/email status fields were modified.`);
        return;
      }
    }

    // 3. Circuit Breaker: Do not automatically retry if already failed 3 or more times
    const currentAttempts = Number(booking?.emailAttempts || 0);
    if (currentAttempts >= 3 && !booking?.forceRetryEmail) {
      logger.warn(`[Circuit Breaker] Booking ${bookingId} reached maximum failure attempts (${currentAttempts}). Halting retries.`);
      return;
    }

    // 4. Idempotency Check: Exit if email already sent
    if (booking?.emailSent === true) {
      logger.info(`[Idempotency] Ticket email already sent for booking ${bookingId}. Skipping.`);
      return;
    }

    // 5. Status Check: Must be confirmed, paid, or approved
    const status = String(booking?.status || '').toLowerCase().trim();
    const paymentStatus = String(booking?.paymentStatus || '').toLowerCase().trim();
    const isPaid =
      ['paid', 'confirmed', 'approved', 'completed'].includes(status) ||
      ['paid', 'completed'].includes(paymentStatus) ||
      Number(booking?.amount || booking?.totalAmount || booking?.total || booking?.price || 0) === 0; // Free events

    if (!isPaid) {
      logger.info(
        `[Pending] Booking ${bookingId} has status '${status}' and paymentStatus '${paymentStatus}'. Awaiting successful payment confirmation.`
      );
      return;
    }

    // Avoid redundant processing if beforeData was already confirmed and marked sent
    if (beforeData && beforeData.emailSent === true) {
      return;
    }

    // 6. Atomically Acquire Processing Lock to Prevent Duplicate Execution
    try {
      const lockAcquired = await db.runTransaction(async (transaction) => {
        const freshSnap = await transaction.get(bookingRef);
        const freshData = freshSnap.data();
        if (!freshData) return false;
        if (freshData.emailSent === true || freshData.emailProcessing === true) {
          return false;
        }
        if (Number(freshData.emailAttempts || 0) >= 3 && !freshData.forceRetryEmail) {
          return false;
        }
        transaction.update(bookingRef, {
          emailProcessing: true,
          emailProcessingAt: FieldValue.serverTimestamp(),
          emailAttempts: FieldValue.increment(1),
        });
        return true;
      });

      if (!lockAcquired) {
        logger.info(`[Idempotency Lock] Booking ${bookingId} is already being processed, sent, or reached retry limit. Skipping.`);
        return;
      }
    } catch (lockError) {
      logger.warn(`Failed to acquire atomic lock for booking ${bookingId}, continuing with safety check:`, lockError);
    }

    // 7. Validate Attendee Email
    const attendeeEmail = getAttendeeEmail(booking);
    if (!attendeeEmail) {
      logger.error(`[Validation Error] Booking ${bookingId} does not have a valid email address. Aborting ticket dispatch.`);
      await bookingRef.update({
        emailSent: false,
        emailFailed: true,
        emailError: 'Missing or invalid attendee email address in booking document',
        emailProcessing: false,
        emailFailedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    try {
      // 6. Fetch Event Metadata
      let eventDoc = null;
      if (booking.eventId) {
        try {
          const eventSnap = await db.collection('events').doc(booking.eventId).get();
          if (eventSnap.exists) {
            eventDoc = eventSnap.data();
          }
        } catch (evErr) {
          logger.warn(`Failed to fetch event document ${booking.eventId}:`, evErr);
        }
      }

      // 7. Format Complete Ticket Details
      const attendeeName = getAttendeeName(booking);
      const ticketCode = getTicketCode(booking, bookingId);
      const eventName =
        eventDoc?.title ||
        eventDoc?.name ||
        booking.eventTitle ||
        'Nitroxx Motorsports Event';

      const eventDateTime = formatEventDateTime(
        eventDoc?.startDate || eventDoc?.date || booking.bookingDate || booking.createdAt,
        eventDoc?.dateTimeText || eventDoc?.dateText
      );

      const eventVenue = eventDoc?.venue || eventDoc?.location || booking.city || 'Designated Venue';
      const eventCity = eventDoc?.city || booking.city || 'India';
      const organizerName = getOrganizerName(eventDoc || undefined);
      const ticketTier = getTicketTier(booking);

      const ticketsCount = Number(
        booking.totalTickets ||
        booking.quantity ||
        ((booking.attendeeCounts?.adults || 0) + (booking.attendeeCounts?.children || 0)) ||
        1
      );

      const totalAmount = Number(booking.totalAmount || booking.amount || booking.total || booking.price || 0);

      // Digital Gate Verification Payload (Single-use gate check)
      const qrPayload = booking.qrPayload || JSON.stringify({
        ticketCode,
        bookingId,
        eventId: String(booking.eventId || ''),
        attendeeEmail,
        signature: booking.signature || 'ntx_verified_pass',
        type: 'NITROXX_TICKET',
        v: 1,
      });

      const ticketData = {
        bookingId,
        eventId: booking.eventId,
        ticketCode,
        eventName,
        eventBannerUrl: eventDoc?.banner || eventDoc?.bannerImage || eventDoc?.image || eventDoc?.bannerUrl,
        attendeeName,
        attendeeEmail,
        attendeePhone: booking.attendees?.[0]?.phone || booking.bookingContact?.phone || booking.phone || '',
        eventDateTime,
        eventVenue,
        eventCity,
        organizerName,
        ticketTier,
        ticketsCount,
        bibNumber: booking.bibNumber,
        totalAmount,
        currency: booking.currency || 'INR',
        qrPayload,
        bookedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      };

      // Lazy-load heavy dependencies on execution to prevent deployment discovery timeout
      const { generateTicketQrBuffer } = require('./services/qrService');
      const { generateTicketPdf } = require('./services/pdfService');
      const { uploadTicketPdfToStorage } = require('./services/storageService');
      const { sendTicketEmail } = require('./services/emailService');

      // 8. Step 1: Generate High-Resolution QR Code
      logger.info(`[Step 1/4] Generating Gate QR Code for ${ticketCode}`);
      const qrBuffer = await generateTicketQrBuffer(qrPayload);

      // 9. Step 2: Generate PDF Ticket Pass
      logger.info(`[Step 2/4] Generating PDF Ticket Pass for ${ticketCode}`);
      const pdfBuffer = await generateTicketPdf(ticketData, qrBuffer);

      // 10. Step 3: Upload PDF Ticket to Firebase Storage
      logger.info(`[Step 3/4] Uploading Ticket PDF to Firebase Storage`);
      const { downloadUrl, filePath } = await uploadTicketPdfToStorage(
        pdfBuffer,
        booking.eventId,
        bookingId,
        ticketCode
      );

      // 11. Step 4: Dispatch Confirmation Email via Resend SDK
      logger.info(`[Step 4/4] Sending confirmation email via Resend to ${attendeeEmail}`);
      const emailResult = await sendTicketEmail(ticketData, pdfBuffer, downloadUrl);

      // 12. Update Firestore with Success Status & Download URL
      await bookingRef.update({
        emailSent: true,
        emailFailed: false,
        emailSentAt: FieldValue.serverTimestamp(),
        ticketPdfUrl: downloadUrl,
        ticketPdfStoragePath: filePath,
        ticketCode,
        ticketNumber: ticketCode,
        emailMessageId: emailResult.messageId || null,
        emailError: null,
        emailProcessing: false,
      });

      logger.info(
        `[Complete] Transactional ticket email flow completed successfully for booking ${bookingId}`
      );
    } catch (flowError) {
      logger.error(`[Flow Failure] Error processing booking ${bookingId}:`, flowError);

      // Persist failure details to Firestore for monitoring & retry
      try {
        await bookingRef.update({
          emailSent: false,
          emailFailed: true,
          emailError: flowError?.message || 'Unknown processing error',
          emailProcessing: false,
          emailFailedAt: FieldValue.serverTimestamp(),
        });
      } catch (updateErr) {
        logger.error(`Failed to record error state on booking ${bookingId}:`, updateErr);
      }
    }
  }
);

/**
 * ============================================================================
 * 2. CALLABLE FUNCTION: resendTicketEmail
 * ============================================================================
 * Secure on-demand callable endpoint for hosts or attendees to re-send ticket emails.
 */
exports.resendTicketEmail = onCall(
  {
    secrets: [RESEND_API_KEY, SENDER_EMAIL],
    memory: '512MiB',
    timeoutSeconds: 60,
    region: 'us-central1',
  },
  async (request) => {
    const bookingId = request.data?.bookingId;
    if (!bookingId) {
      throw new HttpsError('invalid-argument', 'The function must be called with a valid "bookingId".');
    }

    const bookingSnap = await db.collection('bookings').doc(bookingId).get();
    if (!bookingSnap.exists) {
      throw new HttpsError('not-found', `Booking with ID "${bookingId}" was not found.`);
    }

    const booking = bookingSnap.data();
    const attendeeEmail = getAttendeeEmail(booking);
    if (!attendeeEmail) {
      throw new HttpsError('failed-precondition', 'Booking has no associated email address.');
    }

    // Fetch Event
    let eventDoc = null;
    if (booking.eventId) {
      const eventSnap = await db.collection('events').doc(booking.eventId).get();
      if (eventSnap.exists) {
        eventDoc = eventSnap.data();
      }
    }

    const attendeeName = getAttendeeName(booking);
    const ticketCode = getTicketCode(booking, bookingId);
    const eventName = eventDoc?.title || eventDoc?.name || booking.eventTitle || 'Nitroxx Motorsports Event';
    const eventDateTime = formatEventDateTime(
      eventDoc?.startDate || eventDoc?.date || booking.bookingDate || booking.createdAt,
      eventDoc?.dateTimeText || eventDoc?.dateText
    );
    const eventVenue = eventDoc?.venue || eventDoc?.location || booking.city || 'Designated Venue';
    const eventCity = eventDoc?.city || booking.city || 'India';
    const organizerName = getOrganizerName(eventDoc || undefined);
    const ticketTier = getTicketTier(booking);
    const ticketsCount = Number(booking.totalTickets || booking.quantity || 1);
    const totalAmount = Number(booking.totalAmount || booking.amount || booking.total || 0);

    const qrPayload = booking.qrPayload || JSON.stringify({
      ticketCode,
      bookingId,
      eventId: String(booking.eventId || ''),
      attendeeEmail,
      signature: booking.signature || 'ntx_verified_pass',
      type: 'NITROXX_TICKET',
      v: 1,
    });

    const ticketData = {
      bookingId,
      eventId: booking.eventId,
      ticketCode,
      eventName,
      eventBannerUrl: eventDoc?.banner || eventDoc?.bannerImage || eventDoc?.image || eventDoc?.bannerUrl,
      attendeeName,
      attendeeEmail,
      attendeePhone: booking.phone || booking.bookingContact?.phone,
      eventDateTime,
      eventVenue,
      eventCity,
      organizerName,
      ticketTier,
      ticketsCount,
      bibNumber: booking.bibNumber,
      totalAmount,
      currency: booking.currency || 'INR',
      qrPayload,
      bookedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    // Lazy-load heavy dependencies on execution
    const { generateTicketQrBuffer } = require('./services/qrService');
    const { generateTicketPdf } = require('./services/pdfService');
    const { uploadTicketPdfToStorage } = require('./services/storageService');
    const { sendTicketEmail } = require('./services/emailService');

    // Generate or reuse PDF & send
    const qrBuffer = await generateTicketQrBuffer(qrPayload);
    const pdfBuffer = await generateTicketPdf(ticketData, qrBuffer);
    const { downloadUrl, filePath } = await uploadTicketPdfToStorage(
      pdfBuffer,
      booking.eventId,
      bookingId,
      ticketCode
    );

    const emailResult = await sendTicketEmail(ticketData, pdfBuffer, downloadUrl);

    await bookingSnap.ref.update({
      emailSent: true,
      emailSentAt: FieldValue.serverTimestamp(),
      ticketPdfUrl: downloadUrl,
      ticketPdfStoragePath: filePath,
      ticketCode,
      ticketNumber: ticketCode,
      emailMessageId: emailResult.messageId || null,
      emailError: null,
      emailProcessing: false,
    });

    return {
      success: true,
      ticketCode,
      attendeeEmail,
      downloadUrl,
      messageId: emailResult.messageId,
    };
  }
);
