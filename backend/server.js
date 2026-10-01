const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const paymentRoutes = require("./routes/paymentRoutes");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
// app.use("/api/payment", paymentRoutes);

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://brandstuck-server.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use("/api/payment", paymentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
