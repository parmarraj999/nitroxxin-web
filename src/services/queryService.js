import { collection, addDoc, serverTimestamp as modularServerTimestamp } from "firebase/firestore";
import { firestoreInstance, db, serverTimestamp as compatServerTimestamp, COLLECTIONS } from "./firebase";

/**
 * Submit a partner inquiry or registration to the 'query' collection in Firestore.
 * Supports:
 * - 'affiliate' (Creator Affiliate Program)
 * - 'brand' (Brand & Retailer)
 * - 'host' (Event Host / Organizer)
 *
 * @param {Object} queryData
 * @returns {Promise<{ id: string, success: boolean }>}
 */
export const submitPartnerQuery = async (queryData) => {
  const collectionName = COLLECTIONS.query || "query";

  // Clean out undefined values to satisfy Firestore
  const cleanedData = Object.entries(queryData).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const now = new Date().toISOString();

  // Try modular SDK
  try {
    if (firestoreInstance) {
      const colRef = collection(firestoreInstance, collectionName);
      const docRef = await addDoc(colRef, {
        ...cleanedData,
        status: cleanedData.status || "pending",
        createdAt: modularServerTimestamp(),
        updatedAt: modularServerTimestamp(),
        submittedAt: now,
      });
      return { id: docRef.id, success: true };
    }
  } catch (modularErr) {
    console.warn("Modular addDoc failed for query collection, attempting compat fallback:", modularErr);
  }

  // Fallback to compat SDK
  try {
    const docRef = await db().collection(collectionName).add({
      ...cleanedData,
      status: cleanedData.status || "pending",
      createdAt: compatServerTimestamp(),
      updatedAt: compatServerTimestamp(),
      submittedAt: now,
    });
    return { id: docRef.id, success: true };
  } catch (compatErr) {
    console.error("Failed to add data inside query collection:", compatErr);
    throw compatErr;
  }
};
