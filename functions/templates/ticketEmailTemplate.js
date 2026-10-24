/**
 * HTML Email Template Generator for Nitroxx Event Booking Confirmation
 */

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renders a state-of-the-art responsive HTML email branded for Nitroxx Motorsports
 *
 * @param {Object} ticket - Formatted ticket data object
 * @param {string} downloadUrl - Permanent Firebase Storage PDF download link
 * @returns {string} Fully compiled HTML string
 */
function renderTicketEmailHtml(ticket, downloadUrl) {
  const venueText = ticket.eventVenue
    ? (ticket.eventCity ? `${ticket.eventVenue}, ${ticket.eventCity}` : ticket.eventVenue)
    : ticket.eventCity || 'Venue Announced Soon';

  const amountDisplay = Number(ticket.totalAmount || 0) <= 0
    ? 'FREE'
    : `&#x20B9;${Number(ticket.totalAmount).toLocaleString('en-IN')}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>&#x1F39F;&#xFE0F; Your Nitroxx Ticket is Confirmed!</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #080a0e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    a {
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .main-table {
        width: 100% !important;
      }
      .content-padding {
        padding: 20px 16px !important;
      }
      .btn-full {
        width: 100% !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }
      .col-stack {
        display: block !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #080a0e;">

  <center style="width: 100%; background-color: #080a0e; padding: 24px 0;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="main-table" style="max-width: 600px; width: 100%; background-color: #11151e; border: 1px solid #1f2737; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.85);">

      <!-- Brand Header -->
      <tr>
        <td align="center" style="background: linear-gradient(135deg, #0e121a 0%, #171d29 100%); padding: 32px 24px; border-bottom: 2px solid #f97316;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center">
                <span style="font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                  NITRO<span style="color: #f97316;">XX</span>
                </span>
                <div style="font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">
                  OFFICIAL EVENT PASS
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Hero Confirmation Banner -->
      <tr>
        <td class="content-padding" style="padding: 32px 30px 16px 30px; text-align: center;">
          <div style="display: inline-block; background-color: #12281e; border: 1px solid #10b981; border-radius: 30px; padding: 6px 18px; margin-bottom: 16px;">
            <span style="color: #10b981; font-size: 12px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
              &#x2705; BOOKING CONFIRMED &amp; VERIFIED
            </span>
          </div>

          <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1.25;">
            &#x1F39F;&#xFE0F; Your Nitroxx Ticket is Confirmed!
          </h1>
          <p style="margin: 0; font-size: 14.5px; line-height: 1.6; color: #94a3b8;">
            Hi <strong style="color: #f1f5f9;">${escapeHtml(ticket.attendeeName)}</strong>, thank you for booking with Nitroxx. Your single-use gate pass has been generated and your admission is officially reserved.
          </p>
        </td>
      </tr>

      <!-- Event Summary Card -->
      <tr>
        <td class="content-padding" style="padding: 24px 30px;">
          <div style="background-color: #18202d; border: 1px solid #283448; border-radius: 14px; padding: 22px; margin-bottom: 24px;">
            <span style="display: inline-block; font-size: 11px; font-weight: 700; color: #f97316; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 8px;">
              EVENT SUMMARY
            </span>
            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #ffffff; line-height: 1.3;">
              ${escapeHtml(ticket.eventName)}
            </h2>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-bottom: 10px;">
                  <span style="color: #f97316; font-size: 15px; margin-right: 8px;">&#x1F4C5;</span>
                  <strong style="color: #f1f5f9; font-size: 14px;">Date &amp; Time:</strong>
                  <span style="color: #cbd5e1; font-size: 14px; margin-left: 4px;">${escapeHtml(ticket.eventDateTime)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding-bottom: 10px;">
                  <span style="color: #f97316; font-size: 15px; margin-right: 8px;">&#x1F4CD;</span>
                  <strong style="color: #f1f5f9; font-size: 14px;">Venue:</strong>
                  <span style="color: #cbd5e1; font-size: 14px; margin-left: 4px;">${escapeHtml(venueText)}</span>
                </td>
              </tr>
              <tr>
                <td>
                  <span style="color: #f97316; font-size: 15px; margin-right: 8px;">&#x1F3C1;</span>
                  <strong style="color: #f1f5f9; font-size: 14px;">Organizer:</strong>
                  <span style="color: #cbd5e1; font-size: 14px; margin-left: 4px;">${escapeHtml(ticket.organizerName)}</span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Ticket Details Box -->
          <div style="background-color: #151a24; border: 1px solid #222b3c; border-radius: 14px; padding: 20px; margin-bottom: 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="50%" class="col-stack" style="padding-bottom: 14px;">
                  <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Ticket Code</span><br>
                  <strong style="font-size: 18px; color: #f97316; font-family: monospace; letter-spacing: 0.5px;">${escapeHtml(ticket.ticketCode)}</strong>
                </td>
                <td width="50%" class="col-stack" style="padding-bottom: 14px;">
                  <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Booking ID</span><br>
                  <span style="font-size: 14px; color: #f1f5f9; font-family: monospace;">#${escapeHtml(String(ticket.bookingId).slice(0, 14))}</span>
                </td>
              </tr>
              <tr>
                <td width="50%" class="col-stack">
                  <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Pass Tier &amp; Qty</span><br>
                  <span style="font-size: 14px; color: #f1f5f9;">${escapeHtml(ticket.ticketTier)} (${ticket.ticketsCount} Ticket${ticket.ticketsCount > 1 ? 's' : ''})</span>
                </td>
                <td width="50%" class="col-stack">
                  <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Amount Paid</span><br>
                  <strong style="font-size: 15px; color: #10b981;">${amountDisplay} (Confirmed)</strong>
                </td>
              </tr>
            </table>
          </div>

          <!-- Call to Action Buttons -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
            <tr>
              <td align="center">
                <a href="${downloadUrl}" target="_blank" class="btn-full" style="display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 800; padding: 16px 36px; border-radius: 12px; box-shadow: 0 8px 20px rgba(249, 115, 22, 0.35); letter-spacing: 0.3px;">
                  &#x1F4E5; Download Official Ticket Pass (PDF)
                </a>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top: 14px;">
                <a href="mailto:support@nitroxx.com?subject=Inquiry%20for%20Booking%20${encodeURIComponent(ticket.ticketCode)}" class="btn-full" style="display: inline-block; background-color: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15); color: #cbd5e1; text-decoration: none; font-size: 13.5px; font-weight: 600; padding: 11px 26px; border-radius: 10px;">
                  &#x1F4AC; Contact Support &amp; Organizer
                </a>
              </td>
            </tr>
          </table>

          <!-- Gate Scanner Hint -->
          <div style="background-color: #12161f; border-left: 3px solid #f97316; padding: 14px 18px; border-radius: 0 8px 8px 0; margin-bottom: 8px;">
            <p style="margin: 0; font-size: 12.5px; line-height: 1.5; color: #94a3b8;">
              <strong style="color: #f1f5f9;">Gate Check-In Notice:</strong> Your pass contains a cryptographic, single-use QR code. Have the attached PDF or digital pass open on your smartphone screen on arrival for instant admission.
            </p>
          </div>

        </td>
      </tr>

      <!-- Footer & Socials -->
      <tr>
        <td style="background-color: #0c0e14; padding: 28px 30px; text-align: center; border-top: 1px solid #1a2230;">
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #94a3b8; font-weight: 600;">
            Follow Nitroxx on Social Media
          </p>
          <div style="margin-bottom: 16px;">
            <a href="https://instagram.com" target="_blank" style="color: #f97316; font-size: 12.5px; font-weight: 700; margin: 0 10px; text-decoration: none;">Instagram</a>
            <span style="color: #334155;">&bull;</span>
            <a href="https://youtube.com" target="_blank" style="color: #f97316; font-size: 12.5px; font-weight: 700; margin: 0 10px; text-decoration: none;">YouTube</a>
            <span style="color: #334155;">&bull;</span>
            <a href="https://twitter.com" target="_blank" style="color: #f97316; font-size: 12.5px; font-weight: 700; margin: 0 10px; text-decoration: none;">X (Twitter)</a>
            <span style="color: #334155;">&bull;</span>
            <a href="https://nitroxx.in" target="_blank" style="color: #f97316; font-size: 12.5px; font-weight: 700; margin: 0 10px; text-decoration: none;">Website</a>
          </div>
          <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.5;">
            &copy; ${new Date().getFullYear()} Nitroxx Motorsports. All rights reserved.<br>
            You received this email because you registered for an event on the Nitroxx Platform.
          </p>
        </td>
      </tr>

    </table>
  </center>

</body>
</html>`;
}

module.exports = {
  renderTicketEmailHtml,
};
