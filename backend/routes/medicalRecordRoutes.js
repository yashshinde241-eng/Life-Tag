// backend/routes/medicalRecordRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path"); // For determining file type
const fs = require("fs"); // Keep if needed elsewhere, but not for file reading in upload
const AWS = require('aws-sdk'); // Import AWS SDK
const CryptoJS = require("crypto-js");
// Ensure all necessary models are imported
const { MedicalRecord, Doctor, AccessRequest, Patient } = require("../models");
const authMiddleware = require("../middleware/authMiddleware");
require("dotenv").config(); // Ensure env vars are loaded
const { Op } = require("sequelize");
const router = express.Router();

// --- Configure AWS SDK for MinIO ---
const s3 = new AWS.S3({
  endpoint: process.env.MINIO_ENDPOINT,        // e.g., http://localhost:9000
  accessKeyId: process.env.MINIO_ACCESS_KEY,   // e.g., minioadmin
  secretAccessKey: process.env.MINIO_SECRET_KEY, // e.g., minioadmin
  s3ForcePathStyle: true,                      // Required for MinIO
  signatureVersion: 'v4',                      // Required for MinIO
  sslEnabled: process.env.MINIO_USE_SSL === 'true' // Should be false for local http
});
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME; // Your MinIO bucket name (e.g., lifetag-records)
// --- End MinIO Config ---

// --- Multer Setup (Using Memory Storage) ---
// THIS IS THE ONLY 'upload' definition needed
const upload = multer({ storage: multer.memoryStorage() });
// --- End Multer Setup ---

// --- REMOVED OLD Multer disk storage and 'uploads' directory creation ---


// POST /api/records/upload (Doctor Upload to MinIO)
router.post(
  "/upload",
  authMiddleware(["doctor"]),
  upload.single("file"), // Use memory storage
  async (req, res) => {
    try {
      const doctorId = req.user.id;
      const { patientId, recordType } = req.body;
      const file = req.file; // File is now in req.file.buffer

      if (!patientId) return res.status(400).json({ message: "patientId is required" });
      if (!file) return res.status(400).json({ message: "file is required" });
      if (!BUCKET_NAME) return res.status(500).json({ message: "Storage Bucket not configured." });

      // Encrypt the file buffer (convert to Base64 first for consistent string encryption)
      const fileBase64 = file.buffer.toString('base64');
      const encryptedDataString = CryptoJS.AES.encrypt(fileBase64, process.env.ENCRYPTION_KEY).toString();

      // Create a unique key (path + filename) for the object in MinIO bucket
      const s3Key = `records/${patientId}/${Date.now()}_${file.originalname}.enc`;

      // MinIO Upload Parameters
      const s3Params = {
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: encryptedDataString, // Upload the encrypted string data
        ContentType: 'text/plain; charset=utf-8' // Content type of the *encrypted* data
      };

      // Upload encrypted data to MinIO
      const s3UploadResult = await s3.upload(s3Params).promise();
      console.log('Doctor MinIO Upload Success:', s3Key); // Log key instead of Location for MinIO

      // Save metadata to DB, including the MinIO/S3 key
      const record = await MedicalRecord.create({
        patientId: Number(patientId),
        doctorId: doctorId,
        fileName: file.originalname, // Original filename for display purposes
        s3Key: s3Key, // Store the reference (key) to the object in MinIO
        recordType: recordType || null,
        // No longer storing filePath or encryptedData in the database
      });

      res.status(201).json({
        message: "Medical record uploaded successfully to cloud storage.",
        recordId: record.id,
      });

    } catch (err) {
      console.error("Doctor MinIO Upload error:", err);
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
      const patientId = req.user.id;
      const { recordType } = req.body;
      const file = req.file;

      if (!file) return res.status(400).json({ message: "file is required" });
      if (!BUCKET_NAME) return res.status(500).json({ message: "Storage Bucket not configured." });

      const fileBase64 = file.buffer.toString('base64');
      const encryptedDataString = CryptoJS.AES.encrypt(fileBase64, process.env.ENCRYPTION_KEY).toString();
      const s3Key = `patient_uploads/${patientId}/${Date.now()}_${file.originalname}.enc`; // Different folder

      const s3Params = { Bucket: BUCKET_NAME, Key: s3Key, Body: encryptedDataString, ContentType: 'text/plain; charset=utf-8' };
      await s3.upload(s3Params).promise();
      console.log('Patient MinIO Upload Success:', s3Key);

      const record = await MedicalRecord.create({
        patientId: patientId,
        doctorId: null, // No doctor for patient uploads
        fileName: file.originalname,
        s3Key: s3Key,
        recordType: recordType || null,
      });
      res.status(201).json({ message: "Your record uploaded successfully to cloud storage.", recordId: record.id });
    } catch (err) {
      console.error("Patient MinIO Upload error:", err);
      res.status(500).json({ message: "Internal Server Error during patient upload." });
    }
  }
);

// GET /api/records/patient (Patient List - Includes s3Key)
router.get("/patient", authMiddleware(["patient"]), async (req, res) => {
  try {
    const patientId = req.user.id;
    const records = await MedicalRecord.findAll({
      where: { patientId },
      include: [{ model: Doctor, attributes: ["id", "fullName"] }],
      attributes: ['id', 'fileName', 'recordType', 'createdAt', 's3Key', 'doctorId'], // Include s3Key and doctorId
      order: [["createdAt", "DESC"]],
    });

    // Map response, ensuring doctor info is nested correctly
    const response = records.map((r) => ({
      id: r.id,
      fileName: r.fileName,
      recordType: r.recordType,
      // Handle cases where doctor might be null (patient uploads)
      doctor: r.Doctor ? { id: r.Doctor.id, fullName: r.Doctor.fullName } : null,
      createdAt: r.createdAt,
      s3Key: r.s3Key || null, // Include s3Key (or null if local)
    }));
    res.json(response);
  } catch (err) {
    console.error("List patient records error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/records/patient/:patientId (Doctor List - Metadata only)
router.get(
  "/patient/:patientId",
  authMiddleware(["doctor"]),
  async (req, res) => {
    try {
      const patientId = Number(req.params.patientId);
      if (isNaN(patientId)) return res.status(400).json({ message: "Invalid patientId" });
      const doctorId = req.user.id;

      // Check active access request
      const now = new Date();
      const active = await AccessRequest.findOne({
        where: { doctorId, patientId, status: "approved", expiresAt: { [Op.gt]: now } },
      });
      if (!active) return res.status(403).json({ message: "No active access session." });

      // Return records metadata (exclude s3Key for doctor's list view)
      const records = await MedicalRecord.findAll({
        where: { patientId },
        include: [{ model: Doctor, attributes: ["id", "fullName"] }],
        attributes: ['id', 'fileName', 'recordType', 'createdAt', 'doctorId'], // Exclude s3Key
        order: [["createdAt", "DESC"]],
      });
       const response = records.map((r) => ({
         id: r.id,
         fileName: r.fileName,
         recordType: r.recordType,
         doctor: r.Doctor ? { id: r.Doctor.id, fullName: r.Doctor.fullName } : null,
         createdAt: r.createdAt,
      }));
      res.json(response);
    } catch (err) {
      console.error("Doctor view records list error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);


// GET /api/records/view/:recordId (View file from MinIO)
router.get("/view/:recordId", authMiddleware(), async (req, res) => {
  try {
    const recordId = Number(req.params.recordId);
    const { id: userId, role } = req.user;

    // Fetch the record including the s3Key and potential old fields
    const record = await MedicalRecord.findByPk(recordId, {
        attributes: ['id', 'patientId', 'fileName', 's3Key', 'encryptedData', 'filePath']
    });
    if (!record) return res.status(404).json({ message: "Record not found" });

    // Permission Check
    let hasPermission = false;
    if (role === "patient" && userId === record.patientId) hasPermission = true;
    else if (role === "doctor") {
      const now = new Date();
      const activeAccess = await AccessRequest.findOne({ where: { doctorId: userId, patientId: record.patientId, status: "approved", expiresAt: { [Op.gt]: now } } });
      if (activeAccess) hasPermission = true;
    }
    if (!hasPermission) return res.status(403).json({ message: "Forbidden: No access." });

    let encryptedDataString;

    // Check if file is in MinIO (s3Key exists) or local (encryptedData/filePath exists)
    if (record.s3Key) {
        if (!BUCKET_NAME) return res.status(500).json({ message: "Storage Bucket not configured." });
        const s3Params = { Bucket: BUCKET_NAME, Key: record.s3Key };
        const s3Object = await s3.getObject(s3Params).promise();
        encryptedDataString = s3Object.Body.toString('utf-8');
    } else if (record.encryptedData) {
        // Handle potentially old records stored directly in DB
        encryptedDataString = record.encryptedData;
        console.log(`Serving record ${recordId} from DB encryptedData field.`);
    } else if (record.filePath) {
        // Handle potentially old records stored locally via filePath
        console.log(`Serving record ${recordId} from local file path: ${record.filePath}`);
        if (!fs.existsSync(record.filePath)) {
            return res.status(404).json({ message: "Local file not found for this record." });
        }
        const fileBuffer = fs.readFileSync(record.filePath);
        const fileBase64 = fileBuffer.toString('base64');
        // Encrypt it on-the-fly (less efficient, but handles old data)
        encryptedDataString = CryptoJS.AES.encrypt(fileBase64, process.env.ENCRYPTION_KEY).toString();
        // NOTE: This assumes the original local file was NOT encrypted. Adjust if needed.
    } else {
         return res.status(500).json({ message: "File data or location not found for this record." });
    }

    // Decryption Logic
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) throw new Error("ENCRYPTION_KEY not found in .env");
    const bytes = CryptoJS.AES.decrypt(encryptedDataString, encryptionKey);
    const decryptedBase64String = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedBase64String) return res.status(500).json({ message: "Decryption failed." });
    const decryptedDataBuffer = Buffer.from(decryptedBase64String, "base64");

    // Serve File
    let contentType = 'application/octet-stream';
    const lowerFileName = record.fileName.toLowerCase();
    if (lowerFileName.endsWith('.pdf')) contentType = 'application/pdf';
    else if (lowerFileName.endsWith('.txt')) contentType = 'text/plain';
    else if (lowerFileName.endsWith('.png')) contentType = 'image/png';
    else if (lowerFileName.endsWith('.jpg') || lowerFileName.endsWith('.jpeg')) contentType = 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.send(decryptedDataBuffer);

  } catch (err) {
    console.error("View record error:", err);
    if (err.code === 'NoSuchKey') return res.status(404).json({ message: "File not found in cloud storage." });
    res.status(500).json({ message: "Internal Server Error during file retrieval." });
  }
});


// --- NEW BACKUP ROUTE ---
// POST /api/records/backup/:recordId (Patient moves local record to MinIO)
router.post("/backup/:recordId", authMiddleware(["patient"]), async (req, res) => {
  try {
    const patientId = req.user.id;
    const recordId = Number(req.params.recordId);
    if (isNaN(recordId)) return res.status(400).json({ message: "Invalid recordId" });

    // Fetch record including potential old fields
    const record = await MedicalRecord.findByPk(recordId, {
        attributes: ['id', 'patientId', 'fileName', 's3Key', 'encryptedData', 'filePath']
    });

    // Validations
    if (!record) return res.status(404).json({ message: "Record not found" });
    if (record.patientId !== patientId) return res.status(403).json({ message: "Forbidden: Not your record" });
    if (record.s3Key) return res.status(400).json({ message: "Record is already backed up" });
    if (!BUCKET_NAME) return res.status(500).json({ message: "Storage Bucket not configured." });

    let encryptedDataString;
    // Get encrypted data, preferring DB field, then reading/encrypting local file
    if(record.encryptedData) {
        encryptedDataString = record.encryptedData;
    } else if (record.filePath) {
         if (!fs.existsSync(record.filePath)) {
            return res.status(404).json({ message: "Local file not found for backup." });
        }
        const fileBuffer = fs.readFileSync(record.filePath);
        const fileBase64 = fileBuffer.toString('base64');
        encryptedDataString = CryptoJS.AES.encrypt(fileBase64, process.env.ENCRYPTION_KEY).toString();
         // NOTE: Assumes original file wasn't already encrypted. Adjust if needed.
    } else {
        return res.status(400).json({ message: "No local data found to backup." });
    }

    // Prepare for MinIO Upload
    const s3Key = `records/${patientId}/backup_${Date.now()}_${record.fileName}.enc`; // Indicate backup source
    const s3Params = { Bucket: BUCKET_NAME, Key: s3Key, Body: encryptedDataString, ContentType: 'text/plain; charset=utf-8' };

    await s3.upload(s3Params).promise();
    console.log('Backup to MinIO Success for record:', recordId);

    // Update DB: Set s3Key, potentially clear old fields
    record.s3Key = s3Key;
    record.encryptedData = null; // Clear from DB after successful backup
    if (record.filePath /*&& fs.existsSync(record.filePath)*/) { // Check existence before unlinking
       // fs.unlinkSync(record.filePath); // Optional: delete local file - BE CAREFUL WITH THIS
    }
    record.filePath = null; // Clear path even if file deletion fails/is skipped
    await record.save();

    res.status(200).json({ message: "Record successfully backed up.", recordId: record.id, s3Key: record.s3Key });

  } catch (err) {
    console.error("Backup record error:", err);
    res.status(500).json({ message: "Internal Server Error during backup." });
  }
});
// --- END NEW BACKUP ROUTE ---


// --- NEW CLOUD DELETE ROUTE ---
// DELETE /api/records/cloud/:recordId (Patient deletes from MinIO and DB)
router.delete("/cloud/:recordId", authMiddleware(["patient"]), async (req, res) => {
  try {
    const patientId = req.user.id;
    const recordId = Number(req.params.recordId);
    if (isNaN(recordId)) return res.status(400).json({ message: "Invalid recordId" });

    const record = await MedicalRecord.findByPk(recordId, { attributes: ['id', 'patientId', 's3Key'] });

    // Validations
    if (!record) return res.status(404).json({ message: "Record not found" });
    if (record.patientId !== patientId) return res.status(403).json({ message: "Forbidden: Not your record" });
    if (!record.s3Key) return res.status(400).json({ message: "Record is not stored in the cloud" });
    if (!BUCKET_NAME) return res.status(500).json({ message: "Storage Bucket not configured." });

    // MinIO Delete Parameters
    const s3Params = { Bucket: BUCKET_NAME, Key: record.s3Key };
    await s3.deleteObject(s3Params).promise();
    console.log('Deleted from MinIO:', record.s3Key);

    // Delete the record from the database
    await record.destroy();

    res.status(200).json({ message: "Record successfully deleted from cloud and database." });

  } catch (err) {
    console.error("Delete cloud record error:", err);
    res.status(500).json({ message: "Internal Server Error during deletion." });
  }
});
// --- END NEW CLOUD DELETE ROUTE ---

module.exports = router;