const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Patient = sequelize.define("Patient", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  fullName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  age: { type: DataTypes.INTEGER },
  gender: { type: DataTypes.STRING },
  password: { type: DataTypes.STRING, allowNull: false },
});

module.exports = Patient;
