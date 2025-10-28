// backend/routes/userRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs"); // Or 'bcrypt' if that's what you installed
const jwt = require("jsonwebtoken");
const { Patient } = require("../models"); // Ensure Patient model is imported
const authMiddleware = require("../middleware/authMiddleware"); // Assuming you use this
require("dotenv").config();

const router = express.Router();

// --- Helper function to generate a 7-digit number ---
function generate7DigitId() {
  // Generates a number between 1,000,000 and 9,999,999
  return Math.floor(1000000 + Math.random() * 9000000);
}
// --- End Helper ---


// POST /api/users/register
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, age, gender } = req.body;

    // Basic validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email, and password are required" });
    }

    // Check if email already exists
    const existingPatient = await Patient.findOne({ where: { email } });
    if (existingPatient) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // --- GENERATE UNIQUE patientTagId ---
    let patientTagId;
    let isUnique = false;
    let attempts = 0; // Prevent infinite loop
    const MAX_ATTEMPTS = 10;

    do {
      patientTagId = generate7DigitId();
      // Check if this patientTagId already exists
      const existingTagId = await Patient.findOne({ where: { patientTagId }, attributes: ['id'] });
      if (!existingTagId) {
        isUnique = true; // Found a unique ID
      }
      attempts++;
    } while (!isUnique && attempts < MAX_ATTEMPTS); // Loop until unique or max attempts

    if (!isUnique) {
      // Handle the rare case where we couldn't find a unique ID
      console.error("Failed to generate a unique patientTagId after multiple attempts.");
      return res.status(500).json({ message: "Could not generate unique patient ID. Please try again later." });
    }
    // --- END ID GENERATION ---


    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new patient WITH the unique tag ID
    const newPatient = await Patient.create({
      fullName,
      email,
      password: hashedPassword,
      age: age || null,
      gender: gender || null,
      patientTagId: patientTagId, // Assign the generated ID
    });

    // --- UPDATED RESPONSE ---
    res.status(201).json({
      message: "Patient registered successfully",
      // patientId: newPatient.id, // DO NOT return internal ID
      patientTagId: newPatient.patientTagId // Return the 7-digit ID
    });
    // --- END UPDATED RESPONSE ---

  } catch (err) {
    console.error("Patient registration error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/users/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find patient by email
    const patient = await Patient.findOne({ where: { email } });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Compare submitted password with stored hash
    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token (still uses internal ID for security/lookup)
    const token = jwt.sign(
      { id: patient.id, role: "patient" }, // Payload uses internal ID
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // Token expires in 1 day
    );

    // --- UPDATED RESPONSE ---
    // Send successful login response
    res.json({
      message: "Login successful",
      token,
      // patientId: patient.id, // DO NOT return internal ID
      patientTagId: patient.patientTagId // Return the 7-digit ID
    });
    // --- END UPDATED RESPONSE ---

  } catch (err) {
    console.error("Patient login error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/users/profile
// Protected route to get the logged-in patient's profile
router.get("/profile", authMiddleware(["patient"]), async (req, res) => {
  try {
    // req.user.id (internal ID) comes from the authMiddleware
    const patient = await Patient.findByPk(req.user.id, {
      // Exclude password and internal ID from the response
      attributes: { exclude: ["password", "id"] }
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient profile not found" });
    }
    // Send the patient profile data (includes patientTagId now)
    res.json({ patient });

  } catch (err) {
    console.error("Get patient profile error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;