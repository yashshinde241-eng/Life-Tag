// backend/models/Doctor.js
const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Doctor = sequelize.define(
  "Doctor",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    specialization: { type: DataTypes.STRING, allowNull: false },
    hospital: { type: DataTypes.STRING, allowNull: true },
    password: { type: DataTypes.STRING, allowNull: false }, // hashed
  },
  {
    tableName: "doctors",
    timestamps: true,
  }
);

module.exports = Doctor;
