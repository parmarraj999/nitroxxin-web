import React from 'react';
import { Link } from 'react-router-dom';
import './footer.css';

const Footer = () => {
    return (
        <footer className="main-footer">
            <div className="footer-container">
                <div className="footer-top">
                    {/* Brand Column */}
                    <div className="footer-column brand-column">
                        <Link to="/" className="footer-logo-link">
                            <h1 className="footer-logo">
                                NITRO<span className="footer-logo-x">X</span>X
                            </h1>
                        </Link>
                        <div className="footer-socials">
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Facebook">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                                </svg>
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="Instagram">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                </svg>
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="X (formerly Twitter)">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-icon" aria-label="YouTube">
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                                    <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Columns */}
                    <div className="footer-column">
                        <h2 className="column-title">Help</h2>
                        <ul className="column-links">
                            <li><Link to="/support">Contact Us</Link></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h2 className="column-title">Quick Links</h2>
                        <ul className="column-links">
                            <li><Link to="/events">List your events</Link></li>
                            <li><a href="https://nitroxxin-dashboard.web.app/" target="_blank" rel="noopener noreferrer">List your Store    </a></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h2 className="column-title">Useful Links</h2>
                        <ul className="column-links">
                            <li><a href="https://www.zomato.com" target="_blank" rel="noopener noreferrer">Zomato</a></li>
                            <li><a href="https://www.blinkit.com" target="_blank" rel="noopener noreferrer">Blinkit</a></li>
                            <li><a href="https://www.feedingindia.org" target="_blank" rel="noopener noreferrer">Feeding India</a></li>
                            <li><a href="https://www.hyperpure.com" target="_blank" rel="noopener noreferrer">Hyperpure</a></li>
                        </ul>
                    </div>

                    {/* QR Code Column */}
                    <div className="footer-column download-column">
                        <h2 className="column-title">Download App</h2>
                        <div className="download-card">
                            <div className="qr-code-wrapper">
                                <svg viewBox="0 0 29 29" className="qr-code-svg" aria-label="QR Code to download app">
                                    <rect width="29" height="29" fill="#ffffff" rx="2" />
                                    {/* Corner squares */}
                                    <rect x="2" y="2" width="7" height="7" fill="#000" />
                                    <rect x="3" y="3" width="5" height="5" fill="#fff" />
                                    <rect x="4" y="4" width="3" height="3" fill="#000" />
                                    <rect x="20" y="2" width="7" height="7" fill="#000" />
                                    <rect x="21" y="3" width="5" height="5" fill="#fff" />
                                    <rect x="22" y="4" width="3" height="3" fill="#000" />
                                    <rect x="2" y="20" width="7" height="7" fill="#000" />
                                    <rect x="3" y="21" width="5" height="5" fill="#fff" />
                                    <rect x="4" y="22" width="3" height="3" fill="#000" />
                                    {/* Alignment marker */}
                                    <rect x="20" y="20" width="5" height="5" fill="#000" />
                                    <rect x="21" y="21" width="3" height="3" fill="#fff" />
                                    <rect x="22" y="22" width="1" height="1" fill="#000" />
                                    {/* Random data grid dots */}
                                    <path d="M 10,2 h 1 v 1 h -1 z M 12,2 h 2 v 1 h -2 z M 16,2 h 1 v 1 h -1 z M 18,2 h 1 v 1 h -1 z
                                             M 10,3 h 2 v 1 h -2 z M 14,3 h 1 v 1 h -1 z M 17,3 h 1 v 1 h -1 z
                                             M 11,4 h 1 v 1 h -1 z M 13,4 h 2 v 1 h -2 z M 16,4 h 2 v 1 h -2 z
                                             M 10,5 h 1 v 1 h -1 z M 12,5 h 1 v 1 h -1 z M 15,5 h 3 v 1 h -3 z
                                             M 11,6 h 3 v 1 h -3 z M 16,6 h 1 v 1 h -1 z M 18,6 h 1 v 1 h -1 z
                                             M 2,10 h 1 v 1 h -1 z M 4,10 h 2 v 1 h -2 z M 8,10 h 3 v 1 h -3 z M 13,10 h 1 v 1 h -1 z M 16,10 h 2 v 1 h -2 z M 20,10 h 1 v 1 h -1 z M 23,10 h 2 v 1 h -2 z M 27,10 h 1 v 1 h -1 z
                                             M 3,11 h 1 v 1 h -1 z M 6,11 h 1 v 1 h -1 z M 9,11 h 2 v 1 h -2 z M 12,11 h 1 v 1 h -1 z M 15,11 h 2 v 1 h -2 z M 19,11 h 3 v 1 h -3 z M 24,11 h 1 v 1 h -1 z M 26,11 h 2 v 1 h -2 z
                                             M 2,12 h 2 v 1 h -2 z M 5,12 h 1 v 1 h -1 z M 8,12 h 1 v 1 h -1 z M 11,12 h 2 v 1 h -2 z M 14,12 h 1 v 1 h -1 z M 17,12 h 1 v 1 h -1 z M 21,12 h 1 v 1 h -1 z M 23,12 h 3 v 1 h -3 z M 27,12 h 1 v 1 h -1 z
                                             M 4,13 h 1 v 1 h -1 z M 7,13 h 3 v 1 h -3 z M 12,13 h 1 v 1 h -1 z M 15,13 h 1 v 1 h -1 z M 18,13 h 2 v 1 h -2 z M 22,13 h 2 v 1 h -2 z M 25,13 h 1 v 1 h -1 z
                                             M 2,14 h 1 v 1 h -1 z M 5,14 h 2 v 1 h -2 z M 9,14 h 1 v 1 h -1 z M 11,14 h 1 v 1 h -1 z M 13,14 h 3 v 1 h -3 z M 17,14 h 2 v 1 h -2 z M 20,14 h 1 v 1 h -1 z M 23,14 h 1 v 1 h -1 z M 26,14 h 2 v 1 h -2 z
                                             M 3,15 h 2 v 1 h -2 z M 8,15 h 2 v 1 h -2 z M 12,15 h 2 v 1 h -2 z M 16,15 h 1 v 1 h -1 z M 19,15 h 1 v 1 h -1 z M 21,15 h 3 v 1 h -3 z M 25,15 h 2 v 1 h -2 z
                                             M 2,16 h 1 v 1 h -1 z M 4,16 h 2 v 1 h -2 z M 7,16 h 1 v 1 h -1 z M 10,16 h 3 v 1 h -3 z M 14,16 h 1 v 1 h -1 z M 16,16 h 2 v 1 h -2 z M 20,16 h 2 v 1 h -2 z M 24,16 h 1 v 1 h -1 z M 27,16 h 1 v 1 h -1 z
                                             M 3,17 h 1 v 1 h -1 z M 6,17 h 2 v 1 h -2 z M 9,17 h 1 v 1 h -1 z M 11,17 h 2 v 1 h -2 z M 15,17 h 3 v 1 h -3 z M 22,17 h 1 v 1 h -1 z M 25,17 h 3 v 1 h -3 z
                                             M 2,18 h 2 v 1 h -2 z M 5,18 h 1 v 1 h -1 z M 8,18 h 1 v 1 h -1 z M 10,18 h 2 v 1 h -2 z M 13,18 h 1 v 1 h -1 z M 16,18 h 1 v 1 h -1 z M 18,18 h 1 v 1 h -1 z M 26,18 h 2 v 1 h -2 z
                                             M 10,20 h 2 v 1 h -2 z M 13,20 h 1 v 1 h -1 z M 16,20 h 2 v 1 h -2 z
                                             M 11,21 h 1 v 1 h -1 z M 14,21 h 1 v 1 h -1 z M 17,21 h 1 v 1 h -1 z
                                             M 10,22 h 1 v 1 h -1 z M 12,22 h 2 v 1 h -2 z M 15,22 h 2 v 1 h -2 z
                                             M 11,23 h 2 v 1 h -2 z M 14,23 h 1 v 1 h -1 z M 16,23 h 2 v 1 h -2 z
                                             M 10,24 h 1 v 1 h -1 z M 12,24 h 1 v 1 h -1 z M 15,24 h 3 v 1 h -3 z
                                             M 11,25 h 3 v 1 h -3 z M 16,25 h 1 v 1 h -1 z M 18,25 h 1 v 1 h -1 z
                                             M 10,26 h 2 v 1 h -2 z M 13,26 h 1 v 1 h -1 z M 16,26 h 2 v 1 h -2 z" fill="#000" />
                                </svg>
                            </div>
                            <div className="download-text">
                                <span className="scan-title">Scan to Download</span>
                                <span className="scan-subtitle">Available on iOS & Android</span>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="footer-divider" />

                <div className="footer-bottom">
                    <div className="footer-bottom-left">
                        <p className="copyright">© 2026 Nitroxxin. All rights reserved.</p>
                        <p className="disclaimer">
                            By accessing this page, you confirm that you have read, understood, and agreed to our Terms of Service, Cookie Policy, Privacy Policy, and Content Guidelines.
                        </p>
                    </div>
                    <div className="footer-bottom-right">
                        <Link to="/terms" className="footer-legal-link">Terms & Conditions</Link>
                        <Link to="/privacy" className="footer-legal-link">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
