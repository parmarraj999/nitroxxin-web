import axios from "axios";

// Determine API base URL (supports local dev server port 5000 and Render production backend)
const getBaseUrl = () => {
  if (process.env.REACT_APP_PAYMENT_API_URL) {
    return process.env.REACT_APP_PAYMENT_API_URL;
  }
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:5000";
  }
  return "https://brandstuck-server.onrender.com";
};

const API = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
});

export const createOrder = async (amount) => {
  const numericAmount = Math.round(Number(amount) || 0);
  try {
    return await API.post("/api/payment/create-order", { amount: numericAmount });
  } catch (err) {
    const fallbackUrl = "https://brandstuck-server.onrender.com";
    if (API.defaults.baseURL !== fallbackUrl) {
      console.warn("Retrying create-order with fallback backend:", fallbackUrl);
      return await axios.post(
        `${fallbackUrl}/api/payment/create-order`,
        { amount: numericAmount },
        { timeout: 15000 }
      );
    }
    throw err;
  }
};

export const pingServer = () => API.get("/");

export const verifyPayment = async (data) => {
  try {
    return await API.post("/api/payment/verify-payment", data);
  } catch (err) {
    const fallbackUrl = "https://brandstuck-server.onrender.com";
    if (API.defaults.baseURL !== fallbackUrl) {
      console.warn("Retrying verify-payment with fallback backend:", fallbackUrl);
      return await axios.post(`${fallbackUrl}/api/payment/verify-payment`, data, { timeout: 15000 });
    }
    throw err;
  }
};

export default API;
