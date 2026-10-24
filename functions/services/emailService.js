const { Resend } = require('resend');
const { logger } = require('firebase-functions');
const { renderTicketEmailHtml } = require('../templates/ticketEmailTemplate');
const { withRetry } = require('../utils/retry');

/**
 * Send transactional ticket confirmation email using Resend SDK
 *
 * @param {Object} ticket - Formatted ticket data object
 * @param {Buffer} pdfBuffer - Generated PDF pass buffer for attachment
 * @param {string} downloadUrl - Firebase Storage permanent download URL
 * @returns {Promise<{ success: boolean, messageId?: string }>}
 */
async function sendTicketEmail(ticket, pdfBuffer, downloadUrl) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    logger.error('RESEND_API_KEY is not defined in Secret Manager or environment variables.');
    throw new Error('Resend API key missing from Firebase Secret Manager');
  }

  // Resolve verified sender email for nitroxx.in
  let fromEmail = 'Nitroxx Events <tickets@nitroxx.in>';
  const configured = (process.env.SENDER_EMAIL || '').trim();

  if (configured) {
    // If configured with an unverified public webmail domain (like @gmail.com), fall back to verified nitroxx.in
    if (/@(gmail|googlemail|yahoo|outlook|hotmail|icloud)\.com/i.test(configured)) {
      logger.warn(
        `[Sender Guard] Configured SENDER_EMAIL (${configured}) is an unverified public webmail domain. Using verified domain: tickets@nitroxx.in`
      );
      fromEmail = 'Nitroxx Events <tickets@nitroxx.in>';
    } else if (configured.includes('<') && configured.includes('>')) {
      fromEmail = configured;
    } else {
      fromEmail = `Nitroxx Events <${configured}>`;
    }
  }

  const resend = new Resend(apiKey.trim());
  const htmlBody = renderTicketEmailHtml(ticket, downloadUrl);

  const mailOptions = {
    from: fromEmail,
    to: [ticket.attendeeEmail],
    replyTo: 'Nitroxx Support <support@nitroxx.in>',
    subject: '🎟️ Your Nitroxx Ticket is Confirmed!',
    html: htmlBody,
    attachments: [
      {
        filename: `Nitroxx-Ticket-${ticket.ticketCode}.pdf`,
        content: pdfBuffer,
      },
    ],
    headers: {
      'X-Entity-Ref-ID': ticket.bookingId,
    },
    tags: [
      { name: 'category', value: 'ticket_confirmation' },
      { name: 'event_id', value: String(ticket.eventId || '') },
      { name: 'booking_id', value: String(ticket.bookingId) },
    ],
  };

  logger.info(
    `Sending ticket confirmation email to ${ticket.attendeeEmail} for booking ${ticket.bookingId} from ${fromEmail}`
  );

  return withRetry(
    async () => {
      const response = await resend.emails.send(mailOptions);
      if (response.error) {
        logger.error(`Resend API returned error for ${ticket.attendeeEmail}:`, response.error);
        const rawMsg = response.error.message || JSON.stringify(response.error);
        if (rawMsg.includes('only send testing emails to your own email address')) {
          throw new Error(
            `Resend Sandbox Limit: onboarding@resend.dev can only send to account owner's email. Verify domain at resend.com or use account email.`
          );
        }
        if (rawMsg.includes('not verified')) {
          throw new Error(
            `Resend Domain Error: ${rawMsg}. Ensure DNS records for nitroxx.in are active at resend.com/domains.`
          );
        }
        throw new Error(`Resend error: ${rawMsg}`);
      }
      logger.info(`Email successfully sent! Resend Message ID: ${response.data?.id}`);
      return {
        success: true,
        messageId: response.data?.id,
      };
    },
    {
      maxRetries: 3,
      initialDelayMs: 600,
      backoffFactor: 2,
      operationName: `Resend Email (${ticket.attendeeEmail})`,
    }
  );
}

module.exports = {
  sendTicketEmail,
};
