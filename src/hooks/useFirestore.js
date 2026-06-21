import { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "../services/firebase";

const initialState = { data: [], loading: true, error: null };

export const useCollection = (collectionName, options = {}) => {
  const [state, setState] = useState(initialState);
  const optionsKey = JSON.stringify(options);

  const subscribe = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      let ref = db().collection(collectionName);
      const parsed = JSON.parse(optionsKey || "{}");

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
        (error) => setState({ data: [], loading: false, error })
      );
    } catch (error) {
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
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return undefined;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      return db()
        .collection(collectionName)
        .doc(id)
        .onSnapshot(
          (doc) => {
            setState({
              data: doc.exists ? { id: doc.id, ...doc.data() } : null,
              loading: false,
              error: null,
            });
          },
          (error) => setState({ data: null, loading: false, error })
        );
    } catch (error) {
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
