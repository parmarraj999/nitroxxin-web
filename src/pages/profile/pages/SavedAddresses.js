import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useCollection } from "../../../hooks/useFirestore";
import { db, serverTimestamp } from "../../../services/firebase";

// Fallback demo addresses matching Screenshot 2
const SAMPLE_ADDRESSES = [
  {
    id: "sample-home",
    name: "Raj Parmar",
    type: "Home",
    street: "374/2, Sector C, Shakti Nagar",
    city: "Bhopal",
    state: "Madhya Pradesh",
    pincode: "487001",
    phone: "+91 8869959066",
    isDefault: true,
  },
  {
    id: "sample-work",
    name: "Aman bro",
    type: "Work",
    street: "Plot 45, IT Park, MP Nagar Zone 2",
    city: "Bhopal",
    state: "Madhya Pradesh",
    pincode: "487001",
    phone: "+91 8423482342",
    isDefault: false,
  },
];

export default function SavedAddresses() {
  const { user } = useAuth();
  const { data: firestoreAddresses, loading } = useCollection(
    user?.uid ? `users/${user.uid}/addresses` : null,
    { orderBy: [["createdAt", "desc"]] }
  );

  const [localAddresses, setLocalAddresses] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    type: "Home",
    isDefault: false,
  });

  const addresses = localAddresses || (firestoreAddresses && firestoreAddresses.length > 0
    ? firestoreAddresses
    : SAMPLE_ADDRESSES);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: user?.displayName || user?.fullName || "",
      phone: user?.phoneNumber || user?.phone || "",
      street: "",
      city: "",
      state: "",
      pincode: "",
      type: "Home",
      isDefault: addresses.length === 0,
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.street.trim() || !formData.city.trim()) {
      alert("Please fill in required fields (Name, Street, City).");
      return;
    }

    setIsSubmitting(true);
    const newAddr = {
      id: editingId || `addr-${Date.now()}`,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      street: formData.street.trim(),
      city: formData.city.trim(),
      state: formData.state.trim() || "Madhya Pradesh",
      pincode: formData.pincode.trim() || "487001",
      type: formData.type || "Home",
      isDefault: Boolean(formData.isDefault),
    };

    if (user?.uid) {
      try {
        const colRef = db().collection("users").doc(user.uid).collection("addresses");
        if (newAddr.isDefault) {
          const batch = db().batch();
          addresses.forEach((a) => {
            if (a.id !== editingId) {
              batch.update(colRef.doc(a.id), { isDefault: false });
            }
          });
          await batch.commit();
        }

        if (editingId) {
          await colRef.doc(editingId).update({ ...newAddr, updatedAt: serverTimestamp() });
        } else {
          await colRef.add({ ...newAddr, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        }
      } catch (err) {
        console.error("Firestore address error:", err);
      }
    }

    // Update local state
    setLocalAddresses((prev) => {
      const current = prev || addresses;
      let nextList = [];
      if (editingId) {
        nextList = current.map((a) => (a.id === editingId ? newAddr : a));
      } else {
        nextList = [newAddr, ...current];
      }
      if (newAddr.isDefault) {
        nextList = nextList.map((a) => ({ ...a, isDefault: a.id === newAddr.id }));
      }
      return nextList;
    });

    setIsSubmitting(false);
    setShowModal(false);
  };

  const handleSetDefault = async (addrId) => {
    if (user?.uid) {
      try {
        const colRef = db().collection("users").doc(user.uid).collection("addresses");
        const batch = db().batch();
        addresses.forEach((a) => {
          batch.update(colRef.doc(a.id), { isDefault: a.id === addrId });
        });
        await batch.commit();
      } catch (err) {
        console.error("Failed to update default address in Firestore:", err);
      }
    }

    setLocalAddresses((prev) => {
      const current = prev || addresses;
      return current.map((a) => ({ ...a, isDefault: a.id === addrId }));
    });
  };

  const handleDelete = async (addrId) => {
    if (!window.confirm("Delete this saved address?")) return;
    if (user?.uid) {
      try {
        await db().collection("users").doc(user.uid).collection("addresses").doc(addrId).delete();
      } catch (err) {
        console.error("Failed to delete address:", err);
      }
    }

    setLocalAddresses((prev) => {
      const current = prev || addresses;
      return current.filter((a) => a.id !== addrId);
    });
  };

  return (
    <div className="nx-addr-page-wrap">
      {/* Top Header matching Screenshot 2 */}
      <div className="nx-addr-header">
        <div className="nx-addr-header-left">
          <Link to="/profile" className="nx-addr-back-btn" title="Back to Profile">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <h1 className="nx-addr-title">Saved Addresses</h1>
        </div>

        {/* Plus Button in Circle matching Screenshot 2 */}
        <button
          type="button"
          className="nx-addr-add-circle-btn"
          onClick={handleOpenAdd}
          title="Add New Address"
          aria-label="Add New Address"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {loading && !localAddresses ? (
        <div className="profile-loading-state">
          <div className="profile-spinner" />
          <p>Loading your saved addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="profile-empty-state">
          <h3>No saved addresses</h3>
          <p>Add delivery locations for motorcycle gear and apparel checkout.</p>
          <button type="button" className="profile-btn-primary" onClick={handleOpenAdd}>
            Add Delivery Address
          </button>
        </div>
      ) : (
        /* Responsive Desktop Grid (2 to 3 columns) matching Screenshot 2 */
        <div className="nx-addr-grid">
          {addresses.map((addr) => {
            const isHome = (addr.type || "Home").toLowerCase() === "home";

            return (
              <div
                className={`nx-addr-card${addr.isDefault ? " is-default" : ""}`}
                key={addr.id}
              >
                {/* Top Row: Type Badge + DEFAULT badge on Left, Red Trash on Right */}
                <div className="nx-addr-card-top">
                  <div className="nx-addr-type-group">
                    <div className={`nx-addr-icon-box ${isHome ? "is-home" : "is-work"}`}>
                      {isHome ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                        </svg>
                      )}
                    </div>
                    <span className="nx-addr-type-name">{addr.type || "Home"}</span>
                    {addr.isDefault && (
                      <span className="nx-addr-default-pill">DEFAULT</span>
                    )}
                  </div>

                  {/* Red Delete Trash Icon matching Screenshot 2 */}
                  <button
                    type="button"
                    className="nx-addr-trash-btn"
                    onClick={() => handleDelete(addr.id)}
                    title="Delete Address"
                    aria-label="Delete Address"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>

                {/* Body: Name, Address, Mobile */}
                <div className="nx-addr-card-body">
                  <h3 className="nx-addr-name">{addr.name}</h3>
                  <p className="nx-addr-street-line">
                    {addr.street}
                    {addr.city ? `, ${addr.city}` : ""}
                    {addr.state ? `, ${addr.state}` : ""}
                    {addr.pincode ? ` - ${addr.pincode}` : ""}
                  </p>
                  {addr.phone && (
                    <p className="nx-addr-mobile-line">
                      Mobile: {addr.phone}
                    </p>
                  )}
                </div>

                {/* Bottom Radio Row: Checked or Unchecked matching Screenshot 2 */}
                <div
                  className={`nx-addr-radio-row${addr.isDefault ? " is-active" : ""}`}
                  onClick={() => !addr.isDefault && handleSetDefault(addr.id)}
                >
                  <div className={`nx-addr-radio-circle${addr.isDefault ? " is-checked" : ""}`}>
                    {addr.isDefault && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="nx-addr-radio-text">
                    {addr.isDefault ? "Default Address" : "Set as Default"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      {showModal && (
        <div className="profile-modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>{editingId ? "Edit Address" : "Add New Address"}</h3>
              <button
                type="button"
                className="profile-modal-close"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="profile-modal-form">
              <div className="profile-form-group">
                <label>Contact Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Raj Parmar"
                  required
                />
              </div>

              <div className="profile-form-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+91 8869959066"
                  required
                />
              </div>

              <div className="profile-form-group">
                <label>Street Address / Flat / Building</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="374/2, Sector C, Shakti Nagar"
                  required
                />
              </div>

              <div className="profile-form-row">
                <div className="profile-form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Bhopal"
                    required
                  />
                </div>
                <div className="profile-form-group">
                  <label>State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Madhya Pradesh"
                  />
                </div>
              </div>

              <div className="profile-form-row">
                <div className="profile-form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="487001"
                    required
                  />
                </div>
                <div className="profile-form-group">
                  <label>Address Tag</label>
                  <select name="type" value={formData.type} onChange={handleInputChange}>
                    <option value="Home">Home</option>
                    <option value="Work">Work</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="profile-checkbox-row">
                <input
                  type="checkbox"
                  id="modalIsDefault"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                />
                <label htmlFor="modalIsDefault">Make this my default shipping address</label>
              </div>

              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="profile-btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
