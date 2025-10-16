require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");

// Import routes
const userRoutes = require("./routes/userRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/records", medicalRecordRoutes);



// Default route
app.get("/", (req, res) => {
  res.send("LifeTag Backend is running 🚀");
});

// Start server
const PORT = process.env.PORT || 5000;
sequelize.sync().then(() => {
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
});
