const express = require("express");
const router = express.Router();
const { Doctor } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ Doctor Registration
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, specialization, hospital, password } = req.body;

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ where: { email } });
    if (existingDoctor) return res.status(400).json({ message: "Doctor already exists" });

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Save doctor with hashed password
    const newDoctor = await Doctor.create({
      fullName,
      email,
      specialization,
      hospital,
      password: hashedPassword
    });

    res.status(201).json({ message: "Doctor registered successfully", doctor: newDoctor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// ✅ Doctor Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ where: { email } });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const validPassword = await bcrypt.compare(password, doctor.password);
    if (!validPassword) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: doctor.id, role: "doctor" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Protected route: Get doctor profile
router.get("/profile", authMiddleware(["doctor"]), async (req, res) => {
  try {
    const doctor = await Doctor.findByPk(req.user.id, {
      attributes: { exclude: ["password"] } // don't send password
    });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    res.json({ doctor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
