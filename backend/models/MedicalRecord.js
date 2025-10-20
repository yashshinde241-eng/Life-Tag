const { DataTypes } = require("sequelize");
const sequelize = require("./db");
const Doctor = require("./Doctor");
const Patient = require("./Patient");

const MedicalRecord = sequelize.define("MedicalRecord", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  filePath: { type: DataTypes.STRING, allowNull: false },
});

Doctor.hasMany(MedicalRecord, { foreignKey: "doctorId" });
Patient.hasMany(MedicalRecord, { foreignKey: "patientId" });
MedicalRecord.belongsTo(Doctor, { foreignKey: "doctorId" });
MedicalRecord.belongsTo(Patient, { foreignKey: "patientId" });

module.exports = MedicalRecord;
