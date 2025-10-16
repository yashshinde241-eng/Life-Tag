const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Patient = sequelize.define("Patient", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  tableName: "patients",
  timestamps: true,
});

module.exports = Patient;
