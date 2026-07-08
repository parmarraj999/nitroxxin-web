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
          name: profile?.fullName || profile?.displayName || user.displayName || "",
          phone: profile?.phone || "",
        },
        customer: {
          uid: user.uid,
          email: user.email,
          name: profile?.fullName || profile?.displayName || user.displayName || "",
          phone: profile?.phone || "",
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
        name: profile?.fullName || profile?.displayName || user?.displayName || "",
        phone: profile?.phone || "",
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
