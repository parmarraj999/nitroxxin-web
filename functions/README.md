# Nitroxx Transactional Email & PDF Ticket Generation Cloud Functions

Automated, production-ready serverless transactional email system for Nitroxx event bookings built with **Firebase Functions v2**, **Resend**, and **PDFKit**.

---

## ⚡ Overview & Architecture

Whenever an attendee completes an event registration / Razorpay payment:

```
User Books Ticket ➔ Razorpay Payment ➔ Booking in Firestore (bookings/{bookingId})
                                                      │
                                                      ▼
                                       Cloud Function Trigger (v2)
                                       [onBookingCreatedOrPaid]
                                                      │
                       ┌──────────────────────────────┴──────────────────────────────┐
                       ▼                                                             ▼
              Generate High-Res QR Code                                     Fetch Event Metadata
              (Single-Use Gate Payload)                                     (Banner, Location, Organizer)
                       │                                                             │
                       └──────────────────────────────┬──────────────────────────────┘
                                                      ▼
                                         Generate PDF Ticket Pass
                                         (Luxury Dark-Theme Ticket)
                                                      │
                                                      ▼
                                       Upload to Firebase Storage
                                       (Permanent Secure Token Link)
                                                      │
                                                      ▼
                                    Dispatch Email via Resend SDK
                                    (PDF Attachment + Download Link)
                                                      │
                                                      ▼
                                        Update Firestore Document
                             [emailSent: true, ticketPdfUrl, emailSentAt]
```

---

## 🚀 Features

- **Automated Firestore Trigger (`onBookingCreatedOrPaid`)**:
  - Listens to document writes at `bookings/{bookingId}`.
  - Automatically verifies confirmed payment state.
  - Implements **strict idempotency** and an atomic Firestore lock to guarantee zero duplicate emails.
- **Single-Use Secure QR Codes**:
  - Generates 15% Error Correction Margin (`ecc=M`) QR codes embedding the cryptographic check-in payload.
- **Official Nitroxx Ticket PDF**:
  - Generated on-the-fly using `pdfkit`.
  - Features event banner, title, date, venue, attendee name, pass tier, booking ID, bib number, perforated tear notches, and gate scanner instructions.
- **Firebase Storage Integration**:
  - Automatically saves the generated PDF to Firebase Storage (`tickets/{eventId}/{ticketCode}_{bookingId}.pdf`).
  - Generates a permanent media download URL saved on the booking document.
- **Resend SDK Integration**:
  - Professional, mobile-responsive dark HTML email matching Nitroxx branding.
  - High deliverability with PDF attachment and fallback download button.
  - Automatic exponential backoff retry for transient network errors.
- **Callable Function (`resendTicketEmail`)**:
  - On-demand admin / host endpoint to re-send ticket passes anytime.

---

## 🔒 Configuration & Firebase Secret Manager

All sensitive credentials are read securely via **Firebase Secret Manager** and never hardcoded in source control.

### 1. Set the Resend API Key:
```bash
firebase functions:secrets:set RESEND_API_KEY
```
*(When prompted, paste your Resend API Key, e.g. `re_123456789...`)*

### 2. (Optional) Set the Custom Sender Email:
```bash
firebase functions:secrets:set SENDER_EMAIL
```
*(e.g., `Nitroxx Events <tickets@nitroxx.com>` or leave empty to use default onboarding)*

---

## 🛠️ Local Development & Testing

### 1. Install Dependencies:
```bash
cd functions
npm install
```

### 2. Run Local Emulators:
Create a `.env.local` file inside `functions/`:
```env
RESEND_API_KEY=re_your_test_key_here
SENDER_EMAIL=Nitroxx Events <onboarding@resend.dev>
```

Start the Firebase emulator:
```bash
firebase emulators:start --only functions,firestore,storage
```

---

## 📦 Deployment

Deploy functions to Firebase:
```bash
firebase deploy --only functions
```

Or deploy specific functions:
```bash
firebase deploy --only functions:onBookingCreatedOrPaid,functions:resendTicketEmail
```
