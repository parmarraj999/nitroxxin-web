const { v4: uuidv4 } = require('uuid');
const { logger } = require('firebase-functions');
const { bucket } = require('../config/firebase');

/**
 * Upload generated PDF ticket buffer to Firebase Storage and generate a permanent download URL
 *
 * @param {Buffer} pdfBuffer - Raw PDF file buffer
 * @param {string} eventId - Unique event identifier
 * @param {string} bookingId - Unique booking document ID
 * @param {string} ticketCode - Unique ticket code (e.g. NTX-8K2M-3210)
 * @returns {Promise<{ downloadUrl: string, filePath: string }>}
 */
async function uploadTicketPdfToStorage(pdfBuffer, eventId, bookingId, ticketCode) {
  try {
    const downloadToken = uuidv4();
    const safeEventId = String(eventId || 'general').replace(/[^a-zA-Z0-9_-]/g, '');
    const safeTicketCode = String(ticketCode || 'TICKET').replace(/[^a-zA-Z0-9_-]/g, '');
    const safeBookingId = String(bookingId || 'BKG').replace(/[^a-zA-Z0-9_-]/g, '');
    const filePath = `tickets/${safeEventId}/${safeTicketCode}_${safeBookingId}.pdf`;
    const file = bucket.file(filePath);

    await file.save(pdfBuffer, {
      resumable: false,
      metadata: {
        contentType: 'application/pdf',
        contentDisposition: `attachment; filename="Nitroxx-Ticket-${safeTicketCode}.pdf"`,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
          bookingId: String(bookingId),
          eventId: String(eventId),
          ticketCode: String(ticketCode),
          generatedAt: new Date().toISOString(),
        },
      },
    });

    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      filePath
    )}?alt=media&token=${downloadToken}`;

    logger.info(`Successfully stored ticket PDF in Firebase Storage at ${filePath}`);
    return { downloadUrl, filePath };
  } catch (error) {
    logger.error('Failed to upload ticket PDF to Firebase Storage:', error);
    throw new Error(`Storage upload failed: ${error?.message || error}`);
  }
}

module.exports = {
  uploadTicketPdfToStorage,
};
