// backend/models/Patient.js
const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Patient = sequelize.define(
  "Patient",
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    age: { type: DataTypes.INTEGER, allowNull: true },
    gender: { type: DataTypes.STRING, allowNull: true },
    password: { type: DataTypes.STRING, allowNull: false }, // hashed
  },
  {
    tableName: "patients",
    timestamps: true,
  }
);

module.exports = Patient;
