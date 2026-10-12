import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { useCollection, useDocument } from "../hooks/useFirestore";
import { COLLECTIONS } from "../services/firebase";

// Color presets for deal cards matching the reference image palette
export const CARD_COLOR_PALETTE = [
  "#2da84e", // Vibrant Emerald Green
  "#c0262b", // Nitroxx Racing Red
  "#1e3a8a", // Deep Racing Blue
  "#d97706", // Sunset Amber Orange
  "#7c3aed", // Royal Violet
  "#18181b", // Carbon Obsidian
];

// Fallback high-value combos matching the reference deal card UI
export const DEFAULT_FALLBACK_COMBOS = [
  {
    id: "combo-starter-touring",
    title: "Grab 25% off on Touring Bundle!",
    subtitle: "Complete protection with Axor Apex helmet, Kevlar gloves & thermal balaclava...",
    badge: "Nitroxx Mart",
    discountText: "25% off",
    color: "#2da84e",
    mergedImageUrl: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80",
    validUntil: "Aug 4 - Aug 31",
    offerPrice: 6897,
    regularPrice: 8397,
    progressLabel: "0 of 8,397 INR",
  },
  {
    id: "combo-urban-commuter",
    title: "Grab 20% off on Urban Armor!",
    subtitle: "CE-Level 2 armored jacket, dual bionic knee guards & magnetic tank bag...",
    badge: "Urban Rider",
    discountText: "20% off",
    color: "#c0262b",
    mergedImageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80",
    validUntil: "Limited Period Deal",
    offerPrice: 10999,
    regularPrice: 13497,
    progressLabel: "0 of 13,497 INR",
  },
  {
    id: "combo-track-racing",
    title: "Flat 30% off on Track Pro Pack!",
    subtitle: "Carbon helmet, Kevlar racing gloves & knee sliders for motorsport enthusiasts...",
    badge: "Track Pro",
    discountText: "30% off",
    color: "#1e3a8a",
    mergedImageUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=600&q=80",
    validUntil: "Weekend Flash Deal",
    offerPrice: 16499,
    regularPrice: 23599,
    progressLabel: "0 of 23,599 INR",
  },
  {
    id: "combo-monsoon-weather",
    title: "Save 15% on All-Weather Pack!",
    subtitle: "Waterproof boots, seam-sealed rain suit & 45L luggage tail bag...",
    badge: "All-Weather",
    discountText: "15% off",
    color: "#d97706",
    mergedImageUrl: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=600&q=80",
    validUntil: "Monsoon Special",
    offerPrice: 8299,
    regularPrice: 9799,
    progressLabel: "0 of 9,799 INR",
  },
];

const ForYouContext = createContext(null);

export function ForYouProvider({ children }) {
  // 1. Fetch page_layouts > for_you document
  const layoutQuery = useDocument("page_layouts", "for_you");

  // Keep cached copy of layout data so it persists seamlessly even during transitions
  const [cachedLayout, setCachedLayout] = useState(null);

  useEffect(() => {
    if (layoutQuery.data) {
      setCachedLayout(layoutQuery.data);
    }
  }, [layoutQuery.data]);

  const layoutData = cachedLayout || layoutQuery.data;
  const banners = useMemo(() => layoutData?.banners || [], [layoutData]);
  const categories = useMemo(() => layoutData?.categories || [], [layoutData]);

  // 2. Combo collections and layout configurations
  const liveCombosQuery = useCollection(COLLECTIONS.combo || "combo");
  const pluralCombosQuery = useCollection("combos");
  const primaryLayoutQuery = useDocument("page_layouts", "accessories_layout");
  const fallbackLayoutQuery = useDocument("page_layouts", "accessories");
  const singularLayoutQuery = useDocument("page_layout", "accessories_layout");

  // Normalized active combos
  const combos = useMemo(() => {
    const liveCombos = liveCombosQuery.data || [];
    const pluralCombos = pluralCombosQuery.data || [];
    const primaryLayout = primaryLayoutQuery.data;
    const fallbackLayout = fallbackLayoutQuery.data;
    const singularLayout = singularLayoutQuery.data;

    const activeFirestoreList = liveCombos.length > 0 ? liveCombos : pluralCombos;
    if (activeFirestoreList && activeFirestoreList.length > 0) {
      return activeFirestoreList.map((c, idx) => {
        const title =
          c.categoryName ||
          c.title ||
          c.name ||
          c.comboCategory ||
          c.comboName ||
          `Combo Pack ${idx + 1}`;
        const subtitle = c.subtitle || c.description || c.details || "";
        const image =
          c.mergedImageUrl ||
          c.image ||
          c.imageUrl ||
          c.bannerUrl ||
          c.banner ||
          c.mixedImage ||
          c.coverImage ||
          c.thumbnail ||
          "";
        const discountText =
          c.discountText ||
          (c.discount ? `${c.discount}% off` : "") ||
          (c.discountPercent ? `${c.discountPercent}% off` : "");
        const badge =
          c.badge ||
          c.tag ||
          (c.discount ? `${c.discount}% OFF` : "Nitroxx Special");
        const color =
          c.color ||
          c.bgColor ||
          CARD_COLOR_PALETTE[idx % CARD_COLOR_PALETTE.length];

        return {
          id: c.id,
          ...c,
          title,
          subtitle,
          mergedImageUrl: image,
          discountText,
          badge,
          color,
          validUntil: c.validUntil || c.validity || "Limited Period Deal",
          offerPrice: c.offerPrice || c.dealPrice || c.price,
          regularPrice: c.regularPrice || c.mrp || c.originalPrice,
        };
      });
    }

    const raw =
      primaryLayout?.combos ||
      fallbackLayout?.combos ||
      singularLayout?.combos ||
      [];

    if (Array.isArray(raw) && raw.length > 0) {
      const valid = raw.filter((c) => c && (c.title || c.name || c.categoryName));
      if (valid.length > 0) {
        return valid.map((c, idx) => ({
          ...c,
          title: c.title || c.name || c.categoryName || `Combo Deal ${idx + 1}`,
          color: c.color || c.bgColor || CARD_COLOR_PALETTE[idx % CARD_COLOR_PALETTE.length],
          mergedImageUrl:
            c.mergedImageUrl ||
            c.image ||
            c.bannerUrl ||
            c.banner ||
            c.imageUrl ||
            c.mixedImage,
        }));
      }
    }

    return DEFAULT_FALLBACK_COMBOS;
  }, [
    liveCombosQuery.data,
    pluralCombosQuery.data,
    primaryLayoutQuery.data,
    fallbackLayoutQuery.data,
    singularLayoutQuery.data,
  ]);

  const combosLoading =
    (liveCombosQuery.loading || pluralCombosQuery.loading) && combos.length === 0;

  const refetchLayout = useCallback(() => {
    if (layoutQuery.retry) {
      layoutQuery.retry();
    }
  }, [layoutQuery]);

  const value = useMemo(
    () => ({
      layoutData,
      banners,
      categories,
      combos,
      combosLoading,
      loading: layoutQuery.loading && !layoutData,
      layoutLoading: layoutQuery.loading,
      layoutError: layoutQuery.error,
      refetchLayout,
    }),
    [
      layoutData,
      banners,
      categories,
      combos,
      combosLoading,
      layoutQuery.loading,
      layoutQuery.error,
      refetchLayout,
    ]
  );

  return <ForYouContext.Provider value={value}>{children}</ForYouContext.Provider>;
}

export function useForYouContext() {
  const context = useContext(ForYouContext);
  if (context === undefined) {
    throw new Error("useForYouContext must be used within a ForYouProvider");
  }
  return context;
}

export default ForYouContext;
