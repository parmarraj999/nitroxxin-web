import { COLLECTIONS, auth, db, increment, serverTimestamp, deleteField } from "./firebase";
import { normalizeEvent, normalizeProduct } from "./normalizers";
import { generateTicketCode, generateTicketSignature } from "../utils/ticketSecurity";
import { generateWholeOrderId, generateVendorOrderId } from "../payments/placeOrder";
import { resolveRealVendorForItem, resolveRealVendorsForItems, isPlaceholderVendorId } from "./vendorResolver";

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

  let vendorId = item.vendorId;
  let vendorName = item.vendorName;

  if (!vendorId || isPlaceholderVendorId(vendorId)) {
    try {
      const resolved = await resolveRealVendorForItem(item, db());
      if (resolved.vendorId && !isPlaceholderVendorId(resolved.vendorId)) {
        vendorId = resolved.vendorId;
      }
      if (resolved.vendorName) {
        vendorName = resolved.vendorName;
      }
    } catch (e) {
      console.warn("Error resolving vendor during addToCart:", e);
    }
  }

  const variantKey =
    options.variantId ||
    options.sku ||
    [options.color, options.size].filter(Boolean).join("_") ||
    "default";
  const id = `${item.id}_${variantKey}`;

  const cartPrice = Number(options.price || item.offerPrice || item.price || item.mrp || 0);
  const cartMrp = Number(item.price || item.mrp || cartPrice);

  // Only store fields essential for cart page, transactions, and order placement
  const cartPayload = compact({
    id,
    userId: uid,
    productId: item.productId || item.id,
    variantId: options.variantId || "",
    sku: options.sku || item.sku || "",
    name: item.name || item.title || "Product",
    image: item.image || (Array.isArray(item.images) ? item.images[0] : "") || "",
    price: cartMrp,
    offerPrice: cartPrice,
    brand: item.brand || item.brandName || "",
    category: item.category || item.categoryName || "",
    vendorId: vendorId || DEFAULT_VENDOR_ID,
    vendorName: vendorName || item.brand || "Authorized Vendor",
    quantity: increment(quantity),
    options: {
      ...options,
      size: options.size || "",
      color: options.color || "",
      variantId: options.variantId || "",
      sku: options.sku || item.sku || "",
    },
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  // Ensure legacy bulky duplicate fields are removed if merging with an older cart doc
  cartPayload.product = deleteField();
  cartPayload.productSnapshot = deleteField();

  // Store in users/userId/cart
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
    .collection("users")
    .doc(uid)
    .collection("cart")
    .doc(cartItemId)
    .set(updateData, { merge: true });
};

export const removeCartItem = async (cartItemId, userId) => {
  const uid = userId || auth().currentUser?.uid;
  if (!uid || !cartItemId) return;

  await db()
    .collection("users")
    .doc(uid)
    .collection("cart")
    .doc(cartItemId)
    .delete();
};

export const placeOrder = async ({ user, profile, cartItems, shipping, paymentId }) => {
  if (!user) throw new Error("Please log in to place an order.");
  if (!cartItems.length) throw new Error("Your cart is empty.");

  const wholeOrderId = generateWholeOrderId(); // NTX...ORD
  const sharedPaymentId =
    paymentId ||
    `pay_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;

  // Resolve genuine marketplace vendors for all cart items
  const resolvedCartItems = await resolveRealVendorsForItems(cartItems, db());

  const groupedItems = resolvedCartItems.reduce((groups, item) => {
    const product = normalizeProduct(item.productSnapshot || item.product || item);
    const vendorId =
      item.vendorId && !isPlaceholderVendorId(item.vendorId)
        ? item.vendorId
        : product.vendorId && !isPlaceholderVendorId(product.vendorId)
        ? product.vendorId
        : DEFAULT_VENDOR_ID;

    const unitPrice = toNumber(item.offerPrice ?? product.offerPrice ?? item.price ?? product.price ?? 0);
    const normalized = {
      productId: item.productId || product.id,
      name: item.name || product.name || "Accessory Item",
      image: item.image || product.image || "",
      vendorId,
      vendorName: item.vendorName || product.vendorName || product.brand || "Authorized Vendor",
      quantity: toNumber(item.quantity, 1),
      options: item.options || {},
      unitPrice,
      price: unitPrice,
    };
    groups[vendorId] = [...(groups[vendorId] || []), normalized];
    return groups;
  }, {});

  const grandTotal = Object.values(groupedItems).reduce((sum, items) => {
    return sum + items.reduce((iSum, it) => iSum + it.unitPrice * it.quantity, 0);
  }, 0);

  const createdOrders = [];

  for (const [vendorId, items] of Object.entries(groupedItems)) {
    const orderRef = db().collection(COLLECTIONS.orders).doc();
    const vendorOrderId = generateVendorOrderId(); // ODR...VNTX
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
        orderID: wholeOrderId,
        vendorOrderId,
        payment_id: sharedPaymentId,
        vendorId,
        userId: user.uid,
        customer: {
          uid: user.uid,
          email: user.email,
          name: profile?.fullName || profile?.name || profile?.displayName || user.fullName || user.displayName || "",
          phone: profile?.phone || profile?.phoneNumber || user.phone || user.phoneNumber || "",
        },
        shipping,
        items,
        totalAmount: total,
        overallOrderTotal: grandTotal,
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
          publicOrderId: vendorOrderId,
          wholeOrderId,
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
        body: `${profile?.fullName || user.displayName || "Customer"} placed order ${vendorOrderId}.`,
        orderId: orderRef.id,
        publicOrderId: vendorOrderId,
        wholeOrderId,
        read: false,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    createdOrders.push({
      id: orderRef.id,
      orderID: wholeOrderId,
      vendorOrderId,
      vendorId,
      payment_id: sharedPaymentId,
    });
  }

  const batch = db().batch();
  cartItems.forEach((item) => {
    if (item.id) {
      batch.delete(db().collection("users").doc(user.uid).collection("cart").doc(item.id));
    }
  });
  await batch.commit();

  return {
    success: true,
    orderID: wholeOrderId,
    payment_id: sharedPaymentId,
    vendorOrders: createdOrders,
  };
};

export const saveWishlistItem = async ({ userId, product }) => {
  const uid = userId || auth().currentUser?.uid;
  if (!uid) throw new Error("Please log in to save items.");
  const item = normalizeProduct(product);

  let vendorId = item.vendorId;
  let vendorName = item.vendorName;

  if (!vendorId || isPlaceholderVendorId(vendorId)) {
    try {
      const resolved = await resolveRealVendorForItem(item, db());
      if (resolved.vendorId && !isPlaceholderVendorId(resolved.vendorId)) {
        vendorId = resolved.vendorId;
      }
      if (resolved.vendorName) {
        vendorName = resolved.vendorName;
      }
    } catch (e) {
      console.warn("Error resolving vendor during saveWishlistItem:", e);
    }
  }

  const docId = String(item.id);

  const wishlistData = compact({
    id: docId,
    userId: uid,
    type: "product",
    productId: item.productId || item.id,
    name: item.name || item.title || "Product",
    image: item.image || (Array.isArray(item.images) ? item.images[0] : "") || "",
    price: Number(item.price || item.mrp || 0),
    offerPrice: Number(item.offerPrice || item.price || 0),
    brand: item.brand || item.brandName || "",
    category: item.category || item.categoryName || "",
    vendorId: vendorId || DEFAULT_VENDOR_ID,
    vendorName: vendorName || item.brand || "Authorized Vendor",
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });

  wishlistData.product = deleteField();
  wishlistData.productSnapshot = deleteField();

  // Store in users/userId/wishlist
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
    .collection("users")
    .doc(uid)
    .collection("wishlist")
    .doc(targetId)
    .delete();
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

  // Canonical single source of truth for user saved event bookmarks: users/{userId}/bookmark
  await db()
    .collection(COLLECTIONS.users || "users")
    .doc(userId)
    .collection("bookmark")
    .doc(eventId)
    .set(bookmarkData, { merge: true });
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

  const userPhoneForTicket =
    bookingContact?.phone ||
    profile?.phone ||
    user?.phone ||
    user?.phoneNumber ||
    (attendees && attendees[0]?.phone) ||
    '';
  const attendeeEmailForTicket =
    user?.email || profile?.email || bookingContact?.email || (attendees && attendees[0]?.email) || '';

  const ticketCode = generateTicketCode(userPhoneForTicket);
  const signature = await generateTicketSignature(
    ticketCode,
    bookingRef.id,
    eventId,
    attendeeEmailForTicket
  );
  const qrPayload = JSON.stringify({
    ticketCode,
    bookingId: bookingRef.id,
    eventId,
    attendeeEmail: attendeeEmailForTicket,
    signature,
  });

  const userProfilePhoto =
    profile?.profilePhoto ||
    profile?.photoURL ||
    profile?.avatar ||
    user?.photoURL ||
    user?.profilePhoto ||
    user?.userPhoto ||
    "";

  const sanitizedAttendees = (attendees && attendees.length > 0 ? attendees : [
    {
      name: profile?.fullName || profile?.name || user?.fullName || user?.displayName || bookingContact?.name || "Racer",
      email: attendeeEmailForTicket,
      phone: userPhoneForTicket,
      joinAs: joinAs || "biker",
    }
  ]).map((att, idx) => ({
    name: att.name || (idx === 0 ? (profile?.fullName || user?.fullName || bookingContact?.name || "") : ""),
    email: att.email || (idx === 0 ? attendeeEmailForTicket : ""),
    phone: att.phone || (idx === 0 ? userPhoneForTicket : ""),
    age: att.age || "",
    gender: att.gender || "",
    idType: att.idType || "Aadhaar",
    joinAs: att.joinAs || (idx === 0 ? (joinAs || "biker") : "pillion"),
    ticketTier: att.ticketTier || (ticketPlan?.tiers && ticketPlan.tiers[idx]?.name) || "",
    ticketTierKey: att.ticketTierKey || (ticketPlan?.tiers && ticketPlan.tiers[idx]?.key) || "",
    photoURL: (idx === 0 ? userProfilePhoto : "") || att.photoURL || att.userPhoto || att.avatar || "",
  }));

  // Only keep bookingContact if it differs from the primary attendee
  const primaryAttendee = sanitizedAttendees[0] || {};
  const isBookingContactDifferent = Boolean(
    bookingContact &&
    typeof bookingContact === "object" &&
    (
      (bookingContact.name && bookingContact.name.trim().toLowerCase() !== (primaryAttendee.name || "").trim().toLowerCase()) ||
      (bookingContact.email && bookingContact.email.trim().toLowerCase() !== (primaryAttendee.email || "").trim().toLowerCase()) ||
      (bookingContact.phone && bookingContact.phone.trim() !== (primaryAttendee.phone || "").trim())
    )
  );
  const finalBookingContact = isBookingContactDifferent ? bookingContact : undefined;

  // Normalized payment object containing method, status, amount
  const normalizedPayment = compact({
    ...payment,
    method: payment?.method || payment?.paymentMethod || "Razorpay Online",
    status: payment?.status || payment?.paymentStatus || "paid",
    amount: Number(payment?.amount || total || 0),
  });

  await db().runTransaction(async (transaction) => {
    const eventRef = db().collection(COLLECTIONS.events).doc(eventId);
    const eventDoc = eventId ? await transaction.get(eventRef) : null;
    const liveEvent = eventDoc?.exists ? eventDoc.data() : eventSnapshot;
    const capacity = toNumber(liveEvent?.capacity, 0);
    const registeredCount = toNumber(liveEvent?.registeredCount, 0);
    if (capacity && registeredCount + totalTickets > capacity) {
      throw new Error("This event does not have enough tickets available.");
    }

    // 1. Root bookings collection with essential booking metadata and complete snapshot
    const eventTitle = eventSnapshot.title || eventSnapshot.name || "Nitroxx Motorsports Event";
    const eventDate = eventSnapshot.startDate || eventSnapshot.date || null;
    const eventDateText = eventSnapshot.dateText || eventSnapshot.dateTimeText || "";
    const eventTime = eventSnapshot.time || eventSnapshot.timeRange || "";
    const eventLocation = eventSnapshot.venue || eventSnapshot.location || eventSnapshot.city || "Venue TBA";
    const eventVenue = eventSnapshot.venue || eventSnapshot.location || "";
    const eventCity = eventSnapshot.city || "";
    const eventBanner = eventSnapshot.banner || eventSnapshot.bannerImage || eventSnapshot.image || "";
    const eventHostName = eventSnapshot.hostName || eventSnapshot.organizerName || eventSnapshot.host || "Nitroxx Community";
    const eventHostAvatar = eventSnapshot.hostAvatar || eventSnapshot.organizerAvatar || "";

    const payload = compact({
      bookingId,
      bookingDocId: bookingRef.id,
      userId: user.uid,
      hostId,
      eventId,
      title: eventTitle,
      eventTitle,
      date: eventDate,
      startDate: eventDate,
      dateText: eventDateText,
      time: eventTime,
      location: eventLocation,
      venue: eventVenue,
      city: eventCity,
      banner: eventBanner,
      image: eventBanner,
      hostName: eventHostName,
      hostAvatar: eventHostAvatar,
      category: eventSnapshot.category || "",
      total: total || normalizedPayment.amount || 0,
      price: total || normalizedPayment.amount || 0,
      ticketCode,
      qrPayload,
      signature,
      totalTickets,
      attendeeCounts,
      attendees: sanitizedAttendees,
      bookingContact: finalBookingContact,
      emergencyContact,
      bikeDetails,
      addOns,
      fees,
      preferences,
      payment: normalizedPayment,
      notes,
      status: "confirmed",
      approvalStatus: "confirmed",
      attendanceStatus: "Not Checked In",
      gateStatus: "Pending",
      eventSnapshot: {
        id: eventId,
        title: eventTitle,
        name: eventTitle,
        date: eventDate,
        startDate: eventDate,
        dateText: eventDateText,
        time: eventTime,
        location: eventLocation,
        venue: eventVenue,
        city: eventCity,
        banner: eventBanner,
        image: eventBanner,
        hostName: eventHostName,
        category: eventSnapshot.category || "",
      },
      statusHistory: [{ status: "confirmed", at: new Date().toISOString(), note: "Booking created" }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. User joined-event subcollection with complete snapshot metadata
    const joinedEventData = compact({
      id: eventId || bookingRef.id,
      eventId,
      bookingId,
      bookingRefId: bookingRef.id,
      userId: user.uid,
      title: eventTitle,
      eventTitle,
      date: eventDate,
      startDate: eventDate,
      dateText: eventDateText,
      time: eventTime,
      location: eventLocation,
      venue: eventVenue,
      city: eventCity,
      banner: eventBanner,
      image: eventBanner,
      hostName: eventHostName,
      hostAvatar: eventHostAvatar,
      category: eventSnapshot.category || "",
      total: total || normalizedPayment.amount || 0,
      price: total || normalizedPayment.amount || 0,
      totalTickets,
      ticketCode,
      qrPayload,
      signature,
      attendees: sanitizedAttendees,
      bookingContact: finalBookingContact,
      emergencyContact,
      bikeDetails,
      addOns,
      payment: normalizedPayment,
      status: "confirmed",
      gateStatus: "Pending",
      attendanceStatus: "Not Checked In",
      eventSnapshot: {
        id: eventId,
        title: eventTitle,
        name: eventTitle,
        date: eventDate,
        startDate: eventDate,
        dateText: eventDateText,
        time: eventTime,
        location: eventLocation,
        venue: eventVenue,
        city: eventCity,
        banner: eventBanner,
        image: eventBanner,
        hostName: eventHostName,
        category: eventSnapshot.category || "",
      },
      joinedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 1. Root bookings collection (canonical plural 'bookings' only)
    transaction.set(bookingRef, payload);

    // 2. User joined-event subcollection (canonical 'users' only)
    transaction.set(userJoinedEventRef, joinedEventData, { merge: true });

    // 3. Advance payment record in 'payments'
    const advanceEventPayment = compact({
      id: bookingRef.id,
      paymentId: payment?.paymentId || payment?.razorpayPaymentId || `pay_evt_${bookingId}`,
      razorpayPaymentId: payment?.razorpayPaymentId || payment?.paymentId || "",
      razorpayOrderId: payment?.razorpayOrderId || "",
      razorpaySignature: payment?.razorpaySignature || "",
      bookingId,
      bookingDocId: bookingRef.id,
      ticketCode,
      eventId,
      eventTitle: eventSnapshot.title || eventSnapshot.name || "Motorcycle Event",
      userId: user.uid,
      customer: {
        name: bookingContact?.name || sanitizedAttendees[0]?.name || "",
        email: bookingContact?.email || sanitizedAttendees[0]?.email || "",
        phone: bookingContact?.phone || sanitizedAttendees[0]?.phone || "",
      },
      amount: Number(payment?.amount || total || 0),
      currency: "INR",
      status: "captured",
      paymentMethod: payment?.method || "Razorpay Online",
      totalTickets,
      attendees: sanitizedAttendees,
      bikeDetails,
      type: "event_booking",
      source: "nitroxxin-web",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    transaction.set(db().collection("payments").doc(bookingRef.id), advanceEventPayment);

    // 4. Basic user transaction in 'users/userId/transactions'
    const basicEventTx = compact({
      id: bookingRef.id,
      transactionId: payment?.paymentId || payment?.razorpayPaymentId || `TXN-EVT-${bookingId}`,
      bookingId,
      bookingDocId: bookingRef.id,
      ticketCode,
      eventId,
      title: `Event Pass - ${eventSnapshot.title || eventSnapshot.name || "Nitroxx Event"}`,
      category: "event",
      type: "debit",
      amount: Number(payment?.amount || total || 0),
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

    // 5. Host & Gate scanner registration record in 'eventRegistrations'
    transaction.set(registrationRef, compact({
      registrationId: registrationRef.id,
      bookingId,
      bookingDocId: bookingRef.id,
      eventId,
      userId: user.uid,
      hostId,
      participantName: bookingContact?.name || sanitizedAttendees[0]?.name || profile?.fullName || user?.fullName || "",
      participantEmail: attendeeEmailForTicket,
      participantPhone: userPhoneForTicket,
      participant: {
        fullName: bookingContact?.name || sanitizedAttendees[0]?.name || profile?.fullName || user?.fullName || "",
        name: bookingContact?.name || sanitizedAttendees[0]?.name || profile?.fullName || user?.fullName || "",
        email: attendeeEmailForTicket,
        phone: userPhoneForTicket,
      },
      attendees: sanitizedAttendees,
      primaryContact: finalBookingContact,
      registrationDate: serverTimestamp(),
      status: "Pending",
      attendanceStatus: "Not Checked In",
      gateStatus: "Pending",
      ticketCode,
      qrPayload,
      signature,
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
        body: `${sanitizedAttendees[0]?.name || bookingContact?.name || "Customer"} booked ${eventSnapshot.title}.`,
        bookingId: bookingRef.id,
        publicBookingId: bookingId,
        ticketCode,
        eventId,
        read: false,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  });

  return {
    id: bookingRef.id,
    bookingId,
    ticketCode,
    ticketNumber: ticketCode,
    qrPayload,
    signature,
  };
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

  // Create review doc under users/userid/reviews
  const userReviewDoc = db().collection("users").doc(user.uid).collection("reviews").doc();
  const reviewId = userReviewDoc.id;

  let resolvedVendorId = vendorId;
  if (!resolvedVendorId || isPlaceholderVendorId(resolvedVendorId)) {
    try {
      const resolved = await resolveRealVendorForItem({ productId }, db());
      if (resolved.vendorId && !isPlaceholderVendorId(resolved.vendorId)) {
        resolvedVendorId = resolved.vendorId;
      }
    } catch (e) {
      console.warn("Could not resolve vendor for review:", e);
    }
  }

  const payload = compact({
    id: reviewId,
    reviewId,
    productId,
    productName: productName || "Product",
    vendorId: resolvedVendorId || DEFAULT_VENDOR_ID,
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

  // Store in users/userId/reviews
  await userReviewDoc.set(payload);

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

