import React, { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { db, serverTimestamp } from "../../../services/firebase";

const FEATURED_BUCKET_LIST = [
  {
    title: "Leh-Ladakh & Khardung La Pass",
    category: "High Altitude Route",
    distance: "1,200 km",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
    description: "Conquer the world's highest motorable mountain passes on two wheels.",
  },
  {
    title: "Western Ghats Monsoon Cruise",
    category: "Scenic Curves",
    distance: "450 km",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
    description: "Twisting hairpin curves through misty green rainforests and waterfalls.",
  },
  {
    title: "Spiti Valley Expedition",
    category: "Off-Road Wilderness",
    distance: "900 km",
    image: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80",
    description: "Rugged river crossings, ancient cliffside monasteries, and raw terrain.",
  },
  {
    title: "Rann of Kutch Full Moon Ride",
    category: "Endless Horizons",
    distance: "350 km",
    image: "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80",
    description: "Cruise across infinite glowing white salt flats under midnight moonlight.",
  },
];

export default function ThrottleList() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "Dream Route",
    targetDate: "",
    bike: "",
    notes: "",
  });

  const { data: userItems, loading } = useCollection(
    user?.uid ? `users/${user.uid}/throttle_list` : null,
    { orderBy: [["createdAt", "desc"]] }
  );

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!user?.uid || !formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      await db().collection("users").doc(user.uid).collection("throttle_list").add({
        title: formData.title.trim(),
        category: formData.category,
        targetDate: formData.targetDate || null,
        bike: formData.bike.trim() || null,
        notes: formData.notes.trim() || null,
        completed: false,
        createdAt: serverTimestamp(),
      });

      setFormData({
        title: "",
        category: "Dream Route",
        targetDate: "",
        bike: "",
        notes: "",
      });
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to add throttle goal:", err);
      alert("Could not save goal. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (item) => {
    if (!user?.uid || !item.id) return;
    try {
      await db()
        .collection("users")
        .doc(user.uid)
        .collection("throttle_list")
        .doc(item.id)
        .update({
          completed: !item.completed,
          completedAt: !item.completed ? serverTimestamp() : null,
        });
    } catch (err) {
      console.error("Failed to toggle completion:", err);
    }
  };

  const handleDelete = async (itemId) => {
    if (!user?.uid || !itemId) return;
    try {
      await db().collection("users").doc(user.uid).collection("throttle_list").doc(itemId).delete();
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  const handleAddFeatured = async (featured) => {
    if (!user?.uid) return;
    try {
      await db().collection("users").doc(user.uid).collection("throttle_list").add({
        title: featured.title,
        category: featured.category,
        notes: `${featured.description} (${featured.distance})`,
        completed: false,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to add featured goal:", err);
    }
  };

  return (
    <div className="profile-page-container">
      <div className="profile-page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "24px" }}>🔥</span>
            <h1 className="profile-page-title">My Throttle List</h1>
          </div>
          <p className="profile-page-subtitle">
            Your personal riding bucket list, dream circuits, and motorcycle milestones
          </p>
        </div>
        <button
          type="button"
          className="profile-btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Goal
        </button>
      </div>

      <div className="profile-payment-section">
        <h3 className="profile-section-heading">My Active Riding Milestones</h3>

        {loading ? (
          <div className="profile-spinner" />
        ) : userItems.length === 0 ? (
          <div className="profile-payment-card-empty">
            <div className="profile-payment-icon" style={{ color: "#ff6b00" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
              </svg>
            </div>
            <div>
              <h4>No throttle goals yet</h4>
              <p>Set a dream motorcycle trail, track milestone, or add from the inspirations below!</p>
            </div>
          </div>
        ) : (
          <div className="profile-throttle-list">
            {userItems.map((item) => (
              <div
                className={`profile-throttle-card${item.completed ? " is-completed" : ""}`}
                key={item.id}
              >
                <button
                  type="button"
                  className={`profile-throttle-check${item.completed ? " checked" : ""}`}
                  onClick={() => handleToggleComplete(item)}
                  title={item.completed ? "Mark incomplete" : "Mark as completed"}
                >
                  {item.completed && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>

                <div className="profile-throttle-info">
                  <div className="profile-throttle-top">
                    <span className="profile-throttle-category">{item.category}</span>
                    {item.completed && (
                      <span className="profile-badge-active" style={{ color: "var(--green, #50d735)" }}>
                        ACHIEVED 🏁
                      </span>
                    )}
                  </div>
                  <h3 className="profile-throttle-title">{item.title}</h3>
                  {item.notes && <p className="profile-throttle-notes">{item.notes}</p>}
                  <div className="profile-throttle-meta">
                    {item.targetDate && <span>Target: {item.targetDate}</span>}
                    {item.bike && <span>Ride: {item.bike}</span>}
                  </div>
                </div>

                <button
                  type="button"
                  className="profile-btn-icon-danger"
                  onClick={() => handleDelete(item.id)}
                  title="Remove goal"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="profile-payment-section" style={{ marginTop: 40 }}>
        <h3 className="profile-section-heading">Featured Inspirations</h3>
        <div className="profile-featured-bucket-grid">
          {FEATURED_BUCKET_LIST.map((feat, idx) => (
            <div className="profile-featured-bucket-card" key={idx}>
              <div className="profile-featured-bucket-img-wrap">
                <img src={feat.image} alt={feat.title} />
                <span className="profile-featured-bucket-tag">{feat.distance}</span>
              </div>
              <div className="profile-featured-bucket-body">
                <span className="profile-featured-bucket-cat">{feat.category}</span>
                <h4>{feat.title}</h4>
                <p>{feat.description}</p>
                <button
                  type="button"
                  className="profile-btn-outline"
                  onClick={() => handleAddFeatured(feat)}
                >
                  + Add to My List
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <div className="profile-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Add Throttle Milestone</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddGoal} className="profile-form">
              <div className="profile-form-group">
                <label>Goal / Destination Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Ride to Kanyakumari Coast, First Track Day"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="profile-form-row">
                <div className="profile-form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Dream Route">Dream Route</option>
                    <option value="Track Day">Track Day</option>
                    <option value="Distance Milestone">Distance Milestone</option>
                    <option value="Custom Build">Custom Bike Build</option>
                    <option value="Rally / Meetup">Rally / Meetup</option>
                  </select>
                </div>
                <div className="profile-form-group">
                  <label>Target Date</label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="profile-form-group">
                <label>Motorcycle to Ride (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Royal Enfield Himalayan 450"
                  value={formData.bike}
                  onChange={(e) => setFormData({ ...formData, bike: e.target.value })}
                />
              </div>

              <div className="profile-form-group">
                <label>Notes / Inspiration</label>
                <textarea
                  rows="2"
                  placeholder="Details, companions, gear checklist..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="profile-btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add to Throttle List"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
