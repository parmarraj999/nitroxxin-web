import React, { createContext, useContext, useMemo } from "react";
import { useCollection } from "../hooks/useFirestore";
import { COLLECTIONS } from "../services/firebase";
import { firstImage } from "../utils/dataFormatters";

const BikeBrandsContext = createContext();

export const normalizeBikeBrand = (doc) => {
  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id || data.brandId || "";
  const label =
    data.label ||
    data.name ||
    data.brandName ||
    data.brand ||
    data.title ||
    data.bikeBrand ||
    "Bike Brand";
  const image =
    data.logo ||
    data.logoUrl ||
    data.image ||
    data.imageUrl ||
    data.icon ||
    data.iconUrl ||
    data.brandLogo ||
    data.photo ||
    data.photoURL ||
    firstImage(data) ||
    "";

  return {
    ...data,
    id,
    label,
    name: label,
    image,
    logo: image,
    status: String(data.status || "active").toLowerCase(),
  };
};

export function BikeBrandsProvider({ children }) {
  // Fetch from the collection "bike_brands"
  const collectionName = COLLECTIONS.bikeBrands || "bike_brands";
  const bikeBrandsQuery = useCollection(collectionName, { limit: 100 });

  const bikeBrands = useMemo(() => {
    return (bikeBrandsQuery.data || [])
      .map(normalizeBikeBrand)
      .filter((b) => b.status !== "inactive" && b.status !== "deleted");
  }, [bikeBrandsQuery.data]);

  const value = useMemo(
    () => ({
      bikeBrands,
      bikeBrandsLoading: bikeBrandsQuery.loading,
      bikeBrandsError: bikeBrandsQuery.error,
      retry: bikeBrandsQuery.retry,
    }),
    [bikeBrands, bikeBrandsQuery.loading, bikeBrandsQuery.error, bikeBrandsQuery.retry]
  );

  return (
    <BikeBrandsContext.Provider value={value}>
      {children}
    </BikeBrandsContext.Provider>
  );
}

export function useBikeBrandsContext() {
  const context = useContext(BikeBrandsContext);
  if (context === undefined) {
    throw new Error(
      "useBikeBrandsContext must be used within a BikeBrandsProvider"
    );
  }
  return context;
}

export const useBikeBrands = useBikeBrandsContext;
