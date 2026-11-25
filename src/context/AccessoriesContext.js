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
const CATALOG_LIMIT = 80;
const CACHE_KEY = "nx_accessories_cache_v2";

const loadCachedAccessories = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY) || localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (_) {}
  return null;
};

const AccessoriesContext = createContext();

export function AccessoriesProvider({ children }) {
  const initialCache = useMemo(() => loadCachedAccessories(), []);

  // Collections for categories, subcategories, brands, bike brands, and banners
  const categoriesQuery = useCollection(COLLECTIONS.categories, { limit: 60 });
  const subcategoriesQuery = useCollection(COLLECTIONS.subcategories, { limit: 100 });
  const brandsQuery = useCollection(COLLECTIONS.brands, { limit: 60 });
  const bikeBrandsQuery = useCollection(COLLECTIONS.bikeBrands, { limit: 60 });
  const bannersQuery = useCollection(COLLECTIONS.banners, { limit: 5 });

  // ── Product Collection (Loads catalog items progressively) ──
  const [productLimit, setProductLimit] = useState(CATALOG_LIMIT);
  const productsQuery = useCollection(COLLECTIONS.products, { limit: productLimit });
  const fallbackProductsQuery = useCollection("products", { limit: productLimit });

  const rawProducts = useMemo(() => {
    const list =
      productsQuery.data && productsQuery.data.length > 0
        ? productsQuery.data
        : fallbackProductsQuery.data && fallbackProductsQuery.data.length > 0
        ? fallbackProductsQuery.data
        : [];

    if (list.length > 0) {
      return list.map(normalizeProduct);
    }
    if (initialCache?.products && initialCache.products.length > 0) {
      return initialCache.products;
    }
    return [];
  }, [productsQuery.data, fallbackProductsQuery.data, initialCache]);

  // Cache products in state so that context preserves items seamlessly
  const [cachedProducts, setCachedProducts] = useState(() => initialCache?.products || []);

  useEffect(() => {
    if (rawProducts && rawProducts.length > 0) {
      setCachedProducts(rawProducts);
    }
  }, [rawProducts]);

  const products = cachedProducts.length > 0 ? cachedProducts : rawProducts;
  const productsLoading = (productsQuery.loading || fallbackProductsQuery.loading) && products.length === 0;
  const loadingMore = (productsQuery.loading || fallbackProductsQuery.loading) && products.length > 0;
  const productsError = productsQuery.error || fallbackProductsQuery.error;
  const hasMore = (productsQuery.data || []).length >= productLimit || (fallbackProductsQuery.data || []).length >= productLimit;

  // Fetch more products if catalog exceeds current limit
  const fetchMoreProducts = useCallback(() => {
    if (productsQuery.loading || fallbackProductsQuery.loading || !hasMore) {
      return;
    }
    setProductLimit((prev) => prev + 80);
  }, [productsQuery.loading, fallbackProductsQuery.loading, hasMore]);

  // Refetch / reset products if needed
  const refetchProducts = useCallback(() => {
    if (productsQuery.retry) {
      productsQuery.retry();
    }
    if (fallbackProductsQuery.retry) {
      fallbackProductsQuery.retry();
    }
  }, [productsQuery, fallbackProductsQuery]);

  // Normalize other collections
  const categories = useMemo(() => {
    if (categoriesQuery.data && categoriesQuery.data.length > 0) {
      return categoriesQuery.data.map(normalizeCategory);
    }
    if (initialCache?.categories && initialCache.categories.length > 0) {
      return initialCache.categories;
    }
    return [];
  }, [categoriesQuery.data, initialCache]);

  const subcategories = useMemo(
    () => (subcategoriesQuery.data || []).map(normalizeSubcategory),
    [subcategoriesQuery.data]
  );

  const brands = useMemo(() => {
    if (brandsQuery.data && brandsQuery.data.length > 0) {
      return brandsQuery.data.map(normalizeBrand);
    }
    if (initialCache?.brands && initialCache.brands.length > 0) {
      return initialCache.brands;
    }
    return [];
  }, [brandsQuery.data, initialCache]);

  const bikeBrands = useMemo(() => {
    if (bikeBrandsQuery.data && bikeBrandsQuery.data.length > 0) {
      return bikeBrandsQuery.data.map(normalizeBrand);
    }
    if (initialCache?.bikeBrands && initialCache.bikeBrands.length > 0) {
      return initialCache.bikeBrands;
    }
    return [];
  }, [bikeBrandsQuery.data, initialCache]);

  const banners = useMemo(() => bannersQuery.data || [], [bannersQuery.data]);

  // Cache synchronization to sessionStorage and localStorage
  useEffect(() => {
    if (products.length > 0 || categories.length > 0 || brands.length > 0) {
      try {
        const payload = {
          products,
          categories,
          brands,
          bikeBrands,
          savedAt: Date.now(),
        };
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
        localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
      } catch (_) {}
    }
  }, [products, categories, brands, bikeBrands]);

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
