import { db, COLLECTIONS, serverTimestamp } from "../services/firebase";
import { normalizeProduct } from "../services/normalizers";

/**
 * Generates whole-order ID (e.g. NTX123456789ORD)
 * Format: NTX + 9 random digits + ORD
 */
export function generateWholeOrderId() {
  const random9 = Math.floor(100000000 + Math.random() * 900000000);
  return `NTX${random9}ORD`;
}

/**
 * Generates vendor-order ID (e.g. ODR123456VNTX)
 * Format: ODR + 6 random digits + VNTX
 */
export function generateVendorOrderId() {
  const random6 = Math.floor(100000 + Math.random() * 900000);
  return `ODR${random6}VNTX`;
}

/**
 * Saves multi-vendor orders to Firestore.
 * For each vendor present in cartItems, creates a separate order document
 * in the global 'orders' collection with:
 *  - orderId / orderID: whole order ID (e.g. NTX123456789ORD)
 *  - vendorOrderId: vendor order ID (e.g. ODR123456VNTX)
 *  - paymentId / payment_id: shared payment reference across all vendor orders
 */
export const AddOrderToFirestore = async ({
  cartItems = [],
  totalAmount = 0,
  user,
  profile,
  shipping = {},
  paymentDetails = {},
}) => {
  const userId =
    user?.uid ||
    window.localStorage.getItem("nitroxxin_dev_test_uid") ||
    window.localStorage.getItem("userId");

  if (!userId) {
    throw new Error("User ID is required to place an order.");
  }

  // 1. Shared identifiers across all vendor orders from this checkout session
  const wholeOrderId = generateWholeOrderId(); // e.g. NTX123456789ORD
  const paymentId =
    paymentDetails.razorpay_payment_id ||
    paymentDetails.paymentId ||
    paymentDetails.payment_id ||
    `pay_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;

  const razorpayOrderId =
    paymentDetails.razorpay_order_id ||
    paymentDetails.orderId ||
    paymentDetails.order_id ||
    "";
  const razorpaySignature = paymentDetails.razorpay_signature || "";

  try {
    const database = db();
    const batch = database.batch();

    // 2. Normalize items for order records
    const normalizedItems = cartItems.map((item) => {
      const prod = normalizeProduct(item.productSnapshot || item.product || item);
      const vendorId =
        prod.vendorId ||
        item.vendorId ||
        item.productSnapshot?.vendorId ||
        item.product?.vendorId ||
        "nitroxx-default-vendor";
      const vendorName =
        prod.vendorName ||
        item.vendorName ||
        item.productSnapshot?.vendorName ||
        item.product?.vendorName ||
        prod.brand ||
        "Nitroxx Moto Gear";

      return {
        id: item.id || prod.id,
        productId: prod.id || item.productId,
        name: prod.name || prod.title || "Accessory Item",
        price: Number(prod.offerPrice ?? prod.price ?? 0),
        quantity: Number(item.quantity || 1),
        image: prod.image || "",
        vendorId,
        vendorName,
        specs:
          item.options?.size || item.options?.color
            ? `Size: ${item.options?.size || "Standard"} • Color: ${item.options?.color || "Standard"}`
            : "Standard",
        productSnapshot: prod,
      };
    });

    // 3. Group items by distinct vendor
    const vendorMap = {};
    normalizedItems.forEach((item) => {
      const vId = item.vendorId || "nitroxx-default-vendor";
      if (!vendorMap[vId]) {
        vendorMap[vId] = {
          vendorId: vId,
          vendorName: item.vendorName || "Nitroxx Moto Gear",
          items: [],
          totalAmount: 0,
        };
      }
      vendorMap[vId].items.push(item);
      vendorMap[vId].totalAmount += (item.price || 0) * (item.quantity || 1);
    });

    const vendorIds = Object.keys(vendorMap);
    const createdVendorOrders = [];

    const deliveryAddressStr = `${shipping.address || ""}, ${shipping.city || ""}, ${shipping.state || ""} - ${shipping.pincode || ""}`.replace(
      /^,\s*|,\s*$/g,
      ""
    );

    const customerData = {
      uid: userId,
      name: shipping.name || profile?.fullName || user?.fullName || "Valued Customer",
      phone: shipping.phone || profile?.phone || user?.phone || "",
      email: user?.email || profile?.email || "",
    };

    // 4. Create a separate order document in 'orders' collection for EACH vendor
    for (const [vId, vData] of Object.entries(vendorMap)) {
      const vendorOrderId = generateVendorOrderId(); // e.g. ODR123456VNTX
      const orderRef = database.collection(COLLECTIONS.orders || "orders").doc();
      const firstVendorItem = vData.items[0] || {};
      const vendorItemCount = vData.items.reduce((acc, it) => acc + (it.quantity || 1), 0);

      const vendorOrderDoc = {
        id: orderRef.id,
        orderDocId: orderRef.id,
        // Whole Order ID: shared across all vendor orders from this payment
        orderId: wholeOrderId,
        orderID: wholeOrderId,
        // Specific Vendor Order ID: unique per vendor
        vendorOrderId: vendorOrderId,
        orderNumber: vendorOrderId, // Primary ID displayed for this vendor's order
        // Shared payment ID
        paymentId: paymentId,
        payment_id: paymentId,
        razorpayPaymentId: paymentId,
        razorpayOrderId: razorpayOrderId,
        razorpaySignature: razorpaySignature,
        // Vendor info
        vendorId: vId,
        vendorName: vData.vendorName,
        // Customer info
        userId: userId,
        user: customerData,
        customer: customerData,
        // Vendor items only
        items: vData.items,
        itemCount: vendorItemCount,
        itemName: firstVendorItem.name || "Motorcycle Accessory",
        image: firstVendorItem.image || "",
        // Financials for this vendor
        subtotal: vData.totalAmount,
        price: vData.totalAmount,
        total: vData.totalAmount,
        totalAmount: vData.totalAmount,
        vendorTotal: vData.totalAmount,
        overallOrderTotal: totalAmount, // Grand total of full checkout
        // Shipping & delivery
        deliveryAddress: deliveryAddressStr,
        shipping: shipping,
        // Status & payment info
        paymentMethod: "Razorpay Online",
        paymentMode: "Prepaid (Razorpay)",
        paymentStatus: "paid",
        status: "confirmed",
        orderStatus: "confirmed",
        statusMessage: `Your order has been confirmed and is being processed by ${vData.vendorName}.`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // A. Global orders collection (used by vendor dashboard & queries)
      batch.set(orderRef, vendorOrderDoc);

      // B. User subcollections: users/{userId}/orders and users/{userId}/order
      const userOrdersRef = database
        .collection("users")
        .doc(userId)
        .collection("orders")
        .doc(orderRef.id);
      batch.set(userOrdersRef, vendorOrderDoc);

      const userSingularOrderRef = database
        .collection("users")
        .doc(userId)
        .collection("order")
        .doc(orderRef.id);
      batch.set(userSingularOrderRef, vendorOrderDoc);

      // C. Vendor subcollection: vendors/{vendorId}/orders
      const vendorSubcollectionRef = database
        .collection("vendors")
        .doc(vId)
        .collection("orders")
        .doc(orderRef.id);
      batch.set(vendorSubcollectionRef, vendorOrderDoc);

      createdVendorOrders.push({
        docId: orderRef.id,
        vendorOrderId,
        vendorId: vId,
        vendorName: vData.vendorName,
        itemCount: vendorItemCount,
        total: vData.totalAmount,
      });
    }

    // 5. Payment record in 'payments' collection
    const paymentDocRef = database.collection("payments").doc(paymentId);
    const paymentRecord = {
      id: paymentId,
      paymentId: paymentId,
      payment_id: paymentId,
      orderId: wholeOrderId,
      orderID: wholeOrderId,
      vendorOrderIds: createdVendorOrders.map((o) => o.vendorOrderId),
      orderDocIds: createdVendorOrders.map((o) => o.docId),
      razorpayPaymentId: paymentId,
      razorpayOrderId: razorpayOrderId,
      razorpaySignature: razorpaySignature,
      amount: totalAmount,
      currency: "INR",
      status: "captured",
      paymentStatus: "paid",
      paymentMethod: "Razorpay Online",
      paymentMode: "Prepaid (Razorpay)",
      userId: userId,
      customer: customerData,
      user: customerData,
      items: normalizedItems,
      itemCount: normalizedItems.reduce((acc, it) => acc + (it.quantity || 1), 0),
      vendorIds: vendorIds,
      vendorOrders: createdVendorOrders,
      deliveryAddress: deliveryAddressStr,
      shipping: shipping,
      type: "store_order",
      source: "nitroxxin-web",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    batch.set(paymentDocRef, paymentRecord);

    // 6. User transaction record in users/{userId}/transactions
    const transactionDocRef = database
      .collection("users")
      .doc(userId)
      .collection("transactions")
      .doc(paymentId);
    const transactionData = {
      id: paymentId,
      transactionId: paymentId,
      orderId: wholeOrderId,
      orderID: wholeOrderId,
      vendorOrderIds: createdVendorOrders.map((o) => o.vendorOrderId),
      paymentId: paymentId,
      payment_id: paymentId,
      title: `Store Order #${wholeOrderId}`,
      category: "order",
      type: "debit",
      amount: totalAmount,
      currency: "INR",
      status: "success",
      paymentMethod: "Razorpay Online",
      dateText: `on ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}, at ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase()}`,
      itemCount: normalizedItems.reduce((acc, it) => acc + (it.quantity || 1), 0),
      description: `Payment for Order #${wholeOrderId} (${createdVendorOrders.length} packages from ${vendorIds.length} vendors)`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    batch.set(transactionDocRef, transactionData);

    // 7. Clear cart items for this user
    cartItems.forEach((item) => {
      if (item.id) {
        batch.delete(database.collection("users").doc(userId).collection("cart").doc(item.id));
        batch.delete(database.collection("user").doc(userId).collection("cart").doc(item.id));
        batch.delete(database.collection("cart").doc(item.id));
      }
    });

    await batch.commit();

    console.log("Multi-vendor order placed successfully!", {
      wholeOrderId,
      paymentId,
      vendorOrders: createdVendorOrders,
    });

    return {
      success: true,
      orderId: wholeOrderId,
      orderID: wholeOrderId,
      paymentId: paymentId,
      payment_id: paymentId,
      vendorOrders: createdVendorOrders,
      vendorOrderIds: createdVendorOrders.map((o) => o.vendorOrderId),
    };
  } catch (error) {
    console.error("Error adding order to Firestore:", error);
    throw error;
  }
};

/**
 * Fetches all vendor order documents belonging to a payment_id / paymentId
 */
export const getOrdersByPaymentId = async (paymentId) => {
  if (!paymentId) return [];
  try {
    const snap1 = await db()
      .collection(COLLECTIONS.orders || "orders")
      .where("paymentId", "==", paymentId)
      .get();
    if (!snap1.empty) {
      return snap1.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    const snap2 = await db()
      .collection(COLLECTIONS.orders || "orders")
      .where("payment_id", "==", paymentId)
      .get();
    return snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error fetching orders by paymentId:", err);
    return [];
  }
};

/**
 * Fetches all vendor order documents belonging to an orderId / orderID
 */
export const getOrdersByOrderId = async (orderId) => {
  if (!orderId) return [];
  try {
    const snap1 = await db()
      .collection(COLLECTIONS.orders || "orders")
      .where("orderId", "==", orderId)
      .get();
    if (!snap1.empty) {
      return snap1.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
    const snap2 = await db()
      .collection(COLLECTIONS.orders || "orders")
      .where("orderID", "==", orderId)
      .get();
    return snap2.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Error fetching orders by orderId:", err);
    return [];
  }
};
