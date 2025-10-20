const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Doctor = sequelize.define("Doctor", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  fullName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  specialization: { type: DataTypes.STRING, allowNull: false },
  hospital: { type: DataTypes.STRING },
  password: { type: DataTypes.STRING, allowNull: false },
});

module.exports = Doctor;
