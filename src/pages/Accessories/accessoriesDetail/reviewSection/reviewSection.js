import React, { useState, useMemo } from "react";
import "./reviewSection.css";
import { useAuth } from "../../../../context/AuthContext";
import { useAuthModal } from "../../../../components/AuthModal/useAuthModal";
import { useCollection } from "../../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../../services/firebase";
import { submitReview, markReviewHelpful } from "../../../../services/commerceService";

export function ReviewSection({ product }) {
  const productId = product?.id || "";
  const { user, profile } = useAuth();
  const { openLogin } = useAuthModal();

  // Fetch live reviews for this product
  const { data: rawReviews, loading: reviewsLoading } = useCollection(
    COLLECTIONS.reviews,
    useMemo(
      () => ({
        where: productId ? [["productId", "==", productId]] : [["productId", "==", "NO_PRODUCT"]],
      }),
      [productId]
    )
  );

  // Form states
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState("");

  // Filters & sorting
  const [starFilter, setStarFilter] = useState("all");
  const [withPhotosOnly, setWithPhotosOnly] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  // Helpful click tracker
  const [helpfulClicked, setHelpfulClicked] = useState({});

  // Lightbox modal state
  const [lightboxImg, setLightboxImg] = useState(null);

  const allReviews = useMemo(() => {
    return Array.isArray(rawReviews) ? rawReviews : [];
  }, [rawReviews]);

  // Compute breakdown metrics
  const totalCount = allReviews.length;
  const avgScore = useMemo(() => {
    if (!totalCount) return Number(product?.averageRating || 0);
    const sum = allReviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    return Math.round((sum / totalCount) * 10) / 10;
  }, [allReviews, totalCount, product]);

  const starCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating || 5))));
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  }, [allReviews]);

  // Filtered and sorted reviews
  const displayedReviews = useMemo(() => {
    let list = [...allReviews];

    if (starFilter !== "all") {
      list = list.filter((r) => Math.round(Number(r.rating)) === Number(starFilter));
    }
    if (withPhotosOnly) {
      list = list.filter((r) => Array.isArray(r.images) && r.images.length > 0);
    }

    list.sort((a, b) => {
      if (sortBy === "highest") return Number(b.rating || 0) - Number(a.rating || 0);
      if (sortBy === "lowest") return Number(a.rating || 0) - Number(b.rating || 0);
      if (sortBy === "helpful") return Number(b.helpfulCount || 0) - Number(a.helpfulCount || 0);
      // default: newest
      const aDate = new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0);
      const bDate = new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0);
      return bDate - aDate;
    });

    return list;
  }, [allReviews, starFilter, withPhotosOnly, sortBy]);

  // Handle image files selection
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages((prev) => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!user) {
      openLogin();
      return;
    }

    if (!rating) {
      setFormError("Please choose a rating star.");
      return;
    }

    if (!reviewText.trim()) {
      setFormError("Please enter your review text.");
      return;
    }

    setSubmitting(true);
    try {
      await submitReview({
        productId,
        productName: product?.name || product?.title || "Product",
        vendorId: product?.vendorId || "nitroxx-default-vendor",
        user,
        profile,
        rating,
        title,
        review: reviewText,
        images,
      });

      setSubmitSuccess(true);
      setTitle("");
      setReviewText("");
      setImages([]);
      setRating(5);
      setTimeout(() => setSubmitSuccess(false), 4000);
    } catch (err) {
      setFormError(err.message || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpfulClick = async (reviewId, currentCount) => {
    if (helpfulClicked[reviewId]) return;
    setHelpfulClicked((prev) => ({ ...prev, [reviewId]: true }));
    try {
      await markReviewHelpful(reviewId);
    } catch (err) {
      console.warn("Could not mark review as helpful:", err);
    }
  };

  const getRatingLabel = (val) => {
    switch (val) {
      case 5: return "5 Stars - Excellent";
      case 4: return "4 Stars - Very Good";
      case 3: return "3 Stars - Average";
      case 2: return "2 Stars - Poor";
      case 1: return "1 Star - Terrible";
      default: return "";
    }
  };

  const formatDateString = (rawDate) => {
    if (!rawDate) return "Recently";
    const dateObj = rawDate?.seconds ? new Date(rawDate.seconds * 1000) : new Date(rawDate);
    if (isNaN(dateObj.getTime())) return "Recently";
    return dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <section className="review-section">
      <h2 className="review-section__title">Customer Reviews & Ratings</h2>

      <div className="review-section__content">
        {/* ── Left: Rating Summary & Breakdown ── */}
        <div className="review-section__left">
          <div className="review-section__summary-card">
            <div className="review-section__score-badge">
              <span className="review-section__rating-score">{avgScore.toFixed(1)}</span>
              <div className="review-section__score-stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg
                    key={s}
                    className="review-section__summary-star"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={s <= Math.round(avgScore) ? "#f59e0b" : "none"}
                    stroke="#f59e0b"
                    strokeWidth="2"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ))}
              </div>
              <span className="review-section__count-text">Based on {totalCount} verified ratings</span>
            </div>

            {/* Rating Distribution Bars */}
            <div className="review-section__distribution">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = starCounts[star] || 0;
                const pct = totalCount ? Math.round((count / totalCount) * 100) : 0;
                const isSelected = starFilter === String(star);
                return (
                  <div
                    key={star}
                    className={`review-section__bar-row ${isSelected ? "selected" : ""}`}
                    onClick={() => setStarFilter(isSelected ? "all" : String(star))}
                    title={`Filter ${star} star reviews`}
                  >
                    <span className="review-section__bar-label">{star} ★</span>
                    <div className="review-section__bar-track">
                      <div className="review-section__bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="review-section__bar-count">{count}</span>
                    <span className="review-section__bar-pct">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="review-section__divider" />

        {/* ── Right: Reviews List & Filtering Controls ── */}
        <div className="review-section__right">
          {/* Controls toolbar */}
          <div className="review-section__toolbar">
            <div className="review-section__filter-pills">
              <button
                className={`review-section__pill ${starFilter === "all" && !withPhotosOnly ? "active" : ""}`}
                onClick={() => {
                  setStarFilter("all");
                  setWithPhotosOnly(false);
                }}
              >
                All ({totalCount})
              </button>
              <button
                className={`review-section__pill ${withPhotosOnly ? "active" : ""}`}
                onClick={() => setWithPhotosOnly((prev) => !prev)}
              >
                📷 With Photos
              </button>
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  className={`review-section__pill ${starFilter === String(star) ? "active" : ""}`}
                  onClick={() => setStarFilter(starFilter === String(star) ? "all" : String(star))}
                >
                  {star} ★ ({starCounts[star] || 0})
                </button>
              ))}
            </div>

            <div className="review-section__sort-wrap">
              <label htmlFor="review-sort-select">Sort by:</label>
              <select
                id="review-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="review-section__sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>
          </div>

          {/* Reviews list */}
          {reviewsLoading ? (
            <div className="review-section__empty-state">
              <p>Loading customer reviews...</p>
            </div>
          ) : displayedReviews.length === 0 ? (
            <div className="review-section__empty-state">
              {totalCount === 0 ? (
                <>
                  <p className="review-section__empty-title">No reviews yet for this product</p>
                  <p className="review-section__empty-sub">Be the first customer to share your feedback and rate this product below!</p>
                </>
              ) : (
                <>
                  <p>No reviews match your selected filter.</p>
                  <button
                    className="review-section__reset-btn"
                    onClick={() => {
                      setStarFilter("all");
                      setWithPhotosOnly(false);
                    }}
                  >
                    Show All Reviews
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="review-section__list">
              {displayedReviews.map((rev) => {
                const isClicked = helpfulClicked[rev.id];
                const currentHelpful = (Number(rev.helpfulCount) || 0) + (isClicked ? 1 : 0);
                const initials = (rev.customer || "U")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div key={rev.id || rev.reviewId} className="review-card">
                    <div className="review-card__header">
                      <div className="review-card__user">
                        {rev.customerPhoto ? (
                          <img src={rev.customerPhoto} alt={rev.customer} className="review-card__avatar" />
                        ) : (
                          <div className="review-card__avatar-badge">{initials}</div>
                        )}
                        <div>
                          <div className="review-card__user-name-row">
                            <span className="review-card__user-name">{rev.customer || "Verified Customer"}</span>
                            {rev.verifiedPurchase === "yes" && (
                              <span className="review-card__verified-badge">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Verified Purchase
                              </span>
                            )}
                          </div>
                          <span className="review-card__date">{formatDateString(rev.createdAt)}</span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="review-card__stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg
                            key={s}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill={s <= Math.round(rev.rating || 5) ? "#f59e0b" : "none"}
                            stroke="#f59e0b"
                            strokeWidth="2"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                      </div>
                    </div>

                    {/* Review Title & Body */}
                    {rev.title && <h4 className="review-card__title">{rev.title}</h4>}
                    <p className="review-card__body">{rev.review}</p>

                    {/* Photo attachments */}
                    {Array.isArray(rev.images) && rev.images.length > 0 && (
                      <div className="review-card__photos">
                        {rev.images.map((source, idx) => (
                          <img
                            key={idx}
                            src={source}
                            alt={`Review ${idx + 1}`}
                            className="review-card__photo-thumb"
                            onClick={() => setLightboxImg(source)}
                          />
                        ))}
                      </div>
                    )}

                    {/* Seller reply if available */}
                    {rev.reply && (
                      <div className="review-card__seller-reply">
                        <div className="review-card__seller-badge">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          Nitroxx Official Reply
                        </div>
                        <p className="review-card__seller-reply-text">{rev.reply}</p>
                      </div>
                    )}

                    {/* Helpful button */}
                    <div className="review-card__footer">
                      <button
                        className={`review-card__helpful-btn ${isClicked ? "clicked" : ""}`}
                        onClick={() => handleHelpfulClick(rev.id || rev.reviewId, rev.helpfulCount)}
                        disabled={isClicked}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isClicked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                        </svg>
                        Helpful ({currentHelpful})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Form Section: Write a Review ── */}
      <div className="review-section__your-review">
        <div className="review-section__form-header">
          <h3 className="review-section__your-review-title">Write a Customer Review</h3>
          <p className="review-section__form-subtitle">
            Share your experience with this product to help fellow riders and automotive enthusiasts.
          </p>
        </div>

        {submitSuccess && (
          <div className="review-section__alert success">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Thank you! Your review has been submitted successfully and is live.
          </div>
        )}

        {formError && (
          <div className="review-section__alert error">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmitReview} className="review-section__form">
          {/* Interactive Star Picker */}
          <div className="review-section__form-group">
            <label className="review-section__label">Overall Rating *</label>
            <div className="review-section__star-picker">
              {[1, 2, 3, 4, 5].map((starVal) => {
                const activeStar = hoverRating || rating;
                return (
                  <button
                    type="button"
                    key={starVal}
                    className="review-section__star-btn"
                    onMouseEnter={() => setHoverRating(starVal)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(starVal)}
                  >
                    <svg
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill={starVal <= activeStar ? "#f59e0b" : "none"}
                      stroke="#f59e0b"
                      strokeWidth="2"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </button>
                );
              })}
              <span className="review-section__rating-hint">{getRatingLabel(hoverRating || rating)}</span>
            </div>
          </div>

          {/* Headline Input */}
          <div className="review-section__form-group">
            <label htmlFor="review-headline" className="review-section__label">Review Headline / Title</label>
            <input
              id="review-headline"
              type="text"
              className="review-section__input-title"
              placeholder="e.g. Excellent fit, solid protection and premium quality!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Comment Box */}
          <div className="review-section__form-group">
            <label htmlFor="review-comment" className="review-section__label">Detailed Feedback / Review *</label>
            <textarea
              id="review-comment"
              className="review-section__comment-box"
              placeholder="What did you like or dislike? How was the fit, comfort, and durability? Share details to help other buyers."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </div>

          {/* Image Uploader */}
          <div className="review-section__form-group">
            <label className="review-section__label">Attach Product Photos (Optional)</label>
            <div className="review-section__photo-uploader">
              <label htmlFor="review-file-input" className="review-section__upload-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                Upload Photos
              </label>
              <input
                id="review-file-input"
                type="file"
                accept="image/*"
                multiple
                className="review-section__file-input"
                onChange={handleImageUpload}
              />
              <span className="review-section__upload-hint">Add up to 5 photos of your item</span>
            </div>

            {/* Thumbnail previews */}
            {images.length > 0 && (
              <div className="review-section__thumbnails-preview">
                {images.map((imgUrl, i) => (
                  <div key={i} className="review-section__thumb-box">
                    <img src={imgUrl} alt={`Upload preview ${i + 1}`} />
                    <button
                      type="button"
                      className="review-section__remove-thumb"
                      onClick={() => removeImage(i)}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" className="review-section__submit-btn" disabled={submitting}>
            {submitting ? "Submitting Review..." : user ? "Submit Review" : "Login to Submit Review"}
          </button>
        </form>
      </div>

      {/* ── Image Lightbox Modal ── */}
      {lightboxImg && (
        <div className="review-lightbox-modal" onClick={() => setLightboxImg(null)}>
          <button className="review-lightbox-modal__close" onClick={() => setLightboxImg(null)}>
            ✕
          </button>
          <div className="review-lightbox-modal__content" onClick={(e) => e.stopPropagation()}>
            <img src={lightboxImg} alt="Review attachment close up" />
          </div>
        </div>
      )}
    </section>
  );
}
