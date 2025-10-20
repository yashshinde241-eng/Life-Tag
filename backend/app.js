// backend/app.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const userRoutes = require("./routes/userRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files statically (so you can download encrypted blobs if needed)
app.use("/uploads", express.static("uploads"));

// Mount API routes
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/records", medicalRecordRoutes);

// Root health check
app.get("/", (req, res) => {
  res.json({ message: "Life-Tag backend: healthy ✅" });
});

module.exports = app;
