import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";

export default function ProfileOverview() {
  const { user, profile, updateProfile, uploadProfilePhoto, changePassword } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: profile?.fullName || profile?.displayName || user?.displayName || "",
    username: profile?.username || "",
    phone: profile?.phone || "",
    email: profile?.email || user?.email || "",
    password: "",
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      fullName: profile?.fullName || profile?.displayName || user?.displayName || "",
      username: profile?.username || "",
      phone: profile?.phone || "",
      email: profile?.email || user?.email || "",
    }));
  }, [profile, user]);

  const save = async () => {
    try {
      await updateProfile({
        fullName: form.fullName,
        displayName: form.fullName,
        username: form.username,
        phone: form.phone,
      });
      if (form.password) await changePassword(form.password);
      setEditing(false);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <section className="profile-screen">
      <article className="profile-card">
        <div className="profile-card__top">
          <img
            src={profile?.photoURL || user?.photoURL || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80"}
            alt={profile?.fullName || user?.displayName || "Profile"}
            className="profile-avatar"
          />
          <input type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && uploadProfilePhoto(event.target.files[0])} />
          <button type="button" className="edit-btn" onClick={() => editing ? save() : setEditing(true)}>
            <span>&#9998;</span> Edit
          </button>
        </div>
        <div className="profile-card__body">
          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <input placeholder="Full Name" value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} />
              <input placeholder="Username" value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} />
              <input placeholder="Phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
              <input value={form.email} readOnly />
              <input type="password" placeholder="New password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} />
            </div>
          ) : (
            <>
              <h2>{profile?.fullName || profile?.displayName || user?.displayName || "User"}</h2>
              {profile?.username && (
                <p className="profile-username" style={{ color: "#888", fontWeight: "500", fontSize: "13px", marginTop: "2px" }}>
                  @{profile.username}
                </p>
              )}
              <p>{profile?.phone || "No phone added"}</p>
              <p>{profile?.email || user?.email}</p>
              <span>Joined {profile?.createdAt?.toDate ? profile.createdAt.toDate().toLocaleDateString("en-IN") : ""}</span>
            </>
          )}
        </div>
      </article>
    </section>
  );
}
