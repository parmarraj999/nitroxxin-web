const instance = require("../config/razorpayInstance");
const db = require("../config/firebaseConfig");
const crypto = require("crypto");


const createOrder = async (req, res) => {
  const { amount } = req.body;

  const order = await instance.orders.create({
    amount: amount * 100,
    currency: "INR",
  });

  res.json(order);
};

const verifyPayment = (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", "omjvsYGToOGanR4z72vKsSS9")
    .update(body)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
};

module.exports = { createOrder, verifyPayment };