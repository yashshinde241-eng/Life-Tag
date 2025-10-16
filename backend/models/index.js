const sequelize = require("./db");
const User = require("./Patient");    // Make sure this matches your patient model file name
const Doctor = require("./Doctor");
const MedicalRecord = require("./MedicalRecord");

module.exports = {
  sequelize,
  User,      // ✅ export as User
  Doctor,
  MedicalRecord
};
