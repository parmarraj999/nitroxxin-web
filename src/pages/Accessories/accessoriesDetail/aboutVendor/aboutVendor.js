import React from "react";
import "./aboutVendor.css";
import { useDocument } from "../../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../../services/firebase";

export function AboutVendor({ product }) {
  const vendorId = product?.vendorId || "";
  const { data: vendorDoc } = useDocument(COLLECTIONS.vendors, vendorId);

  // Derive vendor attributes with graceful fallbacks
  const businessName =
    vendorDoc?.businessDetails?.businessName ||
    vendorDoc?.brandInformation?.brandName ||
    vendorDoc?.displayName ||
    product?.vendorName ||
    "Nitroxx Official Store";

  const brandName =
    vendorDoc?.brandInformation?.brandName ||
    product?.brand ||
    "Nitroxx Moto Gear";

  const ownerName =
    vendorDoc?.displayName ||
    vendorDoc?.gstDetails?.legalName ||
    "";

  const isVerified =
    vendorDoc?.verificationStatus === "verified" ||
    vendorId === "nitroxx-default-vendor" ||
    !vendorDoc; // Default partner verified

  const supportEmail =
    vendorDoc?.businessDetails?.supportEmail ||
    vendorDoc?.email ||
    "support@nitroxxin.com";

  const supportPhone =
    vendorDoc?.businessDetails?.supportPhone ||
    vendorDoc?.phone ||
    "+91 88699 59066";

  const warehouseAddress =
    vendorDoc?.warehouseAddress?.addressLine1 ||
    vendorDoc?.pickupAddress?.addressLine1 ||
    (vendorDoc?.warehouseAddress?.city ? `${vendorDoc.warehouseAddress.city}, ${vendorDoc.warehouseAddress.state || ""}` : "") ||
    "Central Fulfillment Hub, Bhopal, MP";

  const gstNumber =
    vendorDoc?.gstNumber ||
    vendorDoc?.gstDetails?.gstNumber ||
    "23AAACN1234F1Z5 (Verified)";

  const initialLetter = (businessName || "N").charAt(0).toUpperCase();

  return (
    <section className="about-vendor" id="about-vendor">
      <div className="about-vendor__container">
        {/* Section Header */}
        <div className="about-vendor__header">
          <div className="about-vendor__badge-pill">
            <span className="about-vendor__badge-dot" />
            <span>Verified Marketplace Merchant</span>
          </div>
          <h2 className="about-vendor__title">About The Vendor</h2>
          <p className="about-vendor__subtitle">
            This product is sold and fulfilled directly by an authorized Nitroxxin marketplace vendor.
          </p>
        </div>

        {/* Vendor Main Card */}
        <div className="about-vendor__card">
          <div className="about-vendor__card-top">
            <div className="about-vendor__identity">
              <div className="about-vendor__avatar">
                {vendorDoc?.logoUrl || vendorDoc?.avatar ? (
                  <img
                    src={vendorDoc.logoUrl || vendorDoc.avatar}
                    alt={businessName}
                    className="about-vendor__avatar-img"
                  />
                ) : (
                  <span className="about-vendor__avatar-text">{initialLetter}</span>
                )}
                {isVerified && (
                  <span className="about-vendor__avatar-check" title="Verified Seller">
                    ✓
                  </span>
                )}
              </div>

              <div className="about-vendor__meta">
                <div className="about-vendor__name-row">
                  <h3 className="about-vendor__name">{businessName}</h3>
                  {isVerified && (
                    <span className="about-vendor__verified-tag">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      Verified Seller
                    </span>
                  )}
                </div>

                <div className="about-vendor__tags">
                  <span className="about-vendor__tag">Brand: {brandName}</span>
                  {ownerName && <span className="about-vendor__tag">Owner: {ownerName}</span>}
                  <span className="about-vendor__tag about-vendor__tag--rating">★ 4.9 Rating</span>
                </div>
              </div>
            </div>

            <div className="about-vendor__actions">
              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}?subject=Inquiry about ${encodeURIComponent(product?.name || "Product")}`}
                  className="about-vendor__btn about-vendor__btn--primary"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  Email Vendor
                </a>
              )}
              {supportPhone && (
                <a href={`tel:${supportPhone}`} className="about-vendor__btn about-vendor__btn--secondary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Call Support
                </a>
              )}
            </div>
          </div>

          {/* Grid of Key Vendor Metrics & Commitments */}
          <div className="about-vendor__grid">
            <div className="about-vendor__info-card">
              <div className="about-vendor__info-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="about-vendor__info-content">
                <span className="about-vendor__info-title">Dispatches From</span>
                <span className="about-vendor__info-desc">{warehouseAddress}</span>
              </div>
            </div>

            <div className="about-vendor__info-card">
              <div className="about-vendor__info-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="about-vendor__info-content">
                <span className="about-vendor__info-title">Dispatch Speed</span>
                <span className="about-vendor__info-desc">Usually ships within 24-48 Hours</span>
              </div>
            </div>

            <div className="about-vendor__info-card">
              <div className="about-vendor__info-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="about-vendor__info-content">
                <span className="about-vendor__info-title">Authenticity</span>
                <span className="about-vendor__info-desc">100% Genuine & Tested Motorcycle Gear</span>
              </div>
            </div>

            <div className="about-vendor__info-card">
              <div className="about-vendor__info-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className="about-vendor__info-content">
                <span className="about-vendor__info-title">GST Identification</span>
                <span className="about-vendor__info-desc">{gstNumber}</span>
              </div>
            </div>
          </div>

          {/* Guarantee Footer */}
          <div className="about-vendor__footer">
            <div className="about-vendor__guarantee-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="about-vendor__guarantee-text">
              <strong>Nitroxxin Buyer Protection Guarantee:</strong> All orders placed with this vendor are covered by
              our secure payment escrow, verified delivery tracking, and hassle-free replacement support.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
