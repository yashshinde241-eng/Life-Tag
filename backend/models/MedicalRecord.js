const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const MedicalRecord = sequelize.define("MedicalRecord", {
  patientId: { type: DataTypes.INTEGER, allowNull: false },
  doctorId: { type: DataTypes.INTEGER, allowNull: false },
  fileName: { type: DataTypes.STRING, allowNull: false },
  encryptedData: { type: DataTypes.TEXT, allowNull: false },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

module.exports = MedicalRecord;
