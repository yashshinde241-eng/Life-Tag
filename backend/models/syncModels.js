// Import models and database connection
const sequelize = require("./db");
const User = require("./Patient");
const Doctor = require("./Doctor");
const MedicalRecord = require("./MedicalRecord");

// Wrap all async code in a function
async function syncAll() {
  try {
    // Test DB connection
    await sequelize.authenticate();
    console.log("✅ Database connection successful!");

    // Sync all models
    await User.sync({ alter: true });
    await Doctor.sync({ alter: true });
    await MedicalRecord.sync({ alter: true });

    console.log("✅ All models were synchronized successfully!");
    process.exit(0); // Exit after success
  } catch (err) {
    console.error(err);
    process.exit(1); // Exit on error
  }
}

// Call the async function
syncAll();
