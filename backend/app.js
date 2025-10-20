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
app.use("/uploads", express.static("uploads"));

// 🧩 Mount routes
app.use("/api/users", userRoutes);       // ✅ Patient routes
app.use("/api/doctors", doctorRoutes);   // ✅ Doctor routes
app.use("/api/records", medicalRecordRoutes); // ✅ Report upload/view

module.exports = app;
