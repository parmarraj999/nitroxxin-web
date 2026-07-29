export default function FilterPills({ items, activeItem, onChange }) {
  return (
    <div className="profile-filter-row">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className={`profile-filter-pill${activeItem === item ? " active" : ""}`}
          onClick={() => onChange && onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
