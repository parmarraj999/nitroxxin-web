import { COLLECTIONS, db } from "./firebase";

/**
 * Checks whether a given vendor ID is a generic Nitroxx fallback/placeholder.
 */
export const isPlaceholderVendorId = (id) => {
  if (!id || typeof id !== "string") return true;
  const lower = id.trim().toLowerCase();
  return (
    lower === "" ||
    lower === "nitroxx-default-vendor" ||
    lower === "nitroxx-vendor" ||
    lower === "nitroxx" ||
    lower === "nitroxxi" ||
    lower === "default-vendor" ||
    lower === "default" ||
    lower === "no_vendor" ||
    lower === "undefined" ||
    lower === "null" ||
    lower.startsWith("nitroxx-default") ||
    lower.startsWith("nitroxx-vendor")
  );
};

/**
 * Extracts candidate vendor ID from an object checking all standard field variations.
 */
export const extractVendorIdFromData = (data) => {
  if (!data || typeof data !== "object") return "";
  const rawId =
    data.vendorId ||
    data.vendor_id ||
    data.vendor?.id ||
    data.vendor?.vendorId ||
    data.vendor?.uid ||
    data.sellerId ||
    data.seller_id ||
    data.seller?.id ||
    data.ownerId ||
    data.userId ||
    data.createdBy ||
    "";

  if (typeof rawId === "string") return rawId.trim();
  if (rawId && typeof rawId.toString === "function") return rawId.toString().trim();
  return "";
};

/**
 * Extracts candidate vendor display name from an object checking all standard field variations.
 */
export const extractVendorNameFromData = (data, fallback = "") => {
  if (!data || typeof data !== "object") return fallback;
  const name =
    data.businessDetails?.businessName ||
    data.businessDetails?.storeName ||
    data.brandInformation?.brandName ||
    data.displayName ||
    data.vendorName ||
    data.vendor?.name ||
    data.vendor?.businessName ||
    data.storeName ||
    data.shopName ||
    data.businessName ||
    data.brand ||
    data.brandName ||
    fallback;

  return typeof name === "string" && name.trim() ? name.trim() : fallback;
};

// In-memory cache for fast deduplication across batch operations
const memoryVendorCache = new Map();
const memoryProductCache = new Map();

/**
 * Resolves the genuine real vendor ID and vendor Name for a cart item or product.
 *
 * Steps:
 * 1. Check if the item already carries a valid non-placeholder vendorId.
 * 2. If not, fetch the product document from Firestore 'product-collection' by productId.
 * 3. Inspect the product document for all vendor ID field variations.
 * 4. If product document lacks vendorId, attempt to match vendor in 'vendors' collection
 *    by brand name or business name.
 * 5. If still unassigned, query active registered vendors in 'vendors' collection.
 * 6. Query the resolved vendor's profile in 'vendors' collection to retrieve their real business name.
 */
export const resolveRealVendorForItem = async (item, firestoreInstance = null) => {
  if (!item) {
    return { vendorId: "", vendorName: "Authorized Vendor" };
  }

  const database = firestoreInstance || db();

  // Clean productId (removes options suffix like _M_Red or _default)
  const rawProdId =
    item.productId ||
    item.product?.productId ||
    item.product?.id ||
    item.productSnapshot?.productId ||
    item.productSnapshot?.id ||
    item.id ||
    "";
  const cleanProductId = String(rawProdId).split("_")[0].trim();

  // Tier 1: Check if item already has a verified real vendor ID
  let candidateVendorId = extractVendorIdFromData(item);
  let candidateVendorName = extractVendorNameFromData(item, "");

  // If candidate is a placeholder, discard it
  if (isPlaceholderVendorId(candidateVendorId)) {
    candidateVendorId = "";
  }

  // Tier 2: Fetch product document from Firestore 'product-collection'
  let productData = null;
  if ((!candidateVendorId || candidateVendorId === "") && cleanProductId) {
    try {
      if (memoryProductCache.has(cleanProductId)) {
        productData = memoryProductCache.get(cleanProductId);
      } else {
        const prodDocRef = database.collection(COLLECTIONS.products || "product-collection").doc(cleanProductId);
        const prodSnap = await prodDocRef.get();
        if (prodSnap && prodSnap.exists) {
          productData = prodSnap.data();
          memoryProductCache.set(cleanProductId, productData);
        }
      }
    } catch (err) {
      console.warn(`[vendorResolver] Could not fetch product ${cleanProductId} from Firestore:`, err);
    }

    if (productData) {
      const prodVendorId = extractVendorIdFromData(productData);
      if (prodVendorId && !isPlaceholderVendorId(prodVendorId)) {
        candidateVendorId = prodVendorId;
      }
      if (!candidateVendorName) {
        candidateVendorName = extractVendorNameFromData(productData, "");
      }
    }
  }

  // Tier 3: Search 'vendors' collection by brand or business name if vendorId is still missing
  const searchTerms = [
    productData?.brand,
    productData?.brandName,
    productData?.vendorName,
    item.brand,
    item.brandName,
    item.vendorName,
  ].filter((t) => typeof t === "string" && t.trim() && !isPlaceholderVendorId(t));

  if ((!candidateVendorId || candidateVendorId === "") && searchTerms.length > 0) {
    for (const term of searchTerms) {
      const cacheKey = `match_${term.toLowerCase()}`;
      if (memoryVendorCache.has(cacheKey)) {
        const cached = memoryVendorCache.get(cacheKey);
        candidateVendorId = cached.id;
        candidateVendorName = candidateVendorName || cached.name;
        break;
      }

      try {
        // Query by brandName
        const brandQuery = await database
          .collection(COLLECTIONS.vendors || "vendors")
          .where("brandInformation.brandName", "==", term)
          .limit(1)
          .get();

        if (!brandQuery.empty) {
          const vDoc = brandQuery.docs[0];
          const vData = vDoc.data();
          const foundId = vData.vendorId || vData.customVendorId || vDoc.id;
          const foundName = extractVendorNameFromData(vData, term);
          memoryVendorCache.set(cacheKey, { id: foundId, name: foundName });
          candidateVendorId = foundId;
          candidateVendorName = candidateVendorName || foundName;
          break;
        }

        // Query by businessName
        const businessQuery = await database
          .collection(COLLECTIONS.vendors || "vendors")
          .where("businessDetails.businessName", "==", term)
          .limit(1)
          .get();

        if (!businessQuery.empty) {
          const vDoc = businessQuery.docs[0];
          const vData = vDoc.data();
          const foundId = vData.vendorId || vData.customVendorId || vDoc.id;
          const foundName = extractVendorNameFromData(vData, term);
          memoryVendorCache.set(cacheKey, { id: foundId, name: foundName });
          candidateVendorId = foundId;
          candidateVendorName = candidateVendorName || foundName;
          break;
        }
      } catch (searchErr) {
        console.warn(`[vendorResolver] Error querying vendor by term "${term}":`, searchErr);
      }
    }
  }

  // Tier 4: Look up any active real vendor in 'vendors' collection if still unassigned
  if (!candidateVendorId || candidateVendorId === "") {
    try {
      const registeredVendorsSnap = await database
        .collection(COLLECTIONS.vendors || "vendors")
        .limit(10)
        .get();

      if (!registeredVendorsSnap.empty) {
        const realDocs = registeredVendorsSnap.docs.filter(
          (d) => !isPlaceholderVendorId(d.id) && !isPlaceholderVendorId(d.data()?.vendorId)
        );

        if (realDocs.length > 0) {
          const firstReal = realDocs[0];
          const dData = firstReal.data();
          candidateVendorId = dData.vendorId || dData.customVendorId || firstReal.id;
          candidateVendorName = candidateVendorName || extractVendorNameFromData(dData, "Authorized Vendor");
        }
      }
    } catch (vendorsErr) {
      console.warn("[vendorResolver] Error looking up registered vendors in collection:", vendorsErr);
    }
  }

  // Tier 5: Fetch vendor doc profile to get official businessName if candidateVendorId is found
  if (candidateVendorId && !isPlaceholderVendorId(candidateVendorId)) {
    if (memoryVendorCache.has(candidateVendorId)) {
      const cached = memoryVendorCache.get(candidateVendorId);
      candidateVendorName = cached.name || candidateVendorName;
    } else {
      try {
        const vendorDocSnap = await database
          .collection(COLLECTIONS.vendors || "vendors")
          .doc(candidateVendorId)
          .get();

        if (vendorDocSnap && vendorDocSnap.exists) {
          const vData = vendorDocSnap.data();
          const resolvedName = extractVendorNameFromData(vData, candidateVendorName || "Authorized Vendor");
          memoryVendorCache.set(candidateVendorId, { id: candidateVendorId, name: resolvedName });
          candidateVendorName = resolvedName;
        }
      } catch (vFetchErr) {
        console.warn(`[vendorResolver] Error fetching profile for vendor ${candidateVendorId}:`, vFetchErr);
      }
    }
  }

  const finalVendorId = candidateVendorId && !isPlaceholderVendorId(candidateVendorId)
    ? candidateVendorId
    : "nitroxx-default-vendor";

  const finalVendorName = candidateVendorName && candidateVendorName !== "Nitroxx Moto Gear"
    ? candidateVendorName
    : (item.brand || item.brandName || productData?.brand || "Authorized Vendor");

  return {
    vendorId: finalVendorId,
    vendorName: finalVendorName,
  };
};

/**
 * Resolves real vendor IDs and names for an array of items (e.g. cartItems) in parallel.
 */
export const resolveRealVendorsForItems = async (items = [], firestoreInstance = null) => {
  if (!Array.isArray(items) || items.length === 0) return [];

  const database = firestoreInstance || db();

  const resolved = await Promise.all(
    items.map(async (item) => {
      try {
        const { vendorId, vendorName } = await resolveRealVendorForItem(item, database);
        return {
          ...item,
          vendorId,
          vendorName,
        };
      } catch (err) {
        console.error("[vendorResolver] Failed to resolve vendor for item:", item, err);
        return {
          ...item,
          vendorId: !isPlaceholderVendorId(item.vendorId) ? item.vendorId : "nitroxx-default-vendor",
          vendorName: item.vendorName || "Authorized Vendor",
        };
      }
    })
  );

  return resolved;
};

