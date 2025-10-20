const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Doctor } = require("../models");
require("dotenv").config();

const router = express.Router();

// 🩺 Register Doctor
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, specialization, hospital, password } = req.body;
    const existingDoctor = await Doctor.findOne({ where: { email } });
    if (existingDoctor)
      return res.status(400).json({ error: "Doctor already registered with this email" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newDoctor = await Doctor.create({
      fullName,
      email,
      specialization,
      hospital,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Doctor registered successfully",
      doctor: newDoctor,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔑 Login Doctor
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ where: { email } });

    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: doctor.id, role: "doctor" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Doctor login successful",
      token,
      doctorId: doctor.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
