import React, { createContext, useContext, useMemo, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { db } from "../services/firebase";

const CartContext = createContext({
  cartItems: [],
  cartCount: 0,
  loading: false,
});

/**
 * Safely parses cart item quantity to ensure it is always a finite positive number.
 * Prevents NaN from corrupting cart totals, badges, or quantity inputs.
 */
export const parseCartQuantity = (val) => {
  if (typeof val === "number" && Number.isFinite(val) && val > 0) {
    return Math.round(val);
  }
  const parsed = Number(val);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.round(parsed);
  }
  return 1;
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let usersItems = [];
    let userItems = [];

    const syncItems = () => {
      const map = new Map();
      [...userItems, ...usersItems].forEach((item) => {
        if (item && item.id) {
          map.set(item.id, {
            ...item,
            quantity: parseCartQuantity(item.quantity),
          });
        }
      });
      setCartItems(Array.from(map.values()));
      setLoading(false);
    };

    // 1. Primary path: users/{uid}/cart
    const unsubUsers = db()
      .collection("users")
      .doc(user.uid)
      .collection("cart")
      .onSnapshot(
        (snap) => {
          usersItems = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          syncItems();
        },
        (err) => {
          console.warn("CartContext users/cart error:", err);
          syncItems();
        }
      );

    // 2. Fallback path: user/{uid}/cart (legacy)
    const unsubUser = db()
      .collection("user")
      .doc(user.uid)
      .collection("cart")
      .onSnapshot(
        (snap) => {
          userItems = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          syncItems();
        },
        () => {
          syncItems();
        }
      );

    return () => {
      if (typeof unsubUsers === "function") unsubUsers();
      if (typeof unsubUser === "function") unsubUser();
    };
  }, [user?.uid]);

  // Real-time total cart count (sum of all quantities)
  const cartCount = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + parseCartQuantity(item.quantity), 0);
  }, [cartItems]);

  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      loading,
    }),
    [cartItems, cartCount, loading]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
