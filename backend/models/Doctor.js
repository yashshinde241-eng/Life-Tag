const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Doctor = sequelize.define("Doctor", {
  fullName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  specialization: { type: DataTypes.STRING, allowNull: false },
  hospital: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false }, // ✅ Must match exactly
});

module.exports = Doctor;
