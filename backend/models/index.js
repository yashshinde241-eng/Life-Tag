// backend/models/index.js
const sequelize = require("./db");
const Patient = require("./Patient");
const Doctor = require("./Doctor");
const MedicalRecord = require("./MedicalRecord");
const AccessRequest = require("./AccessRequest");

// ✅ Define associations

// Doctor–MedicalRecord relationship
Doctor.hasMany(MedicalRecord, { foreignKey: "doctorId" });
MedicalRecord.belongsTo(Doctor, { foreignKey: "doctorId" });

// Patient–MedicalRecord relationship
Patient.hasMany(MedicalRecord, { foreignKey: "patientId" });
MedicalRecord.belongsTo(Patient, { foreignKey: "patientId" });

// ✅ Doctor–AccessRequest relationship
Doctor.hasMany(AccessRequest, { foreignKey: "doctorId" });
AccessRequest.belongsTo(Doctor, { foreignKey: "doctorId" });

// ✅ Patient–AccessRequest relationship
Patient.hasMany(AccessRequest, { foreignKey: "patientId" });
AccessRequest.belongsTo(Patient, { foreignKey: "patientId" });

// Export all models
module.exports = {
  sequelize,
  Patient,
  Doctor,
  MedicalRecord,
  AccessRequest,
};
