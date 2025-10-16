const { DataTypes } = require("sequelize");
const sequelize = require("./db");
const Patient = require("./Patient");
const Doctor = require("./Doctor");

const MedicalRecord = sequelize.define("MedicalRecord", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  recordType: {
    type: DataTypes.STRING,
    allowNull: false, // e.g., "Blood Report", "X-Ray", etc.
  },
  uploadDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: "medical_records",
  timestamps: true,
});

// Define relationships
Patient.hasMany(MedicalRecord, { foreignKey: "patientId" });
MedicalRecord.belongsTo(Patient, { foreignKey: "patientId" });

Doctor.hasMany(MedicalRecord, { foreignKey: "doctorId" });
MedicalRecord.belongsTo(Doctor, { foreignKey: "doctorId" });

module.exports = MedicalRecord;