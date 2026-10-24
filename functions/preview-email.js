const fs = require('fs');
const path = require('path');
const { renderTicketEmailHtml } = require('./templates/ticketEmailTemplate');

const mockTicket = {
  bookingId: 'BKG-7X9K2P',
  eventId: 'evt_sample_123',
  ticketCode: 'NTX-8K2M-4812',
  eventName: 'Nitroxx Valley Track Day 2026',
  eventBannerUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
  attendeeName: 'Alex Rider',
  attendeeEmail: 'alex@nitroxx.in',
  attendeePhone: '+91 98765 43210',
  eventDateTime: 'Sat, 14 Nov 2026, 06:00 AM',
  eventVenue: 'Buddh International Circuit',
  eventCity: 'Greater Noida',
  organizerName: 'Nitroxx Motorsports Official',
  ticketTier: 'Pro Rider Pass',
  ticketsCount: 2,
  bibNumber: 'BIB-101',
  totalAmount: 2499,
  currency: 'INR',
  bookedDate: '24 Oct 2026',
};

const mockDownloadUrl = 'https://firebasestorage.googleapis.com/v0/b/nitroxxin-web.firebasestorage.app/o/tickets%2Fsample.pdf?alt=media';
const html = renderTicketEmailHtml(mockTicket, mockDownloadUrl);
const outputPath = path.join(__dirname, 'preview-email.html');
fs.writeFileSync(outputPath, html, 'utf8');
console.log(`\nEmail HTML preview generated successfully!\nOpen in your browser: file://${outputPath}\n`);
