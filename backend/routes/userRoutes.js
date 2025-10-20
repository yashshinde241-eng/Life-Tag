// backend/routes/userRoutes.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Patient } = require("../models");
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

// Patient registration
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, age, gender } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "fullName, email and password are required" });
    }

    const existing = await Patient.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const patient = await Patient.create({
      fullName,
      email,
      password: hashed,
      age: age || null,
      gender: gender || null,
    });

    res.status(201).json({ message: "Patient registered successfully", patientId: patient.id });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Patient login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const patient = await Patient.findOne({ where: { email } });
    if (!patient) return res.status(404).json({ message: "Patient not found" });

    const ok = await bcrypt.compare(password, patient.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: patient.id, role: "patient" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ message: "Login successful", token, patientId: patient.id });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Protected: get patient profile
router.get("/profile", authMiddleware(["patient"]), async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.user.id, { attributes: { exclude: ["password"] } });
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json({ patient });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
