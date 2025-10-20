// backend/routes/medicalRecordRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const CryptoJS = require("crypto-js");
const { MedicalRecord, Doctor, Patient } = require("../models");
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config();

const router = express.Router();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer disk storage (saves file to uploads/)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const safeName = `${Date.now()}_${file.fieldname}${path.extname(file.originalname)}`;
    cb(null, safeName);
  },
});
const upload = multer({ storage: storage });

// Doctor uploads a medical record for a patient
// Requires: Authorization: Bearer <doctor_token>
// Form-data: patientId (text), recordType (text, optional), file (file)
router.post("/upload", authMiddleware(["doctor"]), upload.single("file"), async (req, res) => {
  try {
    const doctorId = req.user.id; // from token
    const { patientId, recordType } = req.body;
    const file = req.file;

    if (!patientId) return res.status(400).json({ message: "patientId is required" });
    if (!file) return res.status(400).json({ message: "file is required" });

    // Read file as binary and encrypt its base64 string
    const fileBuffer = fs.readFileSync(file.path);
    const fileBase64 = fileBuffer.toString("base64");
    const encrypted = CryptoJS.AES.encrypt(fileBase64, process.env.ENCRYPTION_KEY).toString();

    // Save metadata and encrypted data (we store filePath + encryptedData)
    const record = await MedicalRecord.create({
      patientId: Number(patientId),
      doctorId: doctorId,
      fileName: file.originalname,
      filePath: file.path,
      encryptedData: encrypted,
      recordType: recordType || null,
    });

    res.status(201).json({ message: "Medical record uploaded successfully", recordId: record.id });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Patient requests to list their own records
// Authorization: Bearer <patient_token>
router.get("/patient", authMiddleware(["patient"]), async (req, res) => {
  try {
    const patientId = req.user.id;
    const records = await MedicalRecord.findAll({
      where: { patientId },
      include: [{ model: Doctor, attributes: ["id", "fullName", "specialization", "hospital"] }],
      order: [["createdAt", "DESC"]],
    });

    // Do not decrypt here; return metadata and encryptedData (we can decrypt in client)
    const response = records.map((r) => ({
      id: r.id,
      fileName: r.fileName,
      recordType: r.recordType,
      doctor: r.Doctor,
      createdAt: r.createdAt,
      encryptedData: r.encryptedData, // client will decrypt using ENCRYPTION_KEY (in MVP)
    }));

    res.json(response);
  } catch (err) {
    console.error("List patient records error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Doctor can list records for a patient (requires consent in full product — not enforced here in MVP)
router.get("/patient/:patientId", authMiddleware(["doctor"]), async (req, res) => {
  try {
    const patientId = Number(req.params.patientId);
    const records = await MedicalRecord.findAll({
      where: { patientId },
      include: [{ model: Doctor, attributes: ["id", "fullName", "specialization", "hospital"] }],
      order: [["createdAt", "DESC"]],
    });
    res.json(records);
  } catch (err) {
    console.error("Doctor view records error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
