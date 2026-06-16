import "./reviewSection.css";


export function ReviewSection() {
  return (
    <section className="review-section">
      <h2 className="review-section__title">Review</h2>

      <div className="review-section__content">
        {/* Left: rating summary */}
        <div className="review-section__left">
          <div className="review-section__rating-summary">
            <span className="review-section__rating-score">4.2</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star-icon lucide-star"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
          </div>
          <div className="review-section__rating-chart">
            {/* <img className="review-section__chart-image" src={imgImage6} alt="Rating distribution chart" /> */}
          </div>
        </div>

        {/* Divider */}
        <div className="review-section__divider" />

        {/* Right: reviews */}
        <div className="review-section__right">
          {/* <img className="review-section__reviews-image" src={imgImage7} alt="Customer reviews" /> */}
        </div>
      </div>

      {/* Your Review */}
      <div className="review-section__your-review">
        <h3 className="review-section__your-review-title">Your Review</h3>
        <div className="review-section__stars">
          {[1, 2, 3, 4, 5].map((i) => (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-star-icon lucide-star"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>
          ))}
        </div>
        <textarea
          className="review-section__comment-box"
          placeholder="Comment "
        />
      </div>
    </section>
  );
}
