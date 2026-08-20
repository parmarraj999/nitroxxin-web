import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AccessoriesHeader from "../accessoriesNav/AccessoriesHeader";
import { useDocument } from "../../../hooks/useFirestore";
import { COLLECTIONS } from "../../../services/firebase";
import { normalizeCategory } from "../../../services/normalizers";
import { useAccessoriesContext } from "../../../context/AccessoriesContext";
import "./categoryPage.css";

// Remove inline normalizeSubcategory utility as it is now shared

export default function CategoryPage() {
  const { categoryId } = useParams();
  const [search, setSearch] = useState("");

  const categoryDocQuery = useDocument(COLLECTIONS.categories, categoryId);
  const {
    categories,
    categoriesLoading,
    subcategories: allSubcategoriesContext,
    subcategoriesLoading,
    products: allProductsContext,
    productsLoading,
  } = useAccessoriesContext();

  // Resolve category data
  const category = useMemo(() => {
    // 1. Search in cached categories first
    const searchKey = String(categoryId || "").toLowerCase();
    const found = categories.find(
      (c) =>
        String(c.id || "").toLowerCase() === searchKey ||
        String(c.slug || "").toLowerCase() === searchKey ||
        String(c.label || "").toLowerCase() === searchKey ||
        String(c.name || "").toLowerCase() === searchKey
    );

    if (found) return found;

    // 2. Fallback to categoryDocQuery
    if (categoryDocQuery.data) return normalizeCategory(categoryDocQuery.data);

    // 3. Fallback to basic object
    return {
      id: categoryId,
      label: categoryId ? categoryId.replace(/-/g, " ").toUpperCase() : "Category",
      name: categoryId ? categoryId.replace(/-/g, " ").toUpperCase() : "Category",
      slug: searchKey,
    };
  }, [categoryDocQuery.data, categories, categoryId]);

  // Resolve subcategories belonging to this category
  const subcategories = useMemo(() => {
    if (!category) return [];

    const parentIdKey = String(category.id).toLowerCase();
    const categoryLabelKey = String(category.label || "").toLowerCase();

    // 1. Get from embedded subcategories on the category document (primary source)
    const embedded = category.subcategories || category.subCats || category.subCategories || [];

    // 2. Get from subcategories collection (secondary source)
    const filteredFromCollection = allSubcategoriesContext.filter(
      (subcat) => String(subcat.parentId || "").toLowerCase() === parentIdKey
    );

    let source = [];
    if (embedded.length > 0) {
      source = embedded.map((sub, index) => ({
        id: sub.id || sub.subcategoryId || `${sub.name || sub.label}-${index}`,
        label: sub.name || sub.label || "Sub-category",
        name: sub.name || sub.label || "Sub-category",
        image: sub.imageUrl || sub.image || null,
        parentId: category.id,
      }));
    } else if (filteredFromCollection.length > 0) {
      source = filteredFromCollection;
    } else {
      // 3. Fallback: Extract from products
      const categoryProducts = allProductsContext.filter(
        (p) => {
          const pCat = String(p.category || "").toLowerCase();
          // Match singular/plural and ID
          return (
            pCat === categoryLabelKey ||
            pCat === `${categoryLabelKey}s` ||
            categoryLabelKey === `${pCat}s` ||
            pCat === parentIdKey
          );
        }
      );

      const subcatNames = [...new Set(categoryProducts.map((p) => p.subcategory || p.subCategory).filter(Boolean))];
      source = subcatNames.map((name, index) => {
        const firstProdWithImg = categoryProducts.find((p) => (p.subcategory || p.subCategory) === name && p.image);
        return {
          id: `extracted-${name}-${index}`,
          label: name,
          name: name,
          parentId: category.id,
          image: firstProdWithImg ? firstProdWithImg.image : null,
        };
      });
    }

    const term = search.trim().toLowerCase();
    return source
      .filter((subcat, index, list) => list.findIndex((item) => item.label === subcat.label) === index)
      .filter((subcat) => !term || subcat.label.toLowerCase().includes(term));
  }, [category, allSubcategoriesContext, allProductsContext, search]);

  const banner = category?.bannerUrl || category?.image;

  const isCategoryResolved = categories.some(
    (c) => String(c.id).toLowerCase() === String(categoryId).toLowerCase()
  ) || categoryDocQuery.data;

  const loading = (!isCategoryResolved && categoryDocQuery.loading && categoriesLoading) || subcategoriesLoading || productsLoading;

  return (
    <section className="category-page">
      <AccessoriesHeader showBack search={search} onSearchChange={setSearch} />
      <main className="category-page__container">
        <nav className="category-page__breadcrumb">
          <Link to="/accessories">Home</Link>
          <span>›</span>
          <Link to="/accessories/collection">Collections</Link>
          <span>›</span>
          <span>{category?.label || "Category"}</span>
        </nav>
        <div className="category-page__banner">
          {banner ? (
            <img className="category-page__banner-image" src={banner} alt={category?.label} />
          ) : (
            <div className="category-page__banner-image" style={{ background: "linear-gradient(135deg, #111, #333)" }} />
          )}
          <div className="category-page__overlay">
            <h1 className="category-page__title">{category?.label || "Category"}</h1>
          </div>
        </div>
        {loading ? (
          <div className="category-page__state">Loading subcategories…</div>
        ) : subcategories.length > 0 ? (
          <div className="category-page__grid">
            {subcategories.map((subcat) => {
              const subcatName = subcat.label || subcat.name || subcat.id;
              return (
                <Link
                  key={subcat.id}
                  to={`/accessories?subcategory=${encodeURIComponent(subcatName)}`}
                  className="category-page__card"
                >
                  <div className="category-page__image-box">
                    {subcat.image ? (
                      <img src={subcat.image} alt={subcat.label} className="category-page__subcat-image" loading="lazy" />
                    ) : (
                      <span>{subcat.label.charAt(0)}</span>
                    )}
                  </div>
                  <h2 className="category-page__subcat-name">{subcat.label}</h2>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="category-page__state">Subcategories added to this category in the admin panel will appear here.</div>
        )}
      </main>
    </section>
  );
}
