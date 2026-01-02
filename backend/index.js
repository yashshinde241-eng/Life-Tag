// backend/index.js
const app = require("./app");
const { sequelize } = require("./models"); // ensures models/index exports sequelize if needed
require("dotenv").config();

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // ensure DB connection
    await sequelize.authenticate();
    console.log("✅ Database connection successful!");
    // await sequelize.sync();
    // console.log("✅ Database tables synced!");
    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

start();
