// backend/models/index.js
const sequelize = require("./db");
const Patient = require("./Patient");
const Doctor = require("./Doctor");
const MedicalRecord = require("./MedicalRecord");

module.exports = {
  sequelize,
  Patient,
  Doctor,
  MedicalRecord,
};
