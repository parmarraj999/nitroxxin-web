import { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "../services/firebase";

const initialState = { data: [], loading: true, error: null };

const getCollectionRef = (firestore, collectionPath, isGroup = false) => {
  if (isGroup) {
    return firestore.collectionGroup(collectionPath);
  }
  const cleanPath = String(collectionPath || "").trim().replace(/^\/+|\/+$/g, "");
  const segments = cleanPath.split("/").filter(Boolean);

  if (segments.length === 1) {
    return firestore.collection(segments[0]);
  } else if (segments.length === 3) {
    return firestore.collection(segments[0]).doc(segments[1]).collection(segments[2]);
  } else if (segments.length === 5) {
    return firestore
      .collection(segments[0])
      .doc(segments[1])
      .collection(segments[2])
      .doc(segments[3])
      .collection(segments[4]);
  }
  return firestore.collection(cleanPath);
};

const getDocumentRef = (firestore, collectionPath, docId) => {
  const cleanPath = String(collectionPath || "").trim().replace(/^\/+|\/+$/g, "");
  const segments = cleanPath.split("/").filter(Boolean);

  if (docId) {
    if (segments.length === 1) {
      return firestore.collection(segments[0]).doc(docId);
    } else if (segments.length === 3) {
      return firestore.collection(segments[0]).doc(segments[1]).collection(segments[2]).doc(docId);
    }
    return firestore.collection(cleanPath).doc(docId);
  } else {
    if (segments.length === 2) {
      return firestore.collection(segments[0]).doc(segments[1]);
    } else if (segments.length === 4) {
      return firestore.collection(segments[0]).doc(segments[1]).collection(segments[2]).doc(segments[3]);
    }
    return firestore.doc(cleanPath);
  }
};

export const useCollection = (collectionName, options = {}) => {
  const [state, setState] = useState(initialState);
  const optionsKey = JSON.stringify(options);

  const subscribe = useCallback(() => {
    if (!collectionName) {
      setState({ data: [], loading: false, error: null });
      return undefined;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const parsed = JSON.parse(optionsKey || "{}");
      let ref = getCollectionRef(db(), collectionName, parsed.isGroup);

      (parsed.where || []).forEach(([field, operator, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          ref = ref.where(field, operator, value);
        }
      });

      (parsed.orderBy || []).forEach(([field, direction]) => {
        ref = ref.orderBy(field, direction || "asc");
      });

      if (parsed.limit) ref = ref.limit(parsed.limit);

      return ref.onSnapshot(
        (snapshot) => {
          setState({
            data: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
            loading: false,
            error: null,
          });
        },
        (error) => {
          console.error(`Error querying collection ${collectionName}:`, error);
          setState({ data: [], loading: false, error });
        }
      );
    } catch (error) {
      console.error(`Exception subscribing to collection ${collectionName}:`, error);
      setState({ data: [], loading: false, error });
      return undefined;
    }
  }, [collectionName, optionsKey]);

  useEffect(() => {
    const unsubscribe = subscribe();
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [subscribe]);

  return useMemo(() => ({ ...state, retry: subscribe }), [state, subscribe]);
};

export const useDocument = (collectionName, id) => {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const subscribe = useCallback(() => {
    if (!collectionName || (!id && !collectionName.includes("/"))) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const docRef = getDocumentRef(db(), collectionName, id);
      return docRef.onSnapshot(
        (doc) => {
          setState({
            data: doc.exists ? { id: doc.id, ...doc.data() } : null,
            loading: false,
            error: null,
          });
        },
        (error) => {
          console.error(`Error querying document ${collectionName}/${id}:`, error);
          setState({ data: null, loading: false, error });
        }
      );
    } catch (error) {
      console.error(`Exception subscribing to document ${collectionName}/${id}:`, error);
      setState({ data: null, loading: false, error });
      return undefined;
    }
  }, [collectionName, id]);

  useEffect(() => {
    const unsubscribe = subscribe();
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [subscribe]);

  return useMemo(() => ({ ...state, retry: subscribe }), [state, subscribe]);
};
