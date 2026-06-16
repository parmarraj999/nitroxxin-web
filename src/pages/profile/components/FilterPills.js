export default function FilterPills({ items }) {
  return (
    <div className="profile-filter-row">
      {items.map((item, index) => (
        <button
          key={item}
          type="button"
          className={`profile-filter-pill${index === 0 ? " active" : ""}`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
