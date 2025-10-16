const express = require("express");
const router = express.Router();
const multer = require("multer");
const CryptoJS = require("crypto-js");
const { MedicalRecord, Doctor, User } = require("../models");

// Configure multer for file upload
const storage = multer.memoryStorage(); // store in memory for encryption
const upload = multer({ storage });

// Doctor uploads medical record
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { patientId, doctorId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "No file uploaded" });

    // Encrypt file content (as Base64 string)
    const encryptedData = CryptoJS.AES.encrypt(file.buffer.toString("base64"), process.env.ENCRYPTION_KEY).toString();

    // Save to database
    const record = await MedicalRecord.create({
      patientId,
      doctorId,
      fileName: file.originalname,
      encryptedData
    });

    res.status(201).json({ message: "Medical record uploaded successfully", record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
