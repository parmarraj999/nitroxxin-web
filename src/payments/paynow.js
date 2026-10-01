import { makePayment } from "./makePayment";

/**
 * Backwards-compatible paynow wrapper
 */
export const handlePayment = async (amount, orderData = {}, navigate, setLoading, preCreatedOrder = null) => {
  return makePayment({
    amount,
    cartItems: orderData.cartItems || orderData.product || orderData.products || [],
    user: orderData.user || orderData.userData,
    profile: orderData.profile,
    shipping: orderData.shipping || orderData.address || {},
    navigate,
    setLoading: setLoading || (() => {}),
    onError: (err) => console.error("Payment error:", err),
    onSuccess: (res) => console.log("Payment success:", res),
  });
};

const PayNow = ({ amount, orderData, navigate, setLoading }) => {
  return (
    <button onClick={() => handlePayment(amount, orderData, navigate, setLoading)}>
      Pay Now
    </button>
  );
};

export default PayNow;
