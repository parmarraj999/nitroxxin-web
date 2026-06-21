import { COLLECTIONS, db, increment, serverTimestamp } from "./firebase";
import { normalizeEvent, normalizeProduct } from "./normalizers";

const publicId = (prefix) =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

export const addToCart = async ({ userId, product, quantity = 1, options = {} }) => {
  if (!userId) throw new Error("Please log in to add items to cart.");
  const item = normalizeProduct(product);
  const id = `${userId}_${item.id}_${options.size || "default"}`;

  await db().collection(COLLECTIONS.cart).doc(id).set(
    {
      userId,
      productId: item.id,
      quantity: increment(quantity),
      options,
      productSnapshot: item,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const updateCartQuantity = (cartItemId, quantity) =>
  db().collection(COLLECTIONS.cart).doc(cartItemId).set(
    {
      quantity,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

export const removeCartItem = (cartItemId) =>
  db().collection(COLLECTIONS.cart).doc(cartItemId).delete();

export const placeOrder = async ({ user, profile, cartItems, shipping }) => {
  if (!user) throw new Error("Please log in to place an order.");
  if (!cartItems.length) throw new Error("Your cart is empty.");

  const orderId = publicId("ORD");
  const total = cartItems.reduce((sum, item) => {
    const product = normalizeProduct(item.productSnapshot || item.product || item);
    return sum + Number(product.offerPrice ?? product.price ?? 0) * Number(item.quantity || 1);
  }, 0);

  const orderRef = db().collection(COLLECTIONS.orders).doc();
  await orderRef.set({
    orderId,
    userId: user.uid,
    user: {
      uid: user.uid,
      email: user.email,
      name: profile?.fullName || profile?.displayName || user.displayName || "",
      phone: profile?.phone || "",
    },
    shipping,
    items: cartItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity || 1,
      options: item.options || {},
      productSnapshot: normalizeProduct(item.productSnapshot || item.product || item),
    })),
    total,
    status: "Pending",
    statusHistory: [{ status: "Pending", at: new Date().toISOString() }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const batch = db().batch();
  cartItems.forEach((item) => batch.delete(db().collection(COLLECTIONS.cart).doc(item.id)));
  await batch.commit();

  return { id: orderRef.id, orderId };
};

export const saveWishlistItem = async ({ userId, product }) => {
  if (!userId) throw new Error("Please log in to save items.");
  const item = normalizeProduct(product);
  await db().collection(COLLECTIONS.wishlist).doc(`${userId}_${item.id}`).set(
    {
      userId,
      type: "product",
      productId: item.id,
      productSnapshot: item,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const saveFavoriteEvent = async ({ userId, event }) => {
  if (!userId) throw new Error("Please log in to save events.");
  const item = normalizeEvent(event);
  await db().collection(COLLECTIONS.wishlist).doc(`${userId}_event_${item.id}`).set(
    {
      userId,
      type: "event",
      eventId: item.id,
      eventSnapshot: item,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const bookEvent = async ({ user, profile, event, attendeeCounts, attendees, bikeDetails, joinAs, total }) => {
  if (!user) throw new Error("Please log in to book this event.");
  const eventSnapshot = normalizeEvent(event);
  const bookingId = publicId("BKG");
  const bookingRef = db().collection(COLLECTIONS.bookings).doc();

  await bookingRef.set({
    bookingId,
    userId: user.uid,
    attendeeCounts,
    attendees,
    bikeDetails,
    joinAs,
    total,
    eventId: eventSnapshot.id,
    eventSnapshot,
    attendee: {
      uid: user.uid,
      email: user.email,
      name: profile?.fullName || profile?.displayName || user.displayName || "",
      phone: profile?.phone || "",
    },
    status: "Pending",
    statusHistory: [{ status: "Pending", at: new Date().toISOString() }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: bookingRef.id, bookingId };
};
