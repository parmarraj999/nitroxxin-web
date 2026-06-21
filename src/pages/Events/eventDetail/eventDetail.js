import React from 'react';
import './eventDetail.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useDocument } from '../../../hooks/useFirestore';
import { COLLECTIONS } from '../../../services/firebase';
import { normalizeEvent } from '../../../services/normalizers';
import { saveFavoriteEvent } from '../../../services/commerceService';
import { useAuth } from '../../../context/AuthContext';
import { useAuthModal } from '../../../components/AuthModal/useAuthModal';



export default function EventDetail({ onBack }) {

    const navigate = useNavigate();
    const { id } = useParams();
    const { data } = useDocument(COLLECTIONS.events, id);
    const event = data ? normalizeEvent(data) : null;
    const { user } = useAuth();
    const { openLogin } = useAuthModal();
    const activeEvent = event || {
        id: id || "1",
        title: "Live Concert of Seedhe Maut",
        dateTimeText: "Sat, 23 May, 8:00 PM",
        location: "Jawaharlal Nehru Stadium, New Delhi",
        image: "https://i.pinimg.com/736x/f4/19/f9/f419f9ee2c94bf67c5ccb2985295db2f.jpg",
        images: ["https://i.pinimg.com/736x/f4/19/f9/f419f9ee2c94bf67c5ccb2985295db2f.jpg"],
        description: "Ye lands in India for a one-night cultural reset. A full-scale sonic experience curated by the visionary formerly known as Kanye West architect of eras, disruptor of norms, and creator of some of the most defining soundtracks of our generation.",
        priceText: "₹7,500",
    };
    const gallery = activeEvent.images?.length ? activeEvent.images : [activeEvent.image];
    const handleFavorite = async () => {
        if (!user) return openLogin();
        await saveFavoriteEvent({ userId: user.uid, event: activeEvent });
    };

    return (
        <div className="event-detail-page">
            <div className="event-detail-scroll-container">
                <div className="event-detail-canvas">
                    {/* Background gradient */}
                    <div className="event-detail-bg" />

                    {/* Navbar */}
                    <div className="ed-navbar">
                        <div className="ed-navbar-blur" />
                        <button className="ed-back-btn" onClick={()=>navigate(-1)} aria-label="Go back">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" color='white' height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left-icon lucide-chevron-left"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                        <div className="ed-bookmark-btn" onClick={handleFavorite} role="button" tabIndex={0} onKeyDown={(event) => event.key === "Enter" && handleFavorite()}>
                            <div className="ed-bookmark-bg" />
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" color='white' viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bookmark-icon lucide-bookmark"><path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z" /></svg>
                        </div>
                    </div>

                    {/* Event title + subtitle */}
                    <p className="ed-event-title">{activeEvent.title || activeEvent.name}</p>
                    <p className="ed-event-meta">
                        <span className="ed-event-date">{activeEvent.dateTimeText || activeEvent.dateText} </span>
                        <span className="ed-event-location">| {activeEvent.location}</span>
                    </p>

                    {/* Hero images group */}
                    <div className="ed-images-group">
                        <div className="ed-img-main">
                            <img alt={activeEvent.title || activeEvent.name} src={gallery[0]} className="ed-img-cover ed-img-main-inner" />
                        </div>
                        <div className="ed-img-top-right-1">
                            <img alt={activeEvent.title || activeEvent.name} src={gallery[1] || gallery[0]} className="ed-img-cover ed-img-fill" />
                        </div>
                        <div className="ed-img-top-right-2">
                            <img alt={activeEvent.title || activeEvent.name} src={gallery[2] || gallery[0]} className="ed-img-cover ed-img-fill" />
                        </div>
                        <div className="ed-img-bottom-right-1">
                            <img alt={activeEvent.title || activeEvent.name} src={gallery[3] || gallery[0]} className="ed-img-cover ed-img-fill" />
                        </div>
                        <div className="ed-img-bottom-right-2">
                            <img alt={activeEvent.title || activeEvent.name} src={gallery[4] || gallery[0]} className="ed-img-cover ed-img-fill" />
                        </div>
                    </div>

                    {/* About section */}
                    <p className="ed-section-heading ed-about-heading">About</p>
                    <p className="ed-about-text">
                        {activeEvent.description || activeEvent.about || ""}
                    </p>
                    <p className="ed-read-more">Read More... </p>

                    {/* Things to know */}
                    <p className="ed-section-heading ed-things-heading">Thinks to know</p>
                    <ol className="ed-things-list">
                        <li>Duration 2 Hours</li>
                        <li>Entry allowed for ages 7 and above</li>
                        <li>Free water stations</li>
                    </ol>

                    {/* Info card */}
                    <div className="ed-info-card">
                        {/* Location row */}
                        <div className="ed-info-row">
                            <div className="ed-info-icon-box">
                                <svg xmlns="http://www.w3.org/2000/svg"color='white' width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin-icon lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
                            </div>
                            <div className="ed-info-text">
                                <p className="ed-info-label">{activeEvent.location}</p>
                                <p className="ed-info-sub">129 KM</p>
                            </div>
                            <div className="ed-info-arrow">
                               <svg xmlns="http://www.w3.org/2000/svg" color='white' width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right-icon lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                            </div>
                        </div>

                        <div className="ed-divider-thin" />

                        {/* Schedule row */}
                        <div className="ed-info-row">
                            <div className="ed-info-icon-box">
                                <svg xmlns="http://www.w3.org/2000/svg" color='white' width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-clock-icon lucide-calendar-clock"><path d="M16 14v2.2l1.6 1"/><path d="M16 2v4"/><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M3 10h5"/><path d="M8 2v4"/><circle cx="16" cy="16" r="6"/></svg>
                            </div>
                            <div className="ed-info-text">
                                <p className="ed-info-label">Gates open at 4 PM</p>
                                <p className="ed-info-sub">View Full Schedule </p>
                            </div>
                            <div className="ed-info-arrow">
                                 <svg xmlns="http://www.w3.org/2000/svg" color='white' width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right-icon lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                            </div>
                        </div>

                        <div className="ed-divider-thin" />

                        {/* Seats row */}
                        <div className="ed-info-row">
                            <div className="ed-info-icon-box">
                              <svg xmlns="http://www.w3.org/2000/svg" color='white' width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users-icon lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><path d="M16 3.128a4 4 0 0 1 0 7.744"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/></svg>
                            </div>
                            <div className="ed-info-text">
                                <p className="ed-info-label">48 Seat Available</p>
                                <p className="ed-info-sub">View Full List </p>
                            </div>
                            <div className="ed-info-arrow">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right-icon lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                            </div>
                        </div>

                        {/* Separator line */}
                        <div className="ed-card-divider" />

                        {/* Price + Book */}
                        <div className="ed-price-row">
                            <p className="ed-price">{activeEvent.priceText || activeEvent.price}</p>
                            <button className="ed-book-btn" onClick={() => navigate(`/event/${activeEvent.id}/book`)}>Book Ticket</button>
                        </div>
                    </div>

                    {/* More section */}
                    <p className="ed-section-heading ed-more-heading">More</p>
                    <div className="ed-more-card">
                        {/* FAQ row */}
                        <div className="ed-more-row">
                            <svg xmlns="http://www.w3.org/2000/svg" color='white' width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-question-mark-icon lucide-circle-question-mark"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                            <p className="ed-more-label">Frequently Asked Question</p>
                            <div className="ed-info-arrow">
                               <svg xmlns="http://www.w3.org/2000/svg" color='white' width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right-icon lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                            </div>
                        </div>
                        <div className="ed-divider-thin" />
                        {/* T&C row */}
                        <div className="ed-more-row">
                            <svg xmlns="http://www.w3.org/2000/svg" color='white' width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scroll-text-icon lucide-scroll-text"><path d="M15 12h-5"/><path d="M15 8h-5"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/></svg>
                            <p className="ed-more-label">Terms and Conditions</p>
                            <div className="ed-info-arrow">
                               <svg xmlns="http://www.w3.org/2000/svg" color='white' width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right-icon lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                            </div>
                        </div>
                    </div>

                    {/* Recommended Events */}
                    <p className="ed-recommended-heading">Recommended Events</p>
                    {/* <div className="ed-recommended-grid">
                        {[imgDownload32, imgBmwMotorrad, imgDownload32, imgBmwMotorrad].map((img, i) => (
                            <div className="ed-rec-card" key={i}>
                                <img alt="Recommended event" src={img} className="ed-rec-img" />
                                <div className="ed-rec-heart-btn">
                                    <img alt="Like" src={imgPokerHeartsFill} className="ed-rec-heart" />
                                </div>
                                <div className="ed-rec-info">
                                    <div className="ed-rec-info-left">
                                        <p className="ed-rec-name">Swift Motion</p>
                                        <p className="ed-rec-date">27 May 2026</p>
                                    </div>
                                    <div className="ed-rec-info-right">
                                        <p className="ed-rec-price">₹ 1200</p>
                                        <div className="ed-rec-dot" />
                                    </div>
                                </div>
                                <div className="ed-rec-arrow">
                                    <svg fill="none" viewBox="0 0 12 6" width="14" height="8">
                                        <path d="M1 5L6 1L11 5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div> */}
                </div>
            </div>
        </div>
    );
}
