// backend/routes/doctorRoutes.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Doctor } = require("../models");
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

// Doctor registration
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, specialization, hospital, password } = req.body;
    if (!fullName || !email || !specialization || !password) {
      return res.status(400).json({ message: "missing required fields" });
    }

    const existing = await Doctor.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const doctor = await Doctor.create({
      fullName,
      email,
      specialization,
      hospital: hospital || null,
      password: hashed,
    });

    res.status(201).json({ message: "Doctor registered successfully", doctorId: doctor.id });
  } catch (err) {
    console.error("Doctor register error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Doctor login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ where: { email } });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const ok = await bcrypt.compare(password, doctor.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: doctor.id, role: "doctor" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ message: "Login successful", token, doctorId: doctor.id });
  } catch (err) {
    console.error("Doctor login error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Protected: get doctor profile
router.get("/profile", authMiddleware(["doctor"]), async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.user.id, { attributes: { exclude: ["password"] } });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json({ doctor });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
