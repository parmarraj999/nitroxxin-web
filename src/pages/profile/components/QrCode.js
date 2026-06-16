export default function QrCode() {
  return (
    <div className="profile-qr" aria-label="Ticket QR code">
      {Array.from({ length: 36 }).map((_, index) => (
        <span
          key={index}
          className={index % 2 === 0 || index % 5 === 0 ? "filled" : ""}
        />
      ))}
    </div>
  );
}
