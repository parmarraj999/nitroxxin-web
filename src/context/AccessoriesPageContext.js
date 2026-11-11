import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { useDocument } from "../hooks/useFirestore";
import { useAccessoriesContext } from "./AccessoriesContext";
import { useBikeBrandsContext } from "./BikeBrandsContext";
import { useForYouContext } from "./ForYouContext";
import { isFeatureForYou } from "../services/normalizers";

const CACHE_KEY = "nx_accessories_page_cache_v1";

// Default fallback hero slides if database is empty or loading
export const DEFAULT_SLIDES = [
  {
    id: "stop-dressing-broke",
    image: "/assets/images/banner-streetwear-clean.png",
    alt: "Stop Dressing Broke - Upto 50% off",
    badge: "UP TO 70% OFF",
    title: "Stop Dressing Broke",
    tagline: "Upto 50% off",
    link: "#shop",
    hasOverlayText: false,
  },
  {
    id: "streetwear-hd",
    image: "/assets/images/banner-streetwear-hd.jpg",
    alt: "Streetwear & Moto Fusion",
    badge: "NEW DROP",
    title: "STREETWEAR MEETS ASPHALT",
    tagline: "Exclusive Nitroxx Hoodies & Jackets • Upto 50% off",
    link: "#shop",
    hasOverlayText: true,
  },
  {
    id: "rider-gear",
    image: "/assets/images/banner-1.jpeg",
    alt: "Dominate Every Ride",
    badge: "FEATURED",
    title: "DOMINATE EVERY RIDE",
    tagline: "High-Performance Helmets & Protective Riding Gear",
    link: "#shop",
    hasOverlayText: true,
  },
];

// In-memory module-level cache that persists across unmounts / page navigations
let inMemoryCache = (() => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (_) {}
  return null;
})();

export const mapHeroSlides = (layoutData, banners = []) => {
  const rawList =
    layoutData?.banners ||
    layoutData?.data?.banners ||
    (Array.isArray(banners) && banners.length > 0 ? banners : null);

  const bannerList = Array.isArray(rawList)
    ? rawList
    : rawList && typeof rawList === "object"
    ? Object.values(rawList)
    : [];

  const heroSlidesList =
    layoutData?.heroSlides ||
    layoutData?.data?.heroSlides ||
    [];

  const validBanners = bannerList.filter(
    (b) => b && (b.imageUrl || b.image || b.bannerUrl || b.banner)
  );

  const sourceList =
    validBanners.length > 0
      ? validBanners
      : Array.isArray(heroSlidesList)
      ? heroSlidesList.filter((s) => s && (s.imageUrl || s.image || s.bannerUrl || s.banner))
      : [];

  const mappedSlides = sourceList.map((b, idx) => {
    const image = b.imageUrl || b.image || b.bannerUrl || b.banner;
    const title = b.title || b.productName || b.name || "";
    const badge = b.badge || b.tag || "FEATURED";

    const matchingSlide = Array.isArray(heroSlidesList)
      ? heroSlidesList.find(
          (s) =>
            (b.productId && s?.productId === b.productId) ||
            (title && s?.title === title)
        )
      : null;

    let tagline =
      b.subtitle ||
      b.tagline ||
      b.description ||
      b.subTitle ||
      matchingSlide?.subtitle ||
      matchingSlide?.description ||
      "";

    if (!tagline && b.brand) {
      tagline = b.price
        ? `${b.brand} • ₹${Number(b.price).toLocaleString("en-IN")}`
        : b.brand;
    }

    let link = b.redirectUrl || b.link || b.url || "";
    if (!link && b.productId) {
      link = `/products/details/${b.productId}`;
    }
    if (!link) {
      link = "#shop";
    }

    return {
      id: b.id || b.productId || `dyn-banner-${idx}`,
      image,
      alt: b.alt || title || "Nitroxx accessories banner",
      title,
      tagline,
      link,
      badge,
      hasOverlayText:
        b.hasOverlayText !== undefined
          ? Boolean(b.hasOverlayText)
          : Boolean(title || tagline || badge),
    };
  });

  return mappedSlides.length > 0 ? mappedSlides : DEFAULT_SLIDES;
};

const AccessoriesPageContext = createContext(null);

export function AccessoriesPageProvider({ children }) {
  // Underlying base context queries
  const {
    products = [],
    categories = [],
    brands = [],
    bikeBrands = [],
    banners = [],
    productsLoading,
    categoriesLoading,
    brandsLoading,
  } = useAccessoriesContext();

  const { bikeBrands: fetchedBikeBrands } = useBikeBrandsContext();
  const { combos = [] } = useForYouContext();

  // Fetch page layout for accessories banner slider
  const singularDocQuery = useDocument("page_layout", "accessories_layout");
  const pluralDocQuery = useDocument("page_layouts", "accessories_layout");
  const fallbackDocQuery = useDocument("page_layouts", "accessories");
  const layoutData =
    singularDocQuery.data || pluralDocQuery.data || fallbackDocQuery.data || null;

  // Persistent cache state initialized from in-memory or sessionStorage
  const [cachedState, setCachedState] = useState(() => inMemoryCache || {});

  // Compute live active products
  const liveProducts = useMemo(() => {
    if (products && products.length > 0) {
      return products.filter((p) =>
        ["published", "active", "approved"].includes(p.status)
      );
    }
    return cachedState.liveProducts || [];
  }, [products, cachedState.liveProducts]);

  // Compute display categories
  const displayCategories = useMemo(() => {
    if (categories && categories.length > 0) return categories;
    return cachedState.displayCategories || [];
  }, [categories, cachedState.displayCategories]);

  // Compute display brands
  const displayBrands = useMemo(() => {
    if (brands && brands.length > 0) {
      return brands.filter(
        (b) =>
          (b.image || b.imageUrl || b.logo || b.logoUrl || b.label || b.name) &&
          isFeatureForYou(b)
      );
    }
    return cachedState.displayBrands || [];
  }, [brands, cachedState.displayBrands]);

  // Compute display bike brands
  const displayBikeBrands = useMemo(() => {
    if (fetchedBikeBrands && fetchedBikeBrands.length > 0) {
      return fetchedBikeBrands;
    }
    if (bikeBrands && bikeBrands.length > 0) {
      return bikeBrands;
    }
    return cachedState.displayBikeBrands || [];
  }, [fetchedBikeBrands, bikeBrands, cachedState.displayBikeBrands]);

  // Compute mapped hero slides
  const slides = useMemo(() => {
    if (layoutData || (banners && banners.length > 0)) {
      return mapHeroSlides(layoutData, banners);
    }
    return cachedState.slides || DEFAULT_SLIDES;
  }, [layoutData, banners, cachedState.slides]);

  // Keep in-memory cache and sessionStorage continuously updated whenever new data arrives
  const isInitialLoadRef = useRef(true);
  useEffect(() => {
    const hasAnyData =
      displayCategories.length > 0 ||
      displayBikeBrands.length > 0 ||
      displayBrands.length > 0 ||
      liveProducts.length > 0 ||
      (slides && slides.length > 0 && slides !== DEFAULT_SLIDES) ||
      (combos && combos.length > 0);

    if (hasAnyData) {
      const nextCache = {
        displayCategories,
        displayBikeBrands,
        displayBrands,
        liveProducts,
        slides,
        banners,
        combos,
        layoutData,
        timestamp: Date.now(),
      };
      inMemoryCache = nextCache;
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(nextCache));
      } catch (_) {}
      if (isInitialLoadRef.current) {
        setCachedState(nextCache);
        isInitialLoadRef.current = false;
      }
    }
  }, [
    displayCategories,
    displayBikeBrands,
    displayBrands,
    liveProducts,
    slides,
    banners,
    combos,
    layoutData,
  ]);

  // Determine if we have any data (cached or live)
  const hasData =
    displayCategories.length > 0 ||
    displayBikeBrands.length > 0 ||
    displayBrands.length > 0 ||
    liveProducts.length > 0;

  // True only if there is genuinely no data yet and queries are still loading
  const loading = !hasData && (productsLoading || categoriesLoading || brandsLoading);

  const refreshData = useCallback(() => {
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (_) {}
    inMemoryCache = null;
    if (singularDocQuery.retry) singularDocQuery.retry();
    if (pluralDocQuery.retry) pluralDocQuery.retry();
  }, [singularDocQuery, pluralDocQuery]);

  const value = useMemo(
    () => ({
      // Main Display Collections
      categories: displayCategories,
      displayCategories,
      bikeBrands: displayBikeBrands,
      displayBikeBrands,
      brands: displayBrands,
      displayBrands,
      banners,
      slides,
      heroSlides: slides,
      layoutData,
      liveProducts,
      products,
      combos,

      // State and Refresh
      loading,
      isLoaded: hasData,
      refreshData,
      refetch: refreshData,
    }),
    [
      displayCategories,
      displayBikeBrands,
      displayBrands,
      banners,
      slides,
      layoutData,
      liveProducts,
      products,
      combos,
      loading,
      hasData,
      refreshData,
    ]
  );

  return (
    <AccessoriesPageContext.Provider value={value}>
      {children}
    </AccessoriesPageContext.Provider>
  );
}

export function useAccessoriesPageContext() {
  const context = useContext(AccessoriesPageContext);
  if (!context) {
    // Graceful fallback to in-memory cache if used without provider
    return {
      categories: inMemoryCache?.displayCategories || [],
      displayCategories: inMemoryCache?.displayCategories || [],
      bikeBrands: inMemoryCache?.displayBikeBrands || [],
      displayBikeBrands: inMemoryCache?.displayBikeBrands || [],
      brands: inMemoryCache?.displayBrands || [],
      displayBrands: inMemoryCache?.displayBrands || [],
      banners: inMemoryCache?.banners || [],
      slides: inMemoryCache?.slides || DEFAULT_SLIDES,
      heroSlides: inMemoryCache?.slides || DEFAULT_SLIDES,
      layoutData: inMemoryCache?.layoutData || null,
      liveProducts: inMemoryCache?.liveProducts || [],
      products: [],
      combos: inMemoryCache?.combos || [],
      loading: false,
      isLoaded: true,
      refreshData: () => {},
      refetch: () => {},
    };
  }
  return context;
}

export const useAccessoriesPage = useAccessoriesPageContext;
export default AccessoriesPageContext;
