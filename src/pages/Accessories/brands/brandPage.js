import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AccessoriesHeader from "../accessoriesNav/AccessoriesHeader";
import { useAccessoriesContext } from "../../../context/AccessoriesContext";
import "./brandPage.css";

export default function BrandPage() {
  const [search, setSearch] = useState("");
  const { brands: cachedBrands, brandsLoading: loading } = useAccessoriesContext();

  const brands = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cachedBrands.filter((brand) => !term || brand.label.toLowerCase().includes(term));
  }, [cachedBrands, search]);

  return (
    <section className="brands-page">
      <AccessoriesHeader showBack search={search} onSearchChange={setSearch} />
      <main className="brands-page__container">
        <nav className="brands-page__breadcrumb" aria-label="Breadcrumb">
          <Link to="/accessories">Accessories</Link><span>›</span><span>Brands</span>
        </nav>
        <div className="brands-page__heading">
          <h1>SHOP BY BRAND</h1>
          <p>Choose your brand to find accessories made for your ride.</p>
        </div>

        {loading ? (
          <div className="brands-page__state">Loading brands…</div>
        ) : brands.length ? (
          <div className="brands-page__grid">
            {brands.map((brand) => (
              <Link key={brand.id} to={`/accessories/brands/${brand.id}`} className="brands-page__card">
                <div className="brands-page__image">
                  {brand.image ? <img src={brand.image} alt={brand.alt || brand.label} loading="lazy" /> : <span>{brand.label.charAt(0)}</span>}
                </div>
                <h2>{brand.label}</h2>
              </Link>
            ))}
          </div>
        ) : (
          <div className="brands-page__state">
            {search ? `No brands match “${search}”.` : "Brands added in the admin panel will appear here."}
          </div>
        )}
      </main>
    </section>
  );
}
