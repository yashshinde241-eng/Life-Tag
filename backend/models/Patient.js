// backend/models/Patient.js
const { DataTypes } = require("sequelize");
const sequelize = require("./db"); // Assuming './db' is your Sequelize connection setup

const Patient = sequelize.define(
  "Patient",
  {
    id: { // Internal Primary Key (keep this)
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    patientTagId: { // New Public-Facing ID
      type: DataTypes.INTEGER,
      allowNull: false, // Must have a value
      unique: true,     // Must be unique
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true // Ensure email is also unique
    },
    password: { // Hashed password
      type: DataTypes.STRING,
      allowNull: false
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true // Optional
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true // Optional
    },
    // createdAt and updatedAt are added automatically by timestamps: true
  },
  {
    tableName: "patients", // Make sure this matches your DB table name
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Define associations after defining the model
// Example: If a Patient has many Medical Records
// Patient.hasMany(require('./MedicalRecord'), { foreignKey: 'patientId' });

module.exports = Patient;