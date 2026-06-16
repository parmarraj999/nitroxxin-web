import "./additionalInfo.css";

const rows = [
  { key: "Riding Type", value: "Touring" },
  { key: "Brand", value: "AXOR" },
  { key: "Collection", value: "Axor Apex" },
  { key: "Material", value: "IMPS- Injection moulded Polycarbonate shell" },
  { key: "Color", value: "Black" },
  { key: "Warrenty", value: "1 Year" },
];

export function AdditionalInfo() {
  return (
    <div className="additional-info">
      <h3 className="additional-info__title">Additional Information</h3>
      {rows.map((row) => (
        <div key={row.key} className="additional-info__row">
          <span className="additional-info__key">{row.key}</span>
          <span className="additional-info__value">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
