import { db, COLLECTIONS, serverTimestamp } from "../services/firebase";
import { normalizeProduct } from "../services/normalizers";

/**
 * Saves completed order to Firestore and clears the user's cart
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

  function generateOrderId() {
    const randomNum = Math.floor(10000000 + Math.random() * 90000000);
    return `OD${randomNum}`;
  }

  const orderNumber = generateOrderId();

  try {
    const database = db();
    const batch = database.batch();

    // 1. Normalize items for order record
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

    const firstItem = normalizedItems[0] || {};

    // Group items by vendor
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
    const primaryVendorId = vendorIds[0] || "nitroxx-default-vendor";
    const primaryVendorName = vendorMap[primaryVendorId]?.vendorName || "Nitroxx Moto Gear";

    const orderData = {
      orderId: orderNumber,
      orderNumber: orderNumber,
      userId: userId,
      user: {
        uid: userId,
        name: shipping.name || profile?.fullName || user?.fullName || "Valued Customer",
        phone: shipping.phone || profile?.phone || user?.phone || "",
        email: user?.email || profile?.email || "",
      },
      customer: {
        uid: userId,
        name: shipping.name || profile?.fullName || user?.fullName || "Valued Customer",
        phone: shipping.phone || profile?.phone || user?.phone || "",
        email: user?.email || profile?.email || "",
      },
      items: normalizedItems,
      itemCount: normalizedItems.reduce((acc, it) => acc + (it.quantity || 1), 0),
      itemName: firstItem.name || "Motorcycle Accessory",
      image: firstItem.image || "",
      price: totalAmount,
      total: totalAmount,
      totalAmount: totalAmount,
      vendorId: primaryVendorId,
      vendorName: primaryVendorName,
      vendorIds: vendorIds,
      deliveryAddress: `${shipping.address || ""}, ${shipping.city || ""}, ${shipping.state || ""} - ${shipping.pincode || ""}`.replace(
        /^,\s*|,\s*$/g,
        ""
      ),
      shipping: shipping,
      paymentMethod: "Razorpay Online",
      paymentMode: "Prepaid (Razorpay)",
      paymentStatus: "paid",
      paymentId: paymentDetails.razorpay_payment_id || paymentDetails.paymentId || "rzp_paid",
      razorpayOrderId: paymentDetails.razorpay_order_id || paymentDetails.orderId || "",
      razorpaySignature: paymentDetails.razorpay_signature || "",
      status: "confirmed",
      orderStatus: "confirmed",
      statusMessage: "Your order has been confirmed and is being processed.",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 2. Add to global orders collection (used by MyOrders.js)
    const newOrderRef = database.collection(COLLECTIONS.orders || "orders").doc();
    batch.set(newOrderRef, { id: newOrderRef.id, ...orderData });

    // 3. Add to user-specific subcollection users/{userId}/order and user/{userId}/order
    const userOrderRef = database
      .collection("users")
      .doc(userId)
      .collection("order")
      .doc(newOrderRef.id);
    batch.set(userOrderRef, { id: newOrderRef.id, ...orderData });

    const userSingularOrderRef = database
      .collection("user")
      .doc(userId)
      .collection("order")
      .doc(newOrderRef.id);
    batch.set(userSingularOrderRef, { id: newOrderRef.id, ...orderData });

    // Also plural users/{userId}/orders for backwards compatibility
    const userPluralOrdersRef = database
      .collection("users")
      .doc(userId)
      .collection("orders")
      .doc(newOrderRef.id);
    batch.set(userPluralOrdersRef, { id: newOrderRef.id, ...orderData });

    // 4. Add to vendor-specific collection: vendor/{vendorId}/order and vendors/{vendorId}/orders
    for (const [vId, vData] of Object.entries(vendorMap)) {
      const vendorOrderData = {
        ...orderData,
        id: newOrderRef.id,
        orderDocId: newOrderRef.id,
        vendorId: vId,
        vendorName: vData.vendorName,
        items: vData.items,
        itemCount: vData.items.reduce((acc, it) => acc + (it.quantity || 1), 0),
        subtotal: vData.totalAmount,
        vendorTotal: vData.totalAmount,
      };

      // Exact path requested: vendor/{vendorId}/order/{orderId}
      const vendorSingleRef = database
        .collection("vendor")
        .doc(vId)
        .collection("order")
        .doc(newOrderRef.id);
      batch.set(vendorSingleRef, vendorOrderData);

      // Plural standard path: vendors/{vendorId}/orders/{orderId}
      const vendorsPluralRef = database
        .collection("vendors")
        .doc(vId)
        .collection("orders")
        .doc(newOrderRef.id);
      batch.set(vendorsPluralRef, vendorOrderData);

      // Also vendor/{vendorId}/orders and vendors/{vendorId}/order for full compatibility
      const vendorPluralRef = database
        .collection("vendor")
        .doc(vId)
        .collection("orders")
        .doc(newOrderRef.id);
      batch.set(vendorPluralRef, vendorOrderData);

      const vendorsSingleRef = database
        .collection("vendors")
        .doc(vId)
        .collection("order")
        .doc(newOrderRef.id);
      batch.set(vendorsSingleRef, vendorOrderData);
    }

    // 5. Advance order payment detail in payment & payments collection for super-admin
    const advancePaymentData = {
      id: newOrderRef.id,
      orderDocId: newOrderRef.id,
      orderId: orderNumber,
      orderNumber: orderNumber,
      paymentId: orderData.paymentId,
      razorpayPaymentId: paymentDetails.razorpay_payment_id || orderData.paymentId || "",
      razorpayOrderId: orderData.razorpayOrderId || "",
      razorpaySignature: orderData.razorpaySignature || "",
      amount: totalAmount,
      currency: "INR",
      status: "captured",
      paymentStatus: "paid",
      paymentMethod: "Razorpay Online",
      paymentMode: orderData.paymentMode || "Prepaid (Razorpay)",
      userId: userId,
      customer: orderData.customer,
      user: orderData.user,
      itemCount: orderData.itemCount,
      items: normalizedItems,
      primaryVendorId: primaryVendorId,
      primaryVendorName: primaryVendorName,
      vendorIds: vendorIds,
      deliveryAddress: orderData.deliveryAddress,
      shipping: orderData.shipping,
      type: "store_order",
      source: "nitroxxin-web",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    batch.set(database.collection("payment").doc(newOrderRef.id), advancePaymentData);
    batch.set(database.collection("payments").doc(newOrderRef.id), advancePaymentData);

    // 6. Basic order payment detail in user/userId/transactions and users/userId/transactions
    const basicTransactionData = {
      id: newOrderRef.id,
      transactionId: paymentDetails.razorpay_payment_id || `TXN-${orderNumber}`,
      orderId: orderNumber,
      orderDocId: newOrderRef.id,
      title: firstItem.name ? `Order Payment - ${firstItem.name}` : `Store Order #${orderNumber}`,
      category: "order",
      type: "debit",
      amount: totalAmount,
      currency: "INR",
      status: "success",
      paymentMethod: "Razorpay Online",
      paymentId: paymentDetails.razorpay_payment_id || orderData.paymentId || "",
      dateText: `on ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}, at ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase()}`,
      itemCount: orderData.itemCount,
      description: `Payment for Order #${orderNumber} (${normalizedItems.length} items)`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    batch.set(
      database.collection("users").doc(userId).collection("transactions").doc(newOrderRef.id),
      basicTransactionData
    );
    batch.set(
      database.collection("user").doc(userId).collection("transactions").doc(newOrderRef.id),
      basicTransactionData
    );
    batch.set(
      database.collection("users").doc(userId).collection("wallet_transactions").doc(newOrderRef.id),
      basicTransactionData
    );

    // 6. Clear cart items for this user from user/userId/cart
    cartItems.forEach((item) => {
      if (item.id) {
        batch.delete(database.collection("user").doc(userId).collection("cart").doc(item.id));
        batch.delete(database.collection("users").doc(userId).collection("cart").doc(item.id));
        try {
          batch.delete(database.collection(COLLECTIONS.cart || "cart").doc(item.id));
        } catch (e) {}
      }
    });

    await batch.commit();
    console.log("Order placed successfully with ID:", orderNumber, "for vendors:", vendorIds);
    return { success: true, orderId: orderNumber, docId: newOrderRef.id, vendorIds };
  } catch (error) {
    console.error("Error adding order to Firestore:", error);
    throw error;
  }
};
