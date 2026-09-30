import { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { useCollection } from "../hooks/useFirestore";
import { COLLECTIONS } from "../services/firebase";
import {
  normalizeBrand,
  normalizeCategory,
  normalizeProduct,
  normalizeSubcategory,
} from "../services/normalizers";

const PAGE_SIZE = 20;

const AccessoriesContext = createContext();

export function AccessoriesProvider({ children }) {
  // Collections for categories, subcategories, brands, bike brands, and banners
  const categoriesQuery = useCollection(COLLECTIONS.categories, { limit: 100 });
  const subcategoriesQuery = useCollection(COLLECTIONS.subcategories, { limit: 300 });
  const brandsQuery = useCollection(COLLECTIONS.brands, { limit: 100 });
  const bikeBrandsQuery = useCollection(COLLECTIONS.bikeBrands, { limit: 100 });
  const bannersQuery = useCollection(COLLECTIONS.banners, { limit: 5 });

  // ── Paginated Product State (Cached in Context to eliminate duplicate Firestore reads) ──
  const [productLimit, setProductLimit] = useState(PAGE_SIZE);
  const productsQuery = useCollection(COLLECTIONS.products, { limit: productLimit });

  const rawProducts = useMemo(
    () => (productsQuery.data || []).map(normalizeProduct),
    [productsQuery.data]
  );

  // Cache products in state so that context preserves items seamlessly
  const [cachedProducts, setCachedProducts] = useState([]);

  useEffect(() => {
    if (rawProducts && rawProducts.length > 0) {
      setCachedProducts(rawProducts);
    }
  }, [rawProducts]);

  const products = cachedProducts.length > 0 ? cachedProducts : rawProducts;
  const productsLoading = productsQuery.loading && products.length === 0;
  const loadingMore = productsQuery.loading && products.length > 0;
  const productsError = productsQuery.error;
  const hasMore = (productsQuery.data || []).length >= productLimit;

  // Fetch next 20 products for pagination
  const fetchMoreProducts = useCallback(() => {
    if (productsQuery.loading || !hasMore) {
      return;
    }
    setProductLimit((prev) => prev + PAGE_SIZE);
  }, [productsQuery.loading, hasMore]);

  // Refetch / reset products if needed
  const refetchProducts = useCallback(() => {
    setProductLimit(PAGE_SIZE);
    if (productsQuery.retry) {
      productsQuery.retry();
    }
  }, [productsQuery]);

  // Normalize other collections
  const categories = useMemo(
    () => (categoriesQuery.data || []).map(normalizeCategory),
    [categoriesQuery.data]
  );
  const subcategories = useMemo(
    () => (subcategoriesQuery.data || []).map(normalizeSubcategory),
    [subcategoriesQuery.data]
  );
  const brands = useMemo(
    () => (brandsQuery.data || []).map(normalizeBrand),
    [brandsQuery.data]
  );
  const bikeBrands = useMemo(
    () => (bikeBrandsQuery.data || []).map(normalizeBrand),
    [bikeBrandsQuery.data]
  );
  const banners = useMemo(() => bannersQuery.data || [], [bannersQuery.data]);

  const value = useMemo(
    () => ({
      products,
      productsLoading,
      productsError,
      loadingMore,
      hasMore,
      fetchMoreProducts,
      refetchProducts,
      pageSize: PAGE_SIZE,

      categories,
      categoriesLoading: categoriesQuery.loading,
      categoriesError: categoriesQuery.error,

      subcategories,
      subcategoriesLoading: subcategoriesQuery.loading,
      subcategoriesError: subcategoriesQuery.error,

      brands,
      brandsLoading: brandsQuery.loading,
      brandsError: brandsQuery.error,

      bikeBrands,
      bikeBrandsLoading: bikeBrandsQuery.loading,
      bikeBrandsError: bikeBrandsQuery.error,

      banners,
      bannersLoading: bannersQuery.loading,
      bannersError: bannersQuery.error,
    }),
    [
      products,
      productsLoading,
      productsError,
      loadingMore,
      hasMore,
      fetchMoreProducts,
      refetchProducts,
      categories,
      categoriesQuery.loading,
      categoriesQuery.error,
      subcategories,
      subcategoriesQuery.loading,
      subcategoriesQuery.error,
      brands,
      brandsQuery.loading,
      brandsQuery.error,
      bikeBrands,
      bikeBrandsQuery.loading,
      bikeBrandsQuery.error,
      banners,
      bannersQuery.loading,
      bannersQuery.error,
    ]
  );

  return (
    <AccessoriesContext.Provider value={value}>
      {children}
    </AccessoriesContext.Provider>
  );
}

export function useAccessoriesContext() {
  const context = useContext(AccessoriesContext);
  if (context === undefined) {
    throw new Error(
      "useAccessoriesContext must be used within an AccessoriesProvider"
    );
  }
  return context;
}
