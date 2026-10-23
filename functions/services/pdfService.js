const PDFDocument = require('pdfkit');
const axios = require('axios');
const { logger } = require('firebase-functions');

/**
 * Generate a luxury dark-theme Nitroxx Official PDF Ticket Pass
 *
 * @param {Object} ticket - Standardized ticket data
 * @param {Buffer} qrBuffer - Pre-rendered QR code PNG buffer
 * @returns {Promise<Buffer>} Generated PDF file buffer
 */
async function generateTicketPdf(ticket, qrBuffer) {
  let bannerBuffer = null;
  if (ticket.eventBannerUrl && typeof ticket.eventBannerUrl === 'string' && ticket.eventBannerUrl.startsWith('http')) {
    try {
      const resp = await axios.get(ticket.eventBannerUrl, {
        responseType: 'arraybuffer',
        timeout: 4000,
      });
      bannerBuffer = Buffer.from(resp.data);
    } catch (e) {
      logger.warn(`Could not fetch event banner from ${ticket.eventBannerUrl}: ${e?.message}`);
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        info: {
          Title: `Nitroxx Ticket - ${ticket.ticketCode}`,
          Author: 'Nitroxx Motorsports',
          Subject: ticket.eventName,
          Creator: 'Nitroxx Cloud Functions',
        },
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // 1. Deep Black Outer Canvas Background
      doc.rect(0, 0, pageWidth, pageHeight).fill('#080a0e');

      // 2. Ticket Card Outer Container
      const cardWidth = 515;
      const cardHeight = 730;
      const cardX = (pageWidth - cardWidth) / 2;
      const cardY = 56;

      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 18).fill('#12161f');
      doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 18).lineWidth(1.5).stroke('#222834');

      // 3. Top Header Strip with Nitroxx Brand
      doc.roundedRect(cardX, cardY, cardWidth, 64, 18).fill('#171d28');
      doc.rect(cardX, cardY + 32, cardWidth, 32).fill('#171d28'); // square off bottom corners

      // Nitroxx Wordmark Logo
      doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('NITRO', cardX + 24, cardY + 20, { continued: true });
      doc.fillColor('#f97316').text('XX', { continued: true });
      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica-Bold').text('   OFFICIAL EVENT PASS', { baseline: 'middle' });

      // Status Pill (Right side)
      doc.roundedRect(cardX + cardWidth - 164, cardY + 18, 140, 26, 6).fill('#142e23');
      doc.fillColor('#10b981').fontSize(10).font('Helvetica-Bold').text('CONFIRMED PASS', cardX + cardWidth - 150, cardY + 26);

      let currentY = cardY + 80;

      // 4. Event Banner Image (or Stylized Racing Banner Fallback)
      const bannerHeight = 160;
      const bannerWidth = cardWidth - 48;
      const bannerX = cardX + 24;

      if (bannerBuffer) {
        try {
          doc.save();
          doc.roundedRect(bannerX, currentY, bannerWidth, bannerHeight, 10).clip();
          doc.image(bannerBuffer, bannerX, currentY, {
            width: bannerWidth,
            height: bannerHeight,
            align: 'center',
            valign: 'center',
          });
          doc.restore();
          doc.roundedRect(bannerX, currentY, bannerWidth, bannerHeight, 10).lineWidth(1).stroke('#2e384d');
        } catch (imgErr) {
          logger.warn('Failed to draw banner image on PDF, using graphic fallback:', imgErr);
          drawFallbackBanner(doc, bannerX, currentY, bannerWidth, bannerHeight, ticket.eventName);
        }
      } else {
        drawFallbackBanner(doc, bannerX, currentY, bannerWidth, bannerHeight, ticket.eventName);
      }

      currentY += bannerHeight + 18;

      // 5. Event Name & Core Metadata
      doc.fillColor('#ffffff').fontSize(21).font('Helvetica-Bold').text(ticket.eventName, cardX + 24, currentY, {
        width: cardWidth - 48,
        ellipsis: true,
        lineGap: 4,
      });

      currentY += 34;

      // Event Meta Strip (Date & Venue)
      doc.roundedRect(cardX + 24, currentY, cardWidth - 48, 56, 10).fill('#181f2a');
      doc.roundedRect(cardX + 24, currentY, cardWidth - 48, 56, 10).lineWidth(1).stroke('#283344');

      // Date / Time Box
      doc.fillColor('#f97316').fontSize(9).font('Helvetica-Bold').text('EVENT DATE & TIME', cardX + 38, currentY + 12);
      doc.fillColor('#f1f5f9').fontSize(11).font('Helvetica-Bold').text(ticket.eventDateTime, cardX + 38, currentY + 28, {
        width: 230,
        ellipsis: true,
      });

      // Venue / City Box
      doc.fillColor('#f97316').fontSize(9).font('Helvetica-Bold').text('VENUE & CITY', cardX + 290, currentY + 12);
      const venueStr = ticket.eventVenue
        ? (ticket.eventCity ? `${ticket.eventVenue}, ${ticket.eventCity}` : ticket.eventVenue)
        : ticket.eventCity || 'Venue Announced Soon';
      doc.fillColor('#f1f5f9').fontSize(11).font('Helvetica-Bold').text(venueStr, cardX + 290, currentY + 28, {
        width: 220,
        ellipsis: true,
      });

      currentY += 72;

      // 6. Attendee & Pass Details Grid
      const gridY = currentY;
      const cellHeight = 44;
      const col1X = cardX + 24;
      const col2X = cardX + 195;
      const col3X = cardX + 365;

      renderDetailCell(doc, col1X, gridY, 'ATTENDEE NAME', ticket.attendeeName);
      renderDetailCell(doc, col2X, gridY, 'PASS TIER', ticket.ticketTier);
      renderDetailCell(doc, col3X, gridY, 'TOTAL TICKETS', `${ticket.ticketsCount} Pass${ticket.ticketsCount > 1 ? 'es' : ''}`);

      const gridY2 = gridY + cellHeight + 8;
      renderDetailCell(doc, col1X, gridY2, 'BOOKING ID', `#${String(ticket.bookingId).slice(0, 12)}`);
      renderDetailCell(doc, col2X, gridY2, 'BIB NUMBER', ticket.bibNumber || 'ASSIGNED AT GATE');
      const amountStr = Number(ticket.totalAmount || 0) <= 0
        ? 'FREE'
        : `INR ${Number(ticket.totalAmount).toLocaleString('en-IN')}`;
      renderDetailCell(doc, col3X, gridY2, 'TOTAL AMOUNT', amountStr);

      currentY = gridY2 + cellHeight + 18;

      // 7. Perforated Fold Line with Circular Notches
      const notchRadius = 14;
      const perfY = currentY + 6;

      doc.save();
      doc.strokeColor('#2e384d').lineWidth(1.2).dash(5, { space: 4 });
      doc.moveTo(cardX + notchRadius + 4, perfY).lineTo(cardX + cardWidth - notchRadius - 4, perfY).stroke();
      doc.restore();

      // Left notch cutout
      doc.circle(cardX, perfY, notchRadius).fill('#080a0e');
      doc.circle(cardX, perfY, notchRadius).lineWidth(1.5).stroke('#222834');

      // Right notch cutout
      doc.circle(cardX + cardWidth, perfY, notchRadius).fill('#080a0e');
      doc.circle(cardX + cardWidth, perfY, notchRadius).lineWidth(1.5).stroke('#222834');

      currentY += 24;

      // 8. Gate Verification Section (QR Code & Ticket Code)
      const gateBoxHeight = 175;
      doc.roundedRect(cardX + 24, currentY, cardWidth - 48, gateBoxHeight, 12).fill('#161c26');
      doc.roundedRect(cardX + 24, currentY, cardWidth - 48, gateBoxHeight, 12).lineWidth(1).stroke('#273244');

      const qrSize = 135;
      const qrX = cardX + 42;
      const qrY = currentY + 20;

      // Pure white container backing for instant scanning in all lighting
      doc.roundedRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12, 8).fill('#ffffff');
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });

      const gateTextX = cardX + 205;
      let gateTextY = currentY + 20;

      doc.fillColor('#94a3b8').fontSize(9).font('Helvetica-Bold').text('TICKET ENTRY CODE', gateTextX, gateTextY);
      gateTextY += 14;
      doc.fillColor('#f97316').fontSize(22).font('Helvetica-Bold').text(ticket.ticketCode, gateTextX, gateTextY);
      gateTextY += 30;

      doc.fillColor('#e2e8f0').fontSize(10).font('Helvetica-Bold').text('GATE SCAN INSTRUCTIONS', gateTextX, gateTextY);
      gateTextY += 14;
      doc.fillColor('#94a3b8').fontSize(8.5).font('Helvetica').text(
        'Present this unique digital QR pass at the venue entrance. Each ticket is single-use and verified in real-time by the Nitroxx Gate System.',
        gateTextX,
        gateTextY,
        { width: 300, lineGap: 3 }
      );
      gateTextY += 34;

      doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(
        `Organized by: ${ticket.organizerName}`,
        gateTextX,
        gateTextY,
        { width: 300, ellipsis: true }
      );

      // Security Watermark Footer
      doc.fillColor('#475569').fontSize(7.5).font('Helvetica').text(
        'Valid photo ID required at gate. Non-transferable once scanned. Nitroxx Motorsports Platform - All Rights Reserved.',
        cardX + 24,
        cardY + cardHeight - 22,
        { align: 'center', width: cardWidth - 48 }
      );

      doc.end();
    } catch (error) {
      logger.error('Error generating ticket PDF:', error);
      reject(error);
    }
  });
}

function renderDetailCell(doc, x, y, label, value) {
  doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Bold').text(label, x, y);
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold').text(value, x, y + 13, {
    width: 155,
    ellipsis: true,
  });
}

function drawFallbackBanner(doc, x, y, width, height, title) {
  doc.roundedRect(x, y, width, height, 10).fill('#171f2d');
  doc.roundedRect(x, y, width, height, 10).lineWidth(1).stroke('#293549');

  // Decorative race stripes
  doc.polygon([x + 30, y], [x + 60, y], [x + 10, y + height], [x - 20, y + height]).fill('#f97316');
  doc.polygon([x + 65, y], [x + 85, y], [x + 35, y + height], [x + 15, y + height]).fill('#ea580c');

  // Title in banner
  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text(title, x + 100, y + height / 2 - 12, {
    width: width - 120,
    ellipsis: true,
  });
}

module.exports = {
  generateTicketPdf,
};
