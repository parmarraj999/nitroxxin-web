import { createContext, useContext, useMemo } from "react";
import { useCollection } from "../hooks/useFirestore";
import { COLLECTIONS } from "../services/firebase";
import {
  normalizeBrand,
  normalizeCategory,
  normalizeProduct,
  normalizeSubcategory,
} from "../services/normalizers";

const AccessoriesContext = createContext();

export function AccessoriesProvider({ children }) {
  // Fetch collections from Firestore with limits aligned with page requirements
  const productsQuery = useCollection(COLLECTIONS.products, { limit: 300 });
  const categoriesQuery = useCollection(COLLECTIONS.categories, { limit: 100 });
  const subcategoriesQuery = useCollection(COLLECTIONS.subcategories, { limit: 300 });
  const brandsQuery = useCollection(COLLECTIONS.brands, { limit: 100 });
  const bikeBrandsQuery = useCollection(COLLECTIONS.bikeBrands, { limit: 100 });
  const bannersQuery = useCollection(COLLECTIONS.banners, { limit: 5 });

  // Normalize data lists
  const products = useMemo(
    () => (productsQuery.data || []).map(normalizeProduct),
    [productsQuery.data]
  );
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
      productsLoading: productsQuery.loading,
      productsError: productsQuery.error,

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
      productsQuery.loading,
      productsQuery.error,
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
