// backend/models/syncModels.js
const sequelize = require("./db");
const Patient = require("./Patient");
const Doctor = require("./Doctor");
const MedicalRecord = require("./MedicalRecord");
const AccessRequest = require("./AccessRequest");

async function syncAll() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection successful!");

    // sync with alter true to update table structure as per models
    await Patient.sync({ force: true });
    await Doctor.sync({ force: true });
    await MedicalRecord.sync({ force: true });
    await AccessRequest.sync({ force: true });

    console.log("✅ All models were synchronized successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error syncing models:", err);
    process.exit(1);
  }
}

syncAll();
