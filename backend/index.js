// Import required packages
const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Initialize the Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic test route
app.get("/", (req, res) => {
  res.send("✅ Life-Tag backend server is running successfully!");
});

// Server listen on port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
