import { COLLECTIONS, db, increment, serverTimestamp } from "./firebase";
import { normalizeEvent, normalizeProduct } from "./normalizers";

const DEFAULT_VENDOR_ID = "nitroxx-default-vendor";

const publicId = (prefix) =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

const toNumber = (value, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const compact = (value) => {
  if (Array.isArray(value)) return value.map(compact).filter((item) => item !== undefined);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, compact(item)])
        .filter(([, item]) => item !== undefined && item !== "")
    );
  }
  return value === undefined ? undefined : value;
};

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

  const groupedItems = cartItems.reduce((groups, item) => {
    const product = normalizeProduct(item.productSnapshot || item.product || item);
    const vendorId = product.vendorId || item.vendorId || DEFAULT_VENDOR_ID;
    const normalized = {
      productId: item.productId || product.id,
      vendorId,
      quantity: toNumber(item.quantity, 1),
      options: item.options || {},
      unitPrice: toNumber(product.offerPrice ?? product.price),
      productSnapshot: compact(product),
    };
    groups[vendorId] = [...(groups[vendorId] || []), normalized];
    return groups;
  }, {});

  const createdOrders = [];

  for (const [vendorId, items] of Object.entries(groupedItems)) {
    const orderRef = db().collection(COLLECTIONS.orders).doc();
    const orderId = publicId("ORD");
    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    await db().runTransaction(async (transaction) => {
      const inventoryRefs = items.map((item) => db().collection("inventory").doc(item.productId));
      const productRefs = items.map((item) => db().collection(COLLECTIONS.products).doc(item.productId));
      const inventorySnaps = await Promise.all(inventoryRefs.map((ref) => transaction.get(ref)));
      const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)));

      items.forEach((item, index) => {
        const inventory = inventorySnaps[index].exists ? inventorySnaps[index].data() : null;
        const product = productSnaps[index].exists ? productSnaps[index].data() : null;
        const knownAvailable = inventory?.availableStock ?? product?.inventory?.stockQuantity ?? product?.stock;
        if (knownAvailable !== undefined && knownAvailable !== null && toNumber(knownAvailable) < item.quantity) {
          throw new Error(`${item.productSnapshot?.name || "Product"} does not have enough stock.`);
        }
      });

      transaction.set(orderRef, compact({
        orderId,
        vendorId,
        userId: user.uid,
        user: {
          uid: user.uid,
          email: user.email,
          name: profile?.fullName || profile?.name || profile?.displayName || user.fullName || user.displayName || "",
          phone: profile?.phone || profile?.phoneNumber || user.phone || user.phoneNumber || "",
        },
        customer: {
          uid: user.uid,
          email: user.email,
          name: profile?.fullName || profile?.name || profile?.displayName || user.fullName || user.displayName || "",
          phone: profile?.phone || profile?.phoneNumber || user.phone || user.phoneNumber || "",
        },
        shipping,
        items,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        total,
        totalAmount: total,
        paymentStatus: "paid",
        paymentMethod: "online",
        status: "pending",
        statusHistory: [{ status: "pending", at: new Date().toISOString(), note: "Order created" }],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }));

      items.forEach((item, index) => {
        transaction.set(db().collection("order_items").doc(), compact({
          orderId: orderRef.id,
          publicOrderId: orderId,
          vendorId,
          userId: user.uid,
          ...item,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }));

        const inventory = inventorySnaps[index].exists ? inventorySnaps[index].data() : {};
        transaction.set(inventoryRefs[index], {
          vendorId,
          productId: item.productId,
          stock: increment(-item.quantity),
          availableStock: increment(-item.quantity),
          reservedStock: increment(item.quantity),
          lowStockThreshold: inventory.lowStockThreshold ?? item.productSnapshot?.inventory?.lowStockThreshold ?? 5,
          updatedAt: serverTimestamp(),
          createdAt: inventory.createdAt || serverTimestamp(),
        }, { merge: true });

        if (productSnaps[index].exists) {
          transaction.update(productRefs[index], {
            "inventory.stockQuantity": increment(-item.quantity),
            stock: increment(-item.quantity),
            updatedAt: serverTimestamp(),
          });
        }
      });

      transaction.set(db().collection(COLLECTIONS.notifications).doc(), {
        vendorId,
        userId: vendorId,
        type: "order-created",
        title: "New order received",
        body: `${profile?.fullName || user.displayName || "Customer"} placed order ${orderId}.`,
        orderId: orderRef.id,
        publicOrderId: orderId,
        read: false,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    createdOrders.push({ id: orderRef.id, orderId, vendorId });
  }

  const batch = db().batch();
  cartItems.forEach((item) => batch.delete(db().collection(COLLECTIONS.cart).doc(item.id)));
  await batch.commit();

  return createdOrders[0];
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

  const bookmarkData = compact({
    id: item.id,
    eventId: item.id,
    userId,
    type: "event",
    title: item.title || item.name || "",
    name: item.name || item.title || "",
    image: item.bannerImage || item.banner || item.image || (item.images && item.images[0]) || "",
    bannerImage: item.bannerImage || item.banner || item.image || "",
    images: item.images || [],
    dateText: item.dateText || item.dateTimeText || "",
    dateTimeText: item.dateTimeText || item.dateText || "",
    startDate: item.startDate || "",
    endDate: item.endDate || "",
    location: item.location || "",
    venue: item.venue || item.location || "",
    price: item.price || 0,
    priceText: item.priceText || (item.price ? `₹${item.price}` : "Free"),
    category: item.category || "",
    description: item.description || item.about || "",
    about: item.about || item.description || "",
    eventSnapshot: item,
    data: item,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Save in users > docID > bookmark collection > data
  await db()
    .collection(COLLECTIONS.users || "users")
    .doc(userId)
    .collection("bookmark")
    .doc(item.id)
    .set(bookmarkData, { merge: true });

  // Also maintain in wishlist collection for backwards compatibility
  try {
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
  } catch (err) {
    console.warn("Sync to wishlist collection skipped:", err);
  }
};

export const removeFavoriteEvent = async ({ userId, eventId }) => {
  if (!userId) throw new Error("Please log in to remove events.");

  // Remove from users > docID > bookmark collection
  await db()
    .collection(COLLECTIONS.users || "users")
    .doc(userId)
    .collection("bookmark")
    .doc(eventId)
    .delete();

  // Also remove from wishlist collection
  try {
    await db().collection(COLLECTIONS.wishlist).doc(`${userId}_event_${eventId}`).delete();
  } catch (err) {
    console.warn("Remove from wishlist collection skipped:", err);
  }
};

export const saveEventLike = async ({ userId, eventId }) => {
  if (!userId || !eventId) return;
  await db().collection(COLLECTIONS.eventLikes || "event_likes").doc(`${userId}_${eventId}`).set(
    {
      userId,
      eventId,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
};

export const removeEventLike = async ({ userId, eventId }) => {
  if (!userId || !eventId) return;
  await db().collection(COLLECTIONS.eventLikes || "event_likes").doc(`${userId}_${eventId}`).delete();
};


export const bookEvent = async ({
  user,
  profile,
  event,
  attendeeCounts,
  attendees,
  bikeDetails,
  joinAs,
  total,
  ticketPlan,
  addOns,
  fees,
  bookingContact,
  emergencyContact,
  preferences,
  payment,
  notes,
}) => {
  if (!user) throw new Error("Please log in to book this event.");
  const eventSnapshot = normalizeEvent(event);
  const bookingId = publicId("BKG");
  const bookingRef = db().collection(COLLECTIONS.bookings).doc();
  const eventId = eventSnapshot.id || "";
  const hostId = eventSnapshot.hostId || eventSnapshot.organizerId || eventSnapshot.vendorId || "";
  const totalTickets = Object.values(attendeeCounts || {}).reduce((sum, count) => sum + toNumber(count), 0);
  const registrationRef = db().collection("eventRegistrations").doc(`${eventId}_${user.uid}_${bookingRef.id}`);

  await db().runTransaction(async (transaction) => {
    const eventRef = db().collection(COLLECTIONS.events).doc(eventId);
    const eventDoc = eventId ? await transaction.get(eventRef) : null;
    const liveEvent = eventDoc?.exists ? eventDoc.data() : eventSnapshot;
    const capacity = toNumber(liveEvent?.capacity, 0);
    const registeredCount = toNumber(liveEvent?.registeredCount, 0);
    if (capacity && registeredCount + totalTickets > capacity) {
      throw new Error("This event does not have enough tickets available.");
    }

    const payload = compact({
      bookingId,
      userId: user.uid,
      hostId,
      organizerId: hostId,
      attendeeCounts,
      attendees,
      bikeDetails,
      joinAs,
      ticketPlan,
      addOns,
      fees,
      bookingContact,
      emergencyContact,
      preferences,
      payment,
      notes,
      total,
      totalTickets,
      paymentStatus: "paid",
      paymentMethod: "online",
      eventId,
      eventSnapshot: JSON.parse(JSON.stringify(eventSnapshot)),
      attendee: {
        uid: user?.uid || "",
        email: user?.email || "",
        name: profile?.fullName || profile?.name || profile?.displayName || user?.fullName || user?.displayName || "",
        phone: profile?.phone || profile?.phoneNumber || user?.phone || user?.phoneNumber || "",
      },
      status: "pending",
      approvalStatus: "pending",
      qrTicket: `NX-${bookingId}`,
      statusHistory: [{ status: "pending", at: new Date().toISOString(), note: "Booking created" }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.set(bookingRef, payload);
    transaction.set(registrationRef, compact({
      registrationId: registrationRef.id,
      bookingId,
      eventId,
      userId: user.uid,
      hostId,
      participant: payload.attendee,
      participantName: payload.attendee.name,
      participantEmail: payload.attendee.email,
      participantPhone: payload.attendee.phone,
      registrationDate: serverTimestamp(),
      status: "Pending",
      attendanceStatus: "Not Checked In",
      ticketNumber: payload.qrTicket,
      ticketPrice: total,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
    if (eventId) {
      transaction.set(eventRef, {
        registeredCount: increment(totalTickets),
        revenue: increment(toNumber(total)),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    if (hostId) {
      transaction.set(db().collection(COLLECTIONS.notifications).doc(), {
        vendorId: hostId,
        userId: hostId,
        type: "booking-created",
        title: "New event booking",
        body: `${payload.attendee.name || "Customer"} booked ${eventSnapshot.title}.`,
        bookingId: bookingRef.id,
        publicBookingId: bookingId,
        eventId,
        read: false,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  });

  return { id: bookingRef.id, bookingId };
};

export const submitReview = async ({ productId, productName, vendorId, user, profile, rating, title, review, images = [] }) => {
  if (!user) throw new Error("Please log in to submit a review.");
  if (!rating || rating < 1 || rating > 5) throw new Error("Please select a rating between 1 and 5 stars.");
  if (!review || !review.trim()) throw new Error("Please enter your review comments.");

  let isVerified = "no";
  try {
    const ordersSnap = await db()
      .collection(COLLECTIONS.orders)
      .where("userId", "==", user.uid)
      .get();

    if (!ordersSnap.empty) {
      const bought = ordersSnap.docs.some((docSnap) => {
        const orderData = docSnap.data();
        const items = orderData.items || orderData.orderItems || [];
        return items.some((i) => i.productId === productId || i.id === productId);
      });
      if (bought) isVerified = "yes";
    }
  } catch (err) {
    console.warn("Could not verify purchase history:", err);
  }

  const reviewRef = db().collection(COLLECTIONS.reviews).doc();
  const payload = compact({
    reviewId: reviewRef.id,
    productId,
    productName: productName || "Product",
    vendorId: vendorId || DEFAULT_VENDOR_ID,
    userId: user.uid,
    customer: profile?.fullName || profile?.name || profile?.displayName || user.fullName || user.displayName || user.email?.split("@")[0] || "Verified Customer",
    customerPhoto: profile?.profilePhoto || profile?.photoURL || user.photoURL || "",
    rating: Number(rating),
    title: title?.trim() || "",
    review: review.trim(),
    images: Array.isArray(images) ? images.filter(Boolean) : [],
    verifiedPurchase: isVerified,
    status: "published",
    helpfulCount: 0,
    reply: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await reviewRef.set(payload);

  // Recalculate average rating & review count for the product
  try {
    const reviewsSnap = await db()
      .collection(COLLECTIONS.reviews)
      .where("productId", "==", productId)
      .get();

    if (!reviewsSnap.empty) {
      const allReviews = reviewsSnap.docs.map((d) => d.data());
      const totalCount = allReviews.length;
      const sumRating = allReviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
      const avgRating = Math.round((sumRating / totalCount) * 10) / 10;

      await db().collection(COLLECTIONS.products).doc(productId).set(
        {
          averageRating: avgRating,
          rating: avgRating,
          reviewCount: totalCount,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (recalcErr) {
    console.warn("Could not update product average rating:", recalcErr);
  }

  return { id: reviewRef.id, ...payload };
};

export const markReviewHelpful = async (reviewId) => {
  if (!reviewId) return;
  await db().collection(COLLECTIONS.reviews).doc(reviewId).set(
    {
      helpfulCount: increment(1),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

