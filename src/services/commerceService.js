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
  const uid = userId || auth().currentUser?.uid;
  if (!uid) throw new Error("Please log in to add items to cart.");
  const item = normalizeProduct(product);
  const id = `${item.id}_${options.size || options.color || "default"}`;

  const cartPayload = compact({
    id,
    userId: uid,
    productId: item.id,
    quantity: increment(quantity),
    options,
    productSnapshot: item,
    product: item,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  // Store in user/userId/cart (and users/userId/cart)
  await db()
    .collection("user")
    .doc(uid)
    .collection("cart")
    .doc(id)
    .set(cartPayload, { merge: true });

  await db()
    .collection("users")
    .doc(uid)
    .collection("cart")
    .doc(id)
    .set(cartPayload, { merge: true });
};

export const updateCartQuantity = async (cartItemId, quantity, userId) => {
  const uid = userId || auth().currentUser?.uid;
  if (!uid || !cartItemId) return;

  const updateData = {
    quantity,
    updatedAt: serverTimestamp(),
  };

  await db()
    .collection("user")
    .doc(uid)
    .collection("cart")
    .doc(cartItemId)
    .set(updateData, { merge: true });

  await db()
    .collection("users")
    .doc(uid)
    .collection("cart")
    .doc(cartItemId)
    .set(updateData, { merge: true });

  try {
    await db().collection(COLLECTIONS.cart).doc(cartItemId).delete();
  } catch (e) {}
};

export const removeCartItem = async (cartItemId, userId) => {
  const uid = userId || auth().currentUser?.uid;
  if (!uid || !cartItemId) return;

  await db()
    .collection("user")
    .doc(uid)
    .collection("cart")
    .doc(cartItemId)
    .delete();

  await db()
    .collection("users")
    .doc(uid)
    .collection("cart")
    .doc(cartItemId)
    .delete();

  try {
    await db().collection(COLLECTIONS.cart).doc(cartItemId).delete();
  } catch (e) {}
};

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
  cartItems.forEach((item) => {
    if (item.id) {
      batch.delete(db().collection("user").doc(user.uid).collection("cart").doc(item.id));
      batch.delete(db().collection("users").doc(user.uid).collection("cart").doc(item.id));
      try {
        batch.delete(db().collection(COLLECTIONS.cart).doc(item.id));
      } catch (e) {}
    }
  });
  await batch.commit();

  return createdOrders[0];
};

export const saveWishlistItem = async ({ userId, product }) => {
  const uid = userId || auth().currentUser?.uid;
  if (!uid) throw new Error("Please log in to save items.");
  const item = normalizeProduct(product);
  const docId = String(item.id);

  const wishlistData = compact({
    id: docId,
    userId: uid,
    type: "product",
    productId: item.id,
    productSnapshot: item,
    product: item,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  // Store in user/userId/wishlist (and users/userId/wishlist)
  await db()
    .collection("user")
    .doc(uid)
    .collection("wishlist")
    .doc(docId)
    .set(wishlistData, { merge: true });

  await db()
    .collection("users")
    .doc(uid)
    .collection("wishlist")
    .doc(docId)
    .set(wishlistData, { merge: true });
};

export const removeWishlistItem = async ({ userId, productId, docId }) => {
  const uid = userId || auth().currentUser?.uid;
  if (!uid) return;
  const targetId = String(docId || productId || "");
  if (!targetId) return;

  await db()
    .collection("user")
    .doc(uid)
    .collection("wishlist")
    .doc(targetId)
    .delete();

  await db()
    .collection("users")
    .doc(uid)
    .collection("wishlist")
    .doc(targetId)
    .delete();

  try {
    await db().collection(COLLECTIONS.wishlist).doc(targetId).delete();
    await db().collection(COLLECTIONS.wishlist).doc(`${uid}_${targetId}`).delete();
  } catch (e) {}
};

export const saveFavoriteEvent = async ({ userId, event }) => {
  if (!userId) throw new Error("Please log in to save events.");
  const item = normalizeEvent(event);

  const eventId = item.id || event.id;
  const title = item.title || item.name || "";
  const dates = item.dates || item.dateText || item.date || item.dateTimeText || item.startDate || "";
  const time =
    item.time ||
    item.timeText ||
    item.startTime ||
    (typeof item.dateTimeText === "string" && item.dateTimeText.includes(",")
      ? item.dateTimeText.split(",")[1]?.trim()
      : "") ||
    "";
  const location = item.location || item.venue || item.address || "";
  const banner =
    item.banner ||
    item.bannerImage ||
    item.image ||
    (item.images && item.images[0]) ||
    "";

  const bookmarkData = compact({
    eventId,
    title,
    time,
    location,
    banner,
    image: banner,
    date: dates,
    price: item.price ?? 0,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Save in users > docID > bookmark and saved-events and wishlist
  await db()
    .collection(COLLECTIONS.users || "users")
    .doc(userId)
    .collection("bookmark")
    .doc(eventId)
    .set(bookmarkData, { merge: true });

  await db()
    .collection("users")
    .doc(userId)
    .collection("saved-events")
    .doc(eventId)
    .set(bookmarkData, { merge: true });

  await db()
    .collection("user")
    .doc(userId)
    .collection("saved-events")
    .doc(eventId)
    .set(bookmarkData, { merge: true });

  await db()
    .collection("user")
    .doc(userId)
    .collection("wishlist")
    .doc(eventId)
    .set({
      id: eventId,
      userId,
      type: "event",
      eventId,
      eventSnapshot: bookmarkData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

  await db()
    .collection("users")
    .doc(userId)
    .collection("wishlist")
    .doc(eventId)
    .set({
      id: eventId,
      userId,
      type: "event",
      eventId,
      eventSnapshot: bookmarkData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
};

export const removeFavoriteEvent = async ({ userId, eventId }) => {
  if (!userId) throw new Error("Please log in to remove events.");

  // Remove from users > docID > bookmark, saved-events, and wishlist
  await db()
    .collection(COLLECTIONS.users || "users")
    .doc(userId)
    .collection("bookmark")
    .doc(eventId)
    .delete();

  await db()
    .collection("users")
    .doc(userId)
    .collection("saved-events")
    .doc(eventId)
    .delete();

  await db()
    .collection("user")
    .doc(userId)
    .collection("saved-events")
    .doc(eventId)
    .delete();

  await db()
    .collection("user")
    .doc(userId)
    .collection("wishlist")
    .doc(eventId)
    .delete();

  await db()
    .collection("users")
    .doc(userId)
    .collection("wishlist")
    .doc(eventId)
    .delete();

  // Also remove any auto-id docs with matching eventId if any were created
  try {
    const snap = await db()
      .collection(COLLECTIONS.users || "users")
      .doc(userId)
      .collection("bookmark")
      .where("eventId", "==", eventId)
      .get();
    snap.forEach((d) => d.ref.delete());
  } catch (err) {
    // ignore
  }

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
  const userJoinedEventRef = db().collection(COLLECTIONS.users || "users").doc(user.uid).collection("joined-event").doc(eventId || bookingRef.id);

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

    const joinedEventData = compact({
      id: eventId || bookingRef.id,
      eventId,
      bookingId,
      bookingRefId: bookingRef.id,
      userId: user.uid,
      title: eventSnapshot.title || eventSnapshot.name || "",
      name: eventSnapshot.name || eventSnapshot.title || "",
      banner: eventSnapshot.banner || eventSnapshot.bannerImage || eventSnapshot.image || (eventSnapshot.images && eventSnapshot.images[0]) || "",
      bannerImage: eventSnapshot.bannerImage || eventSnapshot.banner || eventSnapshot.image || "",
      image: eventSnapshot.image || eventSnapshot.bannerImage || eventSnapshot.banner || "",
      dates: eventSnapshot.dates || eventSnapshot.dateText || eventSnapshot.date || eventSnapshot.dateTimeText || eventSnapshot.startDate || "",
      date: eventSnapshot.date || eventSnapshot.dateText || eventSnapshot.dateTimeText || "",
      dateText: eventSnapshot.dateText || eventSnapshot.dateTimeText || "",
      time: eventSnapshot.time || eventSnapshot.timeText || "",
      dateTimeText: eventSnapshot.dateTimeText || eventSnapshot.dateText || "",
      location: eventSnapshot.location || eventSnapshot.venue || eventSnapshot.address || "",
      venue: eventSnapshot.venue || eventSnapshot.location || "",
      price: eventSnapshot.price ?? 0,
      prices: eventSnapshot.prices || eventSnapshot.priceText || (eventSnapshot.price !== undefined ? eventSnapshot.price : "Free"),
      total,
      totalTickets,
      attendeeCounts,
      attendees,
      bikeDetails,
      joinAs,
      ticketPlan,
      addOns,
      bookingContact,
      emergencyContact,
      status: "pending",
      paymentStatus: "paid",
      paymentMethod: "online",
      qrTicket: `NX-${bookingId}`,
      eventSnapshot: JSON.parse(JSON.stringify(eventSnapshot)),
      data: eventSnapshot,
      joinedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 1. Root booking collections (both singular 'booking' and plural 'bookings')
    const rootBookingSingularRef = db().collection("booking").doc(bookingRef.id);
    transaction.set(bookingRef, payload);
    transaction.set(rootBookingSingularRef, payload);

    // 2. User joined-event, my-events, and saved-events subcollections
    const userMyEventsRef = db().collection("users").doc(user.uid).collection("my-events").doc(eventId || bookingRef.id);
    const userSingularMyEventsRef = db().collection("user").doc(user.uid).collection("my-events").doc(eventId || bookingRef.id);
    const userSavedEventsRef = db().collection("users").doc(user.uid).collection("saved-events").doc(eventId || bookingRef.id);
    const userSingularSavedEventsRef = db().collection("user").doc(user.uid).collection("saved-events").doc(eventId || bookingRef.id);

    transaction.set(userJoinedEventRef, joinedEventData, { merge: true });
    transaction.set(userMyEventsRef, joinedEventData, { merge: true });
    transaction.set(userSingularMyEventsRef, joinedEventData, { merge: true });
    transaction.set(userSavedEventsRef, joinedEventData, { merge: true });
    transaction.set(userSingularSavedEventsRef, joinedEventData, { merge: true });

    // 3. Super-admin advance payment record in 'payment' and 'payments'
    const advanceEventPayment = compact({
      id: bookingRef.id,
      paymentId: payment?.paymentId || payment?.razorpayPaymentId || `pay_evt_${bookingId}`,
      razorpayPaymentId: payment?.razorpayPaymentId || payment?.paymentId || "",
      razorpayOrderId: payment?.razorpayOrderId || "",
      razorpaySignature: payment?.razorpaySignature || "",
      bookingId,
      bookingDocId: bookingRef.id,
      eventId,
      eventTitle: eventSnapshot.title || eventSnapshot.name || "Motorcycle Event",
      userId: user.uid,
      customer: payload.attendee,
      amount: total,
      currency: "INR",
      status: "captured",
      paymentStatus: "paid",
      paymentMethod: payment?.method || "Razorpay Online",
      paymentMode: payment?.method || "Prepaid (Razorpay)",
      totalTickets,
      ticketPlan,
      attendees,
      bikeDetails,
      type: "event_booking",
      source: "nitroxxin-web",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.set(db().collection("payment").doc(bookingRef.id), advanceEventPayment);
    transaction.set(db().collection("payments").doc(bookingRef.id), advanceEventPayment);

    // 4. Basic user transaction in 'user/userId/transactions' and 'users/userId/transactions'
    const basicEventTx = compact({
      id: bookingRef.id,
      transactionId: payment?.paymentId || payment?.razorpayPaymentId || `TXN-EVT-${bookingId}`,
      bookingId,
      bookingDocId: bookingRef.id,
      eventId,
      title: `Event Pass - ${eventSnapshot.title || eventSnapshot.name || "Nitroxx Event"}`,
      category: "event",
      type: "debit",
      amount: total,
      currency: "INR",
      status: "success",
      paymentMethod: payment?.method || "Razorpay Online",
      paymentId: payment?.paymentId || payment?.razorpayPaymentId || "",
      dateText: `on ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}, at ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase()}`,
      description: `Booking pass for ${eventSnapshot.title} (${totalTickets} tickets)`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.set(db().collection("users").doc(user.uid).collection("transactions").doc(bookingRef.id), basicEventTx);
    transaction.set(db().collection("user").doc(user.uid).collection("transactions").doc(bookingRef.id), basicEventTx);
    transaction.set(db().collection("users").doc(user.uid).collection("wallet_transactions").doc(bookingRef.id), basicEventTx);

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

  // Create review doc under user/userid/reviews (and users/userid/reviews)
  const userReviewDoc = db().collection("user").doc(user.uid).collection("reviews").doc();
  const reviewId = userReviewDoc.id;

  const payload = compact({
    id: reviewId,
    reviewId,
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

  // Store in user/userId/reviews, users/userId/reviews, and user/userId/review
  await userReviewDoc.set(payload);

  await db()
    .collection("users")
    .doc(user.uid)
    .collection("reviews")
    .doc(reviewId)
    .set(payload, { merge: true });

  await db()
    .collection("user")
    .doc(user.uid)
    .collection("review")
    .doc(reviewId)
    .set(payload, { merge: true });

  // Recalculate average rating & review count for the product across collectionGroup("reviews")
  try {
    let allReviews = [];
    try {
      const reviewsSnap = await db()
        .collectionGroup("reviews")
        .where("productId", "==", productId)
        .get();

      if (!reviewsSnap.empty) {
        const revMap = new Map();
        reviewsSnap.docs.forEach((d) => {
          const data = d.data();
          const rId = data.reviewId || data.id || d.id;
          if (rId && !revMap.has(rId)) {
            revMap.set(rId, data);
          }
        });
        allReviews = Array.from(revMap.values());
      }
    } catch (gErr) {
      console.warn("collectionGroup reviews query error:", gErr);
    }

    if (!allReviews.some((r) => (r.reviewId || r.id) === reviewId)) {
      allReviews.push(payload);
    }

    if (allReviews.length > 0) {
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

  return { id: reviewId, ...payload };
};

export const markReviewHelpful = async (reviewId, userId) => {
  if (!reviewId) return;
  const uid = userId || auth().currentUser?.uid;

  if (uid) {
    await db().collection("user").doc(uid).collection("reviews").doc(reviewId).set(
      { helpfulCount: increment(1), updatedAt: serverTimestamp() },
      { merge: true }
    );
    await db().collection("users").doc(uid).collection("reviews").doc(reviewId).set(
      { helpfulCount: increment(1), updatedAt: serverTimestamp() },
      { merge: true }
    );
  } else {
    try {
      const snap = await db().collectionGroup("reviews").where("reviewId", "==", reviewId).get();
      snap.forEach((doc) => {
        doc.ref.set({ helpfulCount: increment(1), updatedAt: serverTimestamp() }, { merge: true });
      });
    } catch (e) {
      console.warn("Could not mark review helpful:", e);
    }
  }
};

