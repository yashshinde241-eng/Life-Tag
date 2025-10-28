// backend/models/MedicalRecord.js
const { DataTypes } = require("sequelize");
const sequelize = require("./db");
const Doctor = require("./Doctor");
const Patient = require("./Patient");

const MedicalRecord = sequelize.define(
  "MedicalRecord",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    doctorId: { type: DataTypes.INTEGER, allowNull: true },
    fileName: { type: DataTypes.STRING, allowNull: false },
    filePath: { type: DataTypes.STRING, allowNull: true }, // local storage path (uploads/)
    encryptedData: { type: DataTypes.TEXT, allowNull: true },
    s3Key: { type: DataTypes.STRING, allowNull: true },
    recordType: { type: DataTypes.STRING, allowNull: true }, // e.g., Prescription, Lab Report
  },
  {
    tableName: "medical_records",
    timestamps: true,
  }
);

// Associations
Doctor.hasMany(MedicalRecord, { foreignKey: "doctorId" });
Patient.hasMany(MedicalRecord, { foreignKey: "patientId" });
MedicalRecord.belongsTo(Doctor, { foreignKey: "doctorId" });
MedicalRecord.belongsTo(Patient, { foreignKey: "patientId" });

module.exports = MedicalRecord;
