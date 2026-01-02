// backend/routes/medicalRecordRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path"); // For determining file type
const fs = require("fs"); // Keep if needed for fallback logic maybe
const AWS = require("aws-sdk"); // Import AWS SDK
const CryptoJS = require("crypto-js");
const { Op } = require("sequelize"); 
const { MedicalRecord, Doctor, AccessRequest, Patient } = require("../models");
// Ensure all necessary models are imported

const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

const isStorageEnabled =
  process.env.MINIO_ENDPOINT &&
  process.env.MINIO_ACCESS_KEY &&
  process.env.MINIO_SECRET_KEY &&
  process.env.AWS_S3_BUCKET_NAME;

// --- Configure AWS SDK for MinIO ---
let s3 = null;
let BUCKET_NAME = null;

if (isStorageEnabled) {
  s3 = new AWS.S3({
    endpoint: process.env.MINIO_ENDPOINT,
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
    s3ForcePathStyle: true,
    signatureVersion: "v4",
    sslEnabled: process.env.MINIO_USE_SSL === "true",
  });

  BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
}

// --- End MinIO Config ---

// --- Multer Setup (Using Memory Storage) ---
const upload = multer({ storage: multer.memoryStorage() });
// --- End Multer Setup ---

// POST /api/records/upload (Doctor Upload to MinIO using patientTagId)
router.post(
  "/upload",
  authMiddleware(["doctor"]),
  upload.single("file"), // Use memory storage
  async (req, res) => {
    try {
      const doctorId = req.user.id;
      const { patientTagId, recordType } = req.body; // Still use patientTagId
      const file = req.file;

      if (!patientTagId) return res.status(400).json({ message: "patientTagId is required" });
      if (!file) return res.status(400).json({ message: "file is required" });

      // Find patient by patientTagId to get internal ID
      const patient = await Patient.findOne({ where: { patientTagId: Number(patientTagId) }, attributes: ['id'] });
      if (!patient) {
        return res.status(404).json({ message: "Patient not found." });
      }
      const internalPatientId = patient.id;

      // Encrypt the file buffer
      const fileBase64 = file.buffer.toString('base64');
      const encryptedDataString = CryptoJS.AES.encrypt(fileBase64, process.env.ENCRYPTION_KEY).toString();

      // --- CHANGE: Save to DB, NOT MinIO ---
      // Save metadata AND the encrypted data string directly in the database
      const record = await MedicalRecord.create({
        patientId: internalPatientId, // Use internal ID
        doctorId: doctorId,
        fileName: file.originalname,
        encryptedData: encryptedDataString, // Store encrypted data in DB
        s3Key: null, // Ensure s3Key is null
        recordType: recordType || null,
        // filePath is null
      });
      // --- END CHANGE ---

      console.log(`Doctor uploaded record ${record.id} for patient ${internalPatientId}, saved locally (in DB).`);

      res.status(201).json({
        message: "Medical record uploaded successfully (pending cloud backup).", // Update message
        recordId: record.id,
      });

    } catch (err) {
      console.error("Doctor local upload error:", err);
      res.status(500).json({ message: "Internal Server Error during upload." });
    }
  }
);

// --- NEW PATIENT UPLOAD ROUTE ---
// POST /api/records/upload/patient (Patient Upload to MinIO)
router.post(
  "/upload/patient",
  authMiddleware(["patient"]), // Only patients
  upload.single("file"),
  async (req, res) => {
    try {
      const patientId = req.user.id; // Uses internal ID from token
      const { recordType } = req.body;
      const file = req.file;

      if (!file) return res.status(400).json({ message: "file is required" });
      if (!s3 || !BUCKET_NAME)
        return res
          .status(500)
          .json({ message: "Storage Bucket not configured." });

      const fileBase64 = file.buffer.toString("base64");
      const encryptedDataString = CryptoJS.AES.encrypt(
        fileBase64,
        process.env.ENCRYPTION_KEY
      ).toString();
      // Use internal patientId in key here too for consistency
      const s3Key = `patient_uploads/${patientId}/${Date.now()}_${
        file.originalname
      }.enc`;

      const s3Params = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: encryptedDataString,
        ContentType: "text/plain; charset=utf-8",
      };
      await s3.upload(s3Params).promise();
      console.log("Patient MinIO Upload Success:", s3Key);

      const record = await MedicalRecord.create({
        patientId: patientId, // Internal ID
        doctorId: null, // No doctor
        fileName: file.originalname,
        s3Key: s3Key,
        recordType: recordType || null,
      });
      res.status(201).json({
        message: "Your record uploaded successfully.",
        recordId: record.id,
      });
    } catch (err) {
      console.error("Patient MinIO Upload error:", err);
      res
        .status(500)
        .json({ message: "Internal Server Error during patient upload." });
    }
  }
);

// GET /api/records/patient (Patient List - Includes s3Key)
router.get("/patient", authMiddleware(["patient"]), async (req, res) => {
  try {
    const patientId = req.user.id; // Internal ID from token
    const records = await MedicalRecord.findAll({
      where: { patientId },
      include: [{ model: Doctor, attributes: ["id", "fullName"] }],
      attributes: [
        "id",
        "fileName",
        "recordType",
        "createdAt",
        "s3Key",
        "doctorId",
      ], // Include s3Key and doctorId
      order: [["createdAt", "DESC"]],
    });

    const response = records.map((r) => ({
      id: r.id,
      fileName: r.fileName,
      recordType: r.recordType,
      doctor: r.Doctor
        ? { id: r.Doctor.id, fullName: r.Doctor.fullName }
        : null,
      createdAt: r.createdAt,
      s3Key: r.s3Key || null, // Include s3Key (or null if local)
    }));
    res.json(response);
  } catch (err) {
    console.error("List patient records error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// --- UPDATED DOCTOR LIST ROUTE ---
// GET /api/records/patient/tag/:patientTagId (Doctor List by Tag ID)
router.get(
  "/patient/tag/:patientTagId",
  authMiddleware(["doctor"]),
  async (req, res) => {
    console.log("--- Doctor viewing records list ---"); // Log start
    try {
      const patientTagId = Number(req.params.patientTagId);
      if (isNaN(patientTagId))
        return res.status(400).json({ message: "Invalid patientTagId" });
      const doctorId = req.user.id;
      console.log(
        `Doctor ID: ${doctorId}, Requested Patient Tag ID: ${patientTagId}`
      ); // Log IDs

      const patient = await Patient.findOne({
        where: { patientTagId: patientTagId },
        attributes: ["id"],
      });
      if (!patient) {
        console.log("Patient not found for Tag ID:", patientTagId);
        return res.status(404).json({ message: "Patient not found." });
      }
      const internalPatientId = patient.id;
      console.log(`Found Internal Patient ID: ${internalPatientId}`); // Log found ID

      const now = new Date();
      const active = await AccessRequest.findOne({
        where: {
          doctorId,
          patientId: internalPatientId,
          status: "approved",
          expiresAt: { [Op.gt]: now },
        },
      });
      if (!active) {
        console.log(
          `No active access session found for Doctor ${doctorId} and Patient ${internalPatientId}`
        );
        return res.status(403).json({ message: "No active access session." });
      }
      console.log("Active access session found."); // Log access success

      // Fetch records
      console.log("Fetching records from DB..."); // Log before DB query
      const records = await MedicalRecord.findAll({
        where: { patientId: internalPatientId },
        include: [{ model: Doctor, attributes: ["id", "fullName"] }],
        attributes: ["id", "fileName", "recordType", "createdAt", "doctorId"],
        order: [["createdAt", "DESC"]],
      });
      console.log(`Found ${records.length} records.`); // Log how many records found
      // console.log("Raw records data:", JSON.stringify(records, null, 2)); // Optional: Log raw data if needed

      // Map response
      console.log("Mapping response..."); // Log before mapping
      const response = records.map((r, index) => {
        // Log structure of each record during mapping
        console.log(
          `Mapping record index ${index}:`,
          r ? `ID ${r.id}` : "null record"
        );
        console.log(
          `  - Doctor data:`,
          r.Doctor
            ? `ID ${r.Doctor.id}, Name ${r.Doctor.fullName}`
            : "No Doctor data"
        );
        return {
          id: r.id,
          fileName: r.fileName,
          recordType: r.recordType,
          doctor: r.Doctor
            ? { id: r.Doctor.id, fullName: r.Doctor.fullName }
            : null,
          createdAt: r.createdAt,
        };
      });
      console.log("Mapping complete. Sending response."); // Log before sending
      res.json(response);
    } catch (err) {
      // --- IMPORTANT: Log the ACTUAL error here ---
      console.error("!!! Doctor view records list error:", err);
      // --- END LOG ---
      res.status(500).json({ message: "Internal Server Error" }); // Keep generic message for frontend
    }
  }
);
// --- END UPDATED DOCTOR LIST ROUTE ---

// GET /api/records/view/:recordId (View file from MinIO or Fallback)
router.get("/view/:recordId", authMiddleware(), async (req, res) => {
  try {
    const recordId = Number(req.params.recordId);
    const { id: userId, role } = req.user; // Internal ID from token

    // Fetch the record including the s3Key and potential old fields
    const record = await MedicalRecord.findByPk(recordId, {
      attributes: [
        "id",
        "patientId",
        "fileName",
        "s3Key",
        "encryptedData",
        "filePath",
      ],
    });
    if (!record) return res.status(404).json({ message: "Record not found" });

    // Permission Check (uses internal ID)
    let hasPermission = false;
    if (role === "patient" && userId === record.patientId) hasPermission = true;
    else if (role === "doctor") {
      const now = new Date();
      const activeAccess = await AccessRequest.findOne({
        where: {
          doctorId: userId,
          patientId: record.patientId,
          status: "approved",
          expiresAt: { [Op.gt]: now },
        },
      });
      if (activeAccess) hasPermission = true;
    }
    if (!hasPermission)
      return res.status(403).json({ message: "Forbidden: No access." });

    let encryptedDataString;

    // Fetch from MinIO if s3Key exists, otherwise fallback
    if (record.s3Key) {
      if (!s3 || !BUCKET_NAME)
        return res
          .status(500)
          .json({ message: "Storage Bucket not configured." });
      const s3Params = { Bucket: BUCKET_NAME, Key: record.s3Key };
      const s3Object = await s3.getObject(s3Params).promise();
      encryptedDataString = s3Object.Body.toString("utf-8");
    } else if (record.encryptedData) {
      encryptedDataString = record.encryptedData;
      console.log(`Serving record ${recordId} from DB encryptedData field.`);
    } else if (record.filePath) {
      console.log(
        `Serving record ${recordId} from local file path: ${record.filePath}`
      );
      if (!fs.existsSync(record.filePath))
        return res.status(404).json({ message: "Local file not found." });
      const fileBuffer = fs.readFileSync(record.filePath);
      const fileBase64 = fileBuffer.toString("base64");
      encryptedDataString = CryptoJS.AES.encrypt(
        fileBase64,
        process.env.ENCRYPTION_KEY
      ).toString();
    } else {
      return res.status(500).json({ message: "File data/location not found." });
    }

    // Decryption Logic
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) throw new Error("ENCRYPTION_KEY not found in .env");
    const bytes = CryptoJS.AES.decrypt(encryptedDataString, encryptionKey);
    const decryptedBase64String = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedBase64String)
      return res.status(500).json({ message: "Decryption failed." });
    const decryptedDataBuffer = Buffer.from(decryptedBase64String, "base64");

    // Serve File
    let contentType = "application/octet-stream";
    const lowerFileName = record.fileName.toLowerCase();
    if (lowerFileName.endsWith(".pdf")) contentType = "application/pdf";
    else if (lowerFileName.endsWith(".txt")) contentType = "text/plain";
    else if (lowerFileName.endsWith(".png")) contentType = "image/png";
    else if (lowerFileName.endsWith(".jpg") || lowerFileName.endsWith(".jpeg"))
      contentType = "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.send(decryptedDataBuffer);
  } catch (err) {
    console.error("View record error:", err);
    if (err.code === "NoSuchKey")
      return res
        .status(404)
        .json({ message: "File not found in cloud storage." });
    res
      .status(500)
      .json({ message: "Internal Server Error during file retrieval." });
  }
});

// --- NEW BACKUP ROUTE ---
// POST /api/records/backup/:recordId (Patient moves local record to MinIO)
router.post(
  "/backup/:recordId",
  authMiddleware(["patient"]),
  async (req, res) => {
    try {
      const patientId = req.user.id; // Internal ID
      const recordId = Number(req.params.recordId);
      if (isNaN(recordId))
        return res.status(400).json({ message: "Invalid recordId" });

      // Fetch record including potential old fields
      const record = await MedicalRecord.findByPk(recordId, {
        attributes: [
          "id",
          "patientId",
          "fileName",
          "s3Key",
          "encryptedData",
          "filePath",
        ],
      });

      // Validations
      if (!record) return res.status(404).json({ message: "Record not found" });
      if (record.patientId !== patientId)
        return res.status(403).json({ message: "Forbidden: Not your record" });
      if (record.s3Key)
        return res.status(400).json({ message: "Record is already backed up" });
      if (!s3 || !BUCKET_NAME)
        return res
          .status(500)
          .json({ message: "Storage Bucket not configured." });

      let encryptedDataString;
      // Get encrypted data, preferring DB field, then reading/encrypting local file
      if (record.encryptedData) {
        encryptedDataString = record.encryptedData;
      } else if (record.filePath) {
        if (!fs.existsSync(record.filePath))
          return res
            .status(404)
            .json({ message: "Local file not found for backup." });
        const fileBuffer = fs.readFileSync(record.filePath);
        const fileBase64 = fileBuffer.toString("base64");
        encryptedDataString = CryptoJS.AES.encrypt(
          fileBase64,
          process.env.ENCRYPTION_KEY
        ).toString();
      } else {
        return res
          .status(400)
          .json({ message: "No local data found to backup." });
      }

      // Prepare for MinIO Upload using internal patientId
      const s3Key = `records/${patientId}/backup_${Date.now()}_${
        record.fileName
      }.enc`; // Store in main records folder
      const s3Params = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: encryptedDataString,
        ContentType: "text/plain; charset=utf-8",
      };

      await s3.upload(s3Params).promise();
      console.log("Backup to MinIO Success for record:", recordId);

      // Update DB: Set s3Key, potentially clear old fields
      record.s3Key = s3Key;
      record.encryptedData = null; // Clear from DB
      // record.filePath = null; // Clear path
      // Optionally delete local file if filePath was used - be careful
      // if (record.filePath && fs.existsSync(record.filePath)) { fs.unlinkSync(record.filePath); }
      await record.save({ fields: ["s3Key", "encryptedData", "filePath"] }); // Explicitly save changed fields

      res.status(200).json({
        message: "Record successfully backed up.",
        recordId: record.id,
        s3Key: record.s3Key,
      });
    } catch (err) {
      console.error("Backup record error:", err);
      res.status(500).json({ message: "Internal Server Error during backup." });
    }
  }
);
// --- END NEW BACKUP ROUTE ---

// --- NEW CLOUD DELETE ROUTE ---
// DELETE /api/records/cloud/:recordId (Patient deletes from MinIO and DB)
router.delete(
  "/cloud/:recordId",
  authMiddleware(["patient"]),
  async (req, res) => {
    try {
      const patientId = req.user.id; // Internal ID
      const recordId = Number(req.params.recordId);
      if (isNaN(recordId))
        return res.status(400).json({ message: "Invalid recordId" });

      // Fetch only needed fields
      const record = await MedicalRecord.findByPk(recordId, {
        attributes: ["id", "patientId", "s3Key"],
      });

      // Validations
      if (!record) return res.status(404).json({ message: "Record not found" });
      if (record.patientId !== patientId)
        return res.status(403).json({ message: "Forbidden: Not your record" });
      if (!record.s3Key)
        return res
          .status(400)
          .json({ message: "Record is not stored in the cloud" });
      if (!s3 || !BUCKET_NAME)
        return res
          .status(500)
          .json({ message: "Storage Bucket not configured." });

      // MinIO Delete Parameters
      const s3Params = { Bucket: BUCKET_NAME, Key: record.s3Key };
      await s3.deleteObject(s3Params).promise();
      console.log("Deleted from MinIO:", record.s3Key);

      // Delete the record from the database
      await record.destroy();

      res.status(200).json({ message: "Record successfully deleted." });
    } catch (err) {
      console.error("Delete cloud record error:", err);
      res
        .status(500)
        .json({ message: "Internal Server Error during deletion." });
    }
  }
);
// --- END NEW CLOUD DELETE ROUTE ---

module.exports = router;
