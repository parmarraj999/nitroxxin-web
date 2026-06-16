import FilterPills from "../components/FilterPills";

export default function Wallet() {
  return (
    <section className="profile-screen profile-screen--narrow">
      <h1>My Wallet</h1>
      <article className="wallet-balance">
        <p>Available Balance</p>
        <strong>&#8377;500</strong>
        <div>
          <button type="button">+ Add Money</button>
          <button type="button">&#8599; Transfer</button>
        </div>
      </article>
      <div className="profile-divider" />
      <FilterPills items={["All", "Credit", "Debit"]} />
      <div className="wallet-list">
        <article className="wallet-row">
          <span className="wallet-icon">+</span>
          <div>
            <h3>Fund Added</h3>
            <p>16 Jan 2026</p>
          </div>
          <strong className="credit">$1400</strong>
        </article>
        <article className="wallet-row">
          <span className="wallet-icon">&#8599;</span>
          <div>
            <h3>Money Transfered</h3>
            <p>16 Jan 2026</p>
          </div>
          <strong className="debit">$1400</strong>
        </article>
      </div>
    </section>
  );
}
