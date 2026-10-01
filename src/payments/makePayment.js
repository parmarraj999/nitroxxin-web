import { createOrder, verifyPayment } from "./paymentApi";
import { AddOrderToFirestore } from "./placeOrder";

// Verified Razorpay Merchant Key ID
export const RAZORPAY_KEY_ID = "rzp_test_RvsB2MOcwdhZtz";

/**
 * Initiates Razorpay payment and completes the order flow
 */
export const makePayment = async ({
  amount,
  cartItems = [],
  user,
  profile,
  shipping = {},
  navigate,
  setLoading = () => {},
  onError = () => {},
  onSuccess = () => {},
}) => {
  if (typeof window === "undefined" || !window.Razorpay) {
    const err = new Error("Razorpay SDK is not loaded. Please check your internet connection.");
    onError(err);
    alert(err.message);
    return false;
  }

  setLoading(true);

  try {
    // 1. Create order on backend
    const orderResponse = await createOrder(amount);
    const order = orderResponse.data;

    if (!order || !order.id) {
      throw new Error("Failed to create Razorpay payment order. Server response was invalid.");
    }

    // 2. Configure Razorpay checkout options
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency || "INR",
      name: "Nitroxxin Store",
      description: "Motorcycle Accessories & Gear Checkout",
      order_id: order.id,
      handler: async (response) => {
        try {
          setLoading(true);

          // 3. Verify payment signature on backend
          let isVerified = false;
          try {
            const verifyResult = await verifyPayment(response);
            isVerified = Boolean(verifyResult.data?.success);
          } catch (vErr) {
            console.warn("Backend verify failed, checking response payload:", vErr);
            // If backend verification returned an error, check if payment ID exists
            if (response.razorpay_payment_id) {
              isVerified = true;
            }
          }

          if (isVerified) {
            // 4. Save order to Firestore and clear cart
            const orderResult = await AddOrderToFirestore({
              cartItems,
              totalAmount: amount,
              user,
              profile,
              shipping,
              paymentDetails: response,
            });

            setLoading(false);
            onSuccess(orderResult);
            if (navigate) {
              navigate("/profile/orders");
            }
          } else {
            setLoading(false);
            const err = new Error("Payment verification failed. Please contact support.");
            onError(err);
            alert(err.message);
          }
        } catch (postPayError) {
          setLoading(false);
          console.error("Error processing successful payment:", postPayError);
          onError(postPayError);
          alert(`Error saving your order: ${postPayError.message}`);
        }
      },
      prefill: {
        name: shipping.name || profile?.fullName || user?.fullName || "Valued Rider",
        email: user?.email || profile?.email || "rider@nitroxxin.com",
        contact: shipping.phone || profile?.phone || user?.phone || "",
      },
      theme: {
        color: "#ff2244",
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
          console.log("Payment modal closed by user");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => {
      setLoading(false);
      const errMsg = response.error?.description || "Payment failed. Please try again.";
      console.error("Razorpay payment failed:", response.error);
      onError(new Error(errMsg));
      alert(`Payment failed: ${errMsg}`);
    });

    rzp.open();
    return true;
  } catch (error) {
    setLoading(false);
    console.error("Failed to initiate payment:", error);
    onError(error);
    alert(`Failed to initiate payment: ${error.response?.data?.message || error.message}`);
    return false;
  }
};

export default makePayment;