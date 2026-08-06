import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AccessoriesHeader from "../accessoriesNav/AccessoriesHeader";
import { useDocument } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";
import { normalizeBrand } from "../../../services/normalizers";
import { useAccessoriesContext } from "../../../context/AccessoriesContext";
import "./bikeBrandPage.css";

// Default bike models catalog for popular brands if no models in Firestore yet
const DEFAULT_BRAND_MODELS = {
  hero: [
    { id: "xpulse-210", label: "XPULSE 210", image: "/images/xpulse210.png" },
    { id: "mavrick-440", label: "MAVRICK 440", image: "/images/mavrick440.png" },
    { id: "xpulse-200", label: "XPULSE 200", image: "/images/xpulse200.png" },
  ],
  "royal-enfield": [
    { id: "himalayan-450", label: "HIMALAYAN 450", image: "/images/himalayan450.png" },
    { id: "hunter-350", label: "HUNTER 350", image: "/images/hunter350.png" },
    { id: "gt-650", label: "CONTINENTAL GT 650", image: "/images/gt650.png" },
    { id: "classic-350", label: "CLASSIC 350", image: "/images/classic350.png" },
  ],
  triumph: [
    { id: "speed-400", label: "SPEED 400", image: "/images/speed400.png" },
    { id: "scrambler-400x", label: "SCRAMBLER 400X", image: "/images/scrambler400x.png" },
    { id: "daytona-660", label: "DAYTONA 660", image: "/images/daytona660.png" },
  ],
  honda: [
    { id: "cb350", label: "CB350", image: "/images/cb350.png" },
    { id: "nx500", label: "NX500", image: "/images/nx500.png" },
    { id: "hness-cb350", label: "H'NESS CB350", image: "/images/hness350.png" },
  ],
  ktm: [
    { id: "duke-390", label: "DUKE 390", image: "/images/duke390.png" },
    { id: "adv-390", label: "ADV 390", image: "/images/adv390.png" },
    { id: "rc-390", label: "RC 390", image: "/images/rc390.png" },
  ],
  bmw: [
    { id: "g310gs", label: "G 310 GS", image: "/images/g310gs.png" },
    { id: "s1000rr", label: "S 1000 RR", image: "/images/s1000rr.png" },
    { id: "r1250gs", label: "R 1250 GS", image: "/images/r1250gs.png" },
  ],
};

const asModel = (item, index) => {
  const data = typeof item === "string" ? { name: item } : item;
  return {
    id: data.id || data.modelId || data.categoryId || `${data.name || data.label}-${index}`,
    label: data.name || data.label || data.title || "Model",
    image: data.image || data.imageUrl || data.thumbnail || null,
    categoryId: data.categoryId || data.subcategoryId || data.id,
  };
};

export default function BikeBrandPage() {
  const { brandId } = useParams();
  const [search, setSearch] = useState("");

  const brandDocQuery = useDocument(COLLECTIONS.brands, brandId);
  const bikeBrandDocQuery = useDocument(COLLECTIONS.bikeBrands, brandId);
  const {
    brands,
    brandsLoading,
    bikeBrands,
    bikeBrandsLoading,
    categories,
    subcategories,
    products,
  } = useAccessoriesContext();

  // Resolve brand data
  const brand = useMemo(() => {
    // 1. Check in cached brands first
    const searchKey = String(brandId || "").toLowerCase();
    const allBrands = [...brands, ...bikeBrands];
    const found = allBrands.find(
      (b) =>
        String(b.id || "").toLowerCase() === searchKey ||
        String(b.slug || "").toLowerCase() === searchKey ||
        String(b.label || "").toLowerCase() === searchKey ||
        String(b.name || "").toLowerCase() === searchKey
    );

    if (found) return found;

    // 2. Fallback to doc queries
    if (brandDocQuery.data) return normalizeBrand(brandDocQuery.data);
    if (bikeBrandDocQuery.data) return normalizeBrand(bikeBrandDocQuery.data);

    // 3. Basic fallback
    return {
      id: brandId,
      label: brandId ? brandId.replace(/-/g, " ").toUpperCase() : "Brand",
      name: brandId ? brandId.replace(/-/g, " ").toUpperCase() : "Brand",
      slug: searchKey,
    };
  }, [brandDocQuery.data, bikeBrandDocQuery.data, brands, bikeBrands, brandId]);

  const models = useMemo(() => {
    if (!brand) return [];
    const keys = [brand.id, brand.label, brand.name, brand.slug]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    // 1. Embedded models/bikes on brand doc
    const embedded = [brand.models, brand.bikes, brand.vehicles, brand.bikeModels].find(Array.isArray) || [];

    // 2. Linked subcategories / categories
    const allCats = [...categories, ...subcategories];
    const linked = allCats.filter((item) =>
      keys.some((k) =>
        [item.brandId, item.brand, item.parentBrandId, item.bikeBrand, item.parentId]
          .map((v) => String(v || "").toLowerCase())
          .includes(k)
      )
    );

    // 3. Extract models from products
    const productModels = products
      .filter((product) =>
        keys.some((k) =>
          [product.brandId, product.brand, product.bikeBrand, product.compatibility]
            .map((v) => String(v || "").toLowerCase())
            .includes(k)
        )
      )
      .map((product) => ({
        id: product.id,
        label: product.bikeModel || product.model || product.name,
        image: product.image,
        categoryId: product.categoryId || product.id,
      }));

    // 4. Default fallback models for known brand slugs/keys
    let fallback = [];
    for (const key of keys) {
      const normalizedKey = key.replace(/\s+/g, "-");
      if (DEFAULT_BRAND_MODELS[normalizedKey]) {
        fallback = DEFAULT_BRAND_MODELS[normalizedKey];
        break;
      }
      if (DEFAULT_BRAND_MODELS[key]) {
        fallback = DEFAULT_BRAND_MODELS[key];
        break;
      }
    }

    let source = [];
    if (embedded.length) {
      source = embedded.map(asModel);
    } else if (linked.length) {
      source = linked.map(asModel);
    } else if (productModels.length) {
      source = productModels;
    } else {
      source = fallback.map(asModel);
    }

    const term = search.trim().toLowerCase();
    return source
      .filter((model, index, list) => list.findIndex((item) => item.label === model.label) === index)
      .filter((model) => !term || model.label.toLowerCase().includes(term));
  }, [brand, categories, subcategories, products, search]);

  const banner = brand?.bannerUrl;
  const isBrandResolved = [...brands, ...bikeBrands].some(
    (b) => String(b.id).toLowerCase() === String(brandId).toLowerCase()
  ) || brandDocQuery.data || bikeBrandDocQuery.data;

  const loading =
    !isBrandResolved &&
    brandDocQuery.loading &&
    bikeBrandDocQuery.loading &&
    brandsLoading &&
    bikeBrandsLoading;

  return (
    <section className="brand-page">
      <AccessoriesHeader showBack search={search} onSearchChange={setSearch} />
      <main className="brand-page__container">
        <nav className="brand-page__breadcrumb">
          <Link to="/accessories">Home</Link>
          <span>›</span>
          <Link to="/accessories/brands">Brands</Link>
          <span>›</span>
          <span>{brand?.label || "Brand"}</span>
        </nav>
        <div className="brand-page__banner">
          {banner ? (
            <img className="brand-page__banner-image" src={banner} alt={brand?.label} />
          ) : (
            <div className="brand-page__banner-image" style={{ background: "linear-gradient(135deg, #111, #333)" }} />
          )}
          <div className="brand-page__overlay">
            <h1 className="brand-page__title">{brand?.label || "Brand"}</h1>
          </div>
        </div>
        {loading ? (
          <div className="brand-page__state">Loading models…</div>
        ) : models.length > 0 ? (
          <div className="brand-page__grid">
            {models.map((model) => {
              const bikeName = model.label || model.name || model.id;
              return (
                <Link
                  key={model.id}
                  to={`/accessories?bike=${encodeURIComponent(bikeName)}`}
                  className="brand-page__card"
                >
                  <div className="brand-page__image-box">
                    {model.image ? (
                      <img src={model.image} alt={model.label} className="brand-page__bike-image" loading="lazy" />
                    ) : (
                      <span>{model.label.charAt(0)}</span>
                    )}
                  </div>
                  <h2 className="brand-page__bike-name">{model.label}</h2>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="brand-page__state">Models added to this brand in the admin panel will appear here.</div>
        )}
      </main>
    </section>
  );
}

