const sequelize = require("./db");
const Patient = require("./Patient");
const Doctor = require("./Doctor");
const MedicalRecord = require("./MedicalRecord");

(async () => {
  try {
    await sequelize.sync({ alter: true }); // 'alter' updates tables if they exist
    console.log("✅ All models were synchronized successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error syncing models:", error);
    process.exit(1);
  }
})();
