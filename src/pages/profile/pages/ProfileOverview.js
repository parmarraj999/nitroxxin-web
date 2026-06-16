export default function ProfileOverview() {
  return (
    <section className="profile-screen">
      <article className="profile-card">
        <div className="profile-card__top">
          <img
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80"
            alt="John Doe"
            className="profile-avatar"
          />
          <button type="button" className="edit-btn">
            <span>&#9998;</span> Edit
          </button>
        </div>
        <div className="profile-card__body">
          <h2>John Doe</h2>
          <p>8842384923</p>
          <p>demoUser@gmail.com</p>
          <span>Joined 27 May 2026</span>
        </div>
      </article>
    </section>
  );
}
