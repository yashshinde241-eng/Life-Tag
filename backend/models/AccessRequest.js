// backend/models/AccessRequest.js
const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const AccessRequest = sequelize.define(
  "AccessRequest",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    doctorId: { type: DataTypes.INTEGER, allowNull: false },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "expired"),
      allowNull: false,
      defaultValue: "pending",
    },
    // When approved, this defines when access ends
    expiresAt: { type: DataTypes.DATE, allowNull: true },
    // optional notes
    notes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    tableName: "access_requests",
    timestamps: true,
  }
);

module.exports = AccessRequest;
