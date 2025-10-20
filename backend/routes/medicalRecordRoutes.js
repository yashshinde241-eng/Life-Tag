const express = require("express");
const multer = require("multer");
const path = require("path");
const { MedicalRecord } = require("../models");

const router = express.Router();

// 🗂️ Configure File Upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${Date.now()}_${file.fieldname}${path.extname(file.originalname)}`
    );
  },
});
const upload = multer({ storage: storage });

// 🧾 Upload Medical Record
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { patientId, doctorId } = req.body;
    const filePath = req.file ? req.file.path : null;

    if (!filePath)
      return res.status(400).json({ error: "File is required" });

    const record = await MedicalRecord.create({
      patientId,
      doctorId,
      filePath,
    });

    res.status(201).json({
      message: "Medical record uploaded successfully",
      record,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📄 Get All Records (for viewing)
router.get("/", async (req, res) => {
  try {
    const records = await MedicalRecord.findAll();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
