// backend/routes/medicalRecordRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const CryptoJS = require("crypto-js");
const { MedicalRecord, Doctor, AccessRequest } = require("../models");
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config();
const { Op } = require("sequelize");
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
    const safeName = `${Date.now()}_${file.fieldname}${path.extname(
      file.originalname
    )}`;
    cb(null, safeName);
  },
});
const upload = multer({ storage: storage });

// Doctor uploads a medical record for a patient
// Requires: Authorization: Bearer <doctor_token>
// Form-data: patientId (text), recordType (text, optional), file (file)
router.post(
  "/upload",
  authMiddleware(["doctor"]),
  upload.single("file"),
  async (req, res) => {
    try {
      const doctorId = req.user.id; // from token
      const { patientId, recordType } = req.body;
      const file = req.file;

      if (!patientId)
        return res.status(400).json({ message: "patientId is required" });
      if (!file) return res.status(400).json({ message: "file is required" });

      // Read file as binary and encrypt its base64 string
      const fileBuffer = fs.readFileSync(file.path);
      const fileBase64 = fileBuffer.toString("base64");
      const encrypted = CryptoJS.AES.encrypt(
        fileBase64,
        process.env.ENCRYPTION_KEY
      ).toString();

      // Save metadata and encrypted data (we store filePath + encryptedData)
      const record = await MedicalRecord.create({
        patientId: Number(patientId),
        doctorId: doctorId,
        fileName: file.originalname,
        filePath: file.path,
        encryptedData: encrypted,
        recordType: recordType || null,
      });

      res.status(201).json({
        message: "Medical record uploaded successfully",
        recordId: record.id,
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Patient requests to list their own records
// Authorization: Bearer <patient_token>
router.get("/patient", authMiddleware(["patient"]), async (req, res) => {
  try {
    const patientId = req.user.id;
    const records = await MedicalRecord.findAll({
      where: { patientId },
      include: [
        {
          model: Doctor,
          attributes: ["id", "fullName", "specialization", "hospital"],
        },
      ],
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
router.get(
  "/patient/:patientId",
  authMiddleware(["doctor"]),
  async (req, res) => {
    try {
      const patientId = Number(req.params.patientId);
      if (isNaN(patientId))
        return res.status(400).json({ message: "Invalid patientId" });

      const doctorId = req.user.id;

      // Check active access request
      const now = new Date();
      const active = await AccessRequest.findOne({
        where: {
          doctorId,
          patientId,
          status: "approved",
          expiresAt: { [Op.gt]: now },
        },
      });

      if (!active) {
        return res.status(403).json({
          message: "No active access session. Request access from patient.",
        });
      }

      // Active access found - return records
      const records = await MedicalRecord.findAll({
        where: { patientId },
        include: [
          {
            model: Doctor,
            attributes: ["id", "fullName", "specialization", "hospital"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      res.json(records);
    } catch (err) {
      console.error("Doctor view records error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// GET /api/records/view/:recordId
// Securely view a single decrypted file
router.get("/view/:recordId", authMiddleware(), async (req, res) => {
  try {
    const recordId = Number(req.params.recordId);
    const { id: userId, role } = req.user;

    const record = await MedicalRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // --- PERMISSION CHECK ---
    let hasPermission = false;

    if (role === "patient" && userId === record.patientId) {
      // 1. Patient owns this record
      hasPermission = true;
    } else if (role === "doctor") {
      // 2. Doctor has an active, approved session for this patient
      const now = new Date();
      const activeAccess = await AccessRequest.findOne({
        where: {
          doctorId: userId,
          patientId: record.patientId,
          status: "approved",
          expiresAt: { [Op.gt]: now },
        },
      });
      if (activeAccess) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not have access to this file." });
    }

    // --- DECRYPTION LOGIC ---
    // This is the REAL decryption logic

    // 1. Get the encryption key from your .env file
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error("ENCRYPTION_KEY not found in .env");
    }

    // 2. Decrypt the data using AES (this reverses the encryption)
    const bytes = CryptoJS.AES.decrypt(record.encryptedData, encryptionKey);

    // 3. Convert the decrypted bytes back into a file buffer
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

    // 4. IMPORTANT: Check if decryption worked.
    // If the key is wrong, 'decryptedString' will be empty.
    if (!decryptedString) {
      return res.status(500).json({ message: "Decryption failed. Check key." });
    }

    // 5. Convert the decrypted Base64 string back into the original file buffer
    const decryptedData = Buffer.from(decryptedString, "base64");
    // --- END DECRYPTION LOGIC ---

    // --- SERVE THE FILE ---
    // We need to tell the browser what kind of file this is.
    // We'll guess based on the file name.
    let contentType = "application/octet-stream"; // Default
    if (record.fileName.endsWith(".pdf")) {
      contentType = "application/pdf";
    } else if (record.fileName.endsWith(".txt")) {
      contentType = "text/plain";
    } else if (record.fileName.endsWith(".png")) {
      contentType = "image/png";
    } else if (
      record.fileName.endsWith(".jpg") ||
      record.fileName.endsWith(".jpeg")
    ) {
      contentType = "image/jpeg";
    }

    res.setHeader("Content-Type", contentType);
    res.send(decryptedData); // Send the raw, decrypted file data
  } catch (err) {
    console.error("View record error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
