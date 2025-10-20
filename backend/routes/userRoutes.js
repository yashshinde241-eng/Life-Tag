const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Patient } = require("../models");
require("dotenv").config();

const router = express.Router();

// 🧾 Register Patient
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, age, gender, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newPatient = await Patient.create({
      fullName, email, age, gender, password: hashedPassword,
    });
    res.status(201).json({ message: "Patient registered successfully!", newPatient });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 🔑 Login Patient
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const patient = await Patient.findOne({ where: { email } });

    if (!patient) return res.status(404).json({ error: "Patient not found" });
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: patient.id, role: "patient" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
