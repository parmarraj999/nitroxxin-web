const QRCode = require('qrcode');
const { logger } = require('firebase-functions');

/**
 * Generate a clean, high-contrast QR code image buffer for the ticket
 *
 * @param {string} payload - JSON string or unique ticket code to encode
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateTicketQrBuffer(payload) {
  try {
    const qrBuffer = await QRCode.toBuffer(payload, {
      type: 'png',
      width: 320,
      margin: 1,
      errorCorrectionLevel: 'M', // 15% error correction margin
      color: {
        dark: '#0c0f14',
        light: '#ffffff',
      },
    });
    return qrBuffer;
  } catch (error) {
    logger.error('Failed to generate ticket QR code buffer:', error);
    throw new Error(`QR generation failed: ${error?.message || error}`);
  }
}

module.exports = {
  generateTicketQrBuffer,
};
