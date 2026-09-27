import React, { useState, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { db, serverTimestamp } from "../../../services/firebase";

const SAMPLE_GARAGE_BIKES = [
  {
    id: "sample-himalayan",
    brand: "ROYAL ENFIELD",
    model: "Himalayan 650",
    category: "Adventure Tourer",
    regNumber: "MH 02 DX 4892",
    engine: "648 cc",
    year: "2024",
    odometer: "14,200 km",
    imageUrl:
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80",
  },
  {
    id: "sample-duke",
    brand: "KTM",
    model: "Duke 390",
    category: "Naked Streetfighter",
    regNumber: "MH 12 QP 9912",
    engine: "399 cc",
    year: "2023",
    odometer: "8,450 km",
    imageUrl:
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1000&q=80",
  },
];

const POPULAR_BRANDS = [
  "Royal Enfield",
  "KTM",
  "BMW Motorrad",
  "Yamaha",
  "Kawasaki",
  "Ducati",
  "Triumph",
  "Harley-Davidson",
  "Honda",
  "Suzuki",
  "TVS",
  "Bajaj",
  "Other",
];

export default function MyBikes() {
  const { user } = useAuth();
  const { data: firestoreBikes, loading } = useCollection(
    user?.uid ? `users/${user.uid}/bikes` : null,
    { orderBy: [["createdAt", "desc"]] }
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBike, setEditingBike] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    brand: "Royal Enfield",
    model: "",
    category: "Adventure Tourer",
    cc: "650",
    year: "2024",
    odometer: "10,000 km",
    regNumber: "",
    imageUrl: "",
  });

  const bikes = useMemo(() => {
    if (firestoreBikes && firestoreBikes.length > 0) {
      return firestoreBikes;
    }
    return SAMPLE_GARAGE_BIKES;
  }, [firestoreBikes]);

  const handleOpenAdd = () => {
    setEditingBike(null);
    setFormData({
      brand: "Royal Enfield",
      model: "",
      category: "Adventure Tourer",
      cc: "650",
      year: new Date().getFullYear().toString(),
      odometer: "10,000 km",
      regNumber: "",
      imageUrl: "",
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (bike) => {
    setEditingBike(bike);
    setFormData({
      brand: bike.brand || "Royal Enfield",
      model: bike.model || "",
      category: bike.category || "Adventure Tourer",
      cc: bike.cc || bike.engine?.replace(" cc", "") || "",
      year: bike.year || "",
      odometer: bike.odometer || "",
      regNumber: bike.regNumber || "",
      imageUrl: bike.imageUrl || "",
    });
    setShowAddModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveBike = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    if (!formData.model.trim()) {
      alert("Please enter a model name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const collectionRef = db().collection("users").doc(user.uid).collection("bikes");
      const payload = {
        brand: formData.brand.toUpperCase(),
        model: formData.model.trim(),
        category: formData.category,
        engine: formData.cc ? `${formData.cc} cc` : "650 cc",
        cc: formData.cc,
        year: formData.year,
        odometer: formData.odometer ? (formData.odometer.includes("km") ? formData.odometer : `${formData.odometer} km`) : "5,000 km",
        regNumber: formData.regNumber.trim().toUpperCase() || "MH 02 AB 1234",
        imageUrl:
          formData.imageUrl.trim() ||
          "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80",
        updatedAt: serverTimestamp(),
      };

      if (editingBike && !String(editingBike.id).startsWith("sample-")) {
        await collectionRef.doc(editingBike.id).update(payload);
      } else {
        payload.createdAt = serverTimestamp();
        await collectionRef.add(payload);
      }

      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to save bike:", err);
      alert("Could not save motorcycle. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBike = async (bikeId) => {
    if (!user?.uid || !bikeId) return;
    if (!window.confirm("Are you sure you want to remove this machine from your garage?")) return;

    if (String(bikeId).startsWith("sample-")) {
      // It's a sample item, alert or just ignore
      alert("Sample machine removed.");
      return;
    }

    try {
      await db().collection("users").doc(user.uid).collection("bikes").doc(bikeId).delete();
    } catch (err) {
      console.error("Failed to delete bike:", err);
    }
  };

  return (
    <div className="nx-garage-page-wrap">
      {/* Top Header matching Screenshot 4 */}
      <div className="nx-garage-header">
        <div className="nx-garage-title-wrap">
          <h1 className="nx-garage-title">My Garage</h1>
          <p className="nx-garage-count-subtitle">
            {bikes.length} {bikes.length === 1 ? "Machine" : "Machines"} Registered
          </p>
        </div>

        <button
          type="button"
          className="nx-garage-plus-btn"
          onClick={handleOpenAdd}
          title="Add Motorcycle"
          aria-label="Add Motorcycle"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="profile-loading-state">
          <div className="profile-spinner" />
          <p>Loading your garage machines...</p>
        </div>
      ) : (
        <div className="nx-garage-cards-stack">
          {bikes.map((bike) => {
            const brand = bike.brand || "ROYAL ENFIELD";
            const model = bike.model || "Himalayan 650";
            const category = bike.category || "Adventure Tourer";
            const plate = bike.regNumber || "MH 02 DX 4892";
            const engine = bike.engine || (bike.cc ? `${bike.cc} cc` : "648 cc");
            const year = bike.year || "2024";
            const odometer = bike.odometer || "14,200 km";
            const image =
              bike.imageUrl ||
              "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80";

            return (
              <div className="nx-garage-card" key={bike.id}>
                {/* Photo with Category Tag & Indian Number Plate */}
                <div className="nx-garage-photo-wrap">
                  <img src={image} alt={`${brand} ${model}`} className="nx-garage-img" />

                  {/* Top Right Floating Category Badge */}
                  <span className="nx-garage-category-pill">{category}</span>

                  {/* Bottom Left Indian Number Plate Badge */}
                  <div className="nx-garage-ind-plate">
                    <span className="nx-garage-ind-strip">IND</span>
                    <span className="nx-garage-plate-number">{plate}</span>
                  </div>
                </div>

                {/* Bike Info Row: Brand, Model, Edit & Delete */}
                <div className="nx-garage-body">
                  <div className="nx-garage-info-header">
                    <div>
                      <span className="nx-garage-brand-tag">{brand}</span>
                      <h3 className="nx-garage-model-name">{model}</h3>
                    </div>

                    <div className="nx-garage-actions-row">
                      <button
                        type="button"
                        className="nx-garage-action-btn edit-btn"
                        onClick={() => handleOpenEdit(bike)}
                        title="Edit Machine"
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        className="nx-garage-action-btn delete-btn"
                        onClick={() => handleDeleteBike(bike.id)}
                        title="Remove Machine"
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Spec Bar with 3 Columns: ENGINE, YEAR, ODOMETER */}
                  <div className="nx-garage-specs-bar">
                    <div className="nx-garage-spec-col">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M16 12l-4-4" />
                      </svg>
                      <span className="nx-garage-spec-label">ENGINE</span>
                      <strong className="nx-garage-spec-val">{engine}</strong>
                    </div>

                    <div className="nx-garage-spec-col">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="nx-garage-spec-label">YEAR</span>
                      <strong className="nx-garage-spec-val">{year}</strong>
                    </div>

                    <div className="nx-garage-spec-col">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 17 12 22 22 17" />
                        <polyline points="2 12 12 17 22 12" />
                      </svg>
                      <span className="nx-garage-spec-label">ODOMETER</span>
                      <strong className="nx-garage-spec-val">{odometer}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Machine Modal */}
      {showAddModal && (
        <div className="profile-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>{editingBike ? "Edit Machine Details" : "Register New Machine"}</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveBike} className="profile-form">
              <div className="profile-form-row">
                <div className="profile-form-group">
                  <label>Brand / Make *</label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    required
                  >
                    {POPULAR_BRANDS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="profile-form-group">
                  <label>Model Name *</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="e.g. Himalayan 650, Duke 390"
                    required
                  />
                </div>
              </div>

              <div className="profile-form-row">
                <div className="profile-form-group">
                  <label>Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="Adventure Tourer">Adventure Tourer</option>
                    <option value="Naked Streetfighter">Naked Streetfighter</option>
                    <option value="Superbike / Sport">Superbike / Sport</option>
                    <option value="Cruiser">Cruiser</option>
                    <option value="Scrambler / Classic">Scrambler / Classic</option>
                  </select>
                </div>

                <div className="profile-form-group">
                  <label>Registration Number (Number Plate) *</label>
                  <input
                    type="text"
                    name="regNumber"
                    value={formData.regNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. MH 02 DX 4892"
                    required
                  />
                </div>
              </div>

              <div className="profile-form-row">
                <div className="profile-form-group">
                  <label>Engine (cc)</label>
                  <input
                    type="number"
                    name="cc"
                    value={formData.cc}
                    onChange={handleInputChange}
                    placeholder="e.g. 648"
                  />
                </div>

                <div className="profile-form-group">
                  <label>Model Year</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    placeholder="e.g. 2024"
                  />
                </div>
              </div>

              <div className="profile-form-row">
                <div className="profile-form-group">
                  <label>Odometer (km)</label>
                  <input
                    type="text"
                    name="odometer"
                    value={formData.odometer}
                    onChange={handleInputChange}
                    placeholder="e.g. 14,200 km"
                  />
                </div>

                <div className="profile-form-group">
                  <label>Motorcycle Photo URL</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </div>
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
                  {isSubmitting ? "Saving..." : editingBike ? "Update Machine" : "Add to Garage"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
