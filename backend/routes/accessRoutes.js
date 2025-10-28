// backend/routes/accessRoutes.js
const express = require("express");
const { Op } = require("sequelize"); // Ensure Op is imported if needed here
const router = express.Router();
// Ensure Patient model is imported
const { AccessRequest, Doctor, Patient } = require("../models");
const authMiddleware = require("../middleware/authMiddleware");

// POST /api/access/request
// Doctor creates a request using patientTagId
router.post("/request", authMiddleware(["doctor"]), async (req, res) => {
  try {
    const doctorId = req.user.id; // Internal doctor ID from token
    // --- CHANGE: Expect patientTagId ---
    const { patientTagId, notes } = req.body;

    if (!patientTagId) return res.status(400).json({ message: "patientTagId is required" });

    // --- NEW: Find patient by patientTagId ---
    const patient = await Patient.findOne({ where: { patientTagId: Number(patientTagId) }, attributes: ['id'] });
    if (!patient) {
        return res.status(404).json({ message: "Patient with the provided Tag ID not found." });
    }
    const internalPatientId = patient.id; // Get internal ID for saving
    // --- END NEW ---

    // Create request using internal IDs
    const reqRecord = await AccessRequest.create({
      doctorId,
      patientId: internalPatientId, // Use internal ID
      status: "pending",
      notes: notes || null,
    });

    res.status(201).json({ message: "Access request created", requestId: reqRecord.id });
  } catch (err) {
    console.error("Create access request error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// --- RENAMED & MODIFIED ROUTE ---
// GET /api/access/patient/tag/:patientTagId
// Patient views requests targeted to them (using tag ID in URL)
router.get("/patient/tag/:patientTagId", authMiddleware(["patient"]), async (req, res) => {
  try {
    const patientTagIdParam = Number(req.params.patientTagId);
    const internalPatientIdFromToken = req.user.id; // Internal ID from token

    // --- NEW: Verify patientTagId from URL matches the logged-in user ---
    const patient = await Patient.findByPk(internalPatientIdFromToken, { attributes: ['patientTagId'] });
    if (!patient || patient.patientTagId !== patientTagIdParam) {
        // Log mismatch for debugging if needed
        console.warn(`Access Denied: Token ID ${internalPatientIdFromToken} does not match Tag ID ${patientTagIdParam}`);
        return res.status(403).json({ message: "Forbidden: You can only view your own requests." });
    }
    // --- END NEW ---

    // Fetch requests using the internal ID (verified via token)
    const requests = await AccessRequest.findAll({
      where: { patientId: internalPatientIdFromToken }, // Use internal ID from token
      // Include doctor details, excluding potentially sensitive info if needed
      include: [{ model: Doctor, attributes: ["id", "fullName", "specialization", "hospital"] }],
      order: [["createdAt", "DESC"]],
    });

    // Send the list of requests
    res.json(requests);
  } catch (err) {
    console.error("Patient view access requests error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
// --- END RENAMED & MODIFIED ROUTE ---


// PUT /api/access/respond/:id (Patient approves/rejects - NO CHANGE NEEDED)
// This uses the request's own ID and the patient's internal ID from token, which is fine.
router.put("/respond/:id", authMiddleware(["patient"]), async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const { action, durationMinutes } = req.body;
    const internalPatientId = req.user.id; // Internal ID from token

    const reqRecord = await AccessRequest.findByPk(requestId);
    if (!reqRecord) return res.status(404).json({ message: "Request not found" });

    // Ensure patient owns this request using internal ID
    if (internalPatientId !== reqRecord.patientId) {
      return res.status(403).json({ message: "Forbidden: cannot respond to this request" });
    }

    if (action === "reject") {
      reqRecord.status = "rejected";
      reqRecord.expiresAt = null; // Clear expiry on rejection
      await reqRecord.save();
      return res.json({ message: "Request rejected" });
    }

    if (action === "approve") {
      const mins = Number(durationMinutes) || 30; // 30 min default
      const expiresAt = new Date(Date.now() + mins * 60 * 1000);
      reqRecord.status = "approved";
      reqRecord.expiresAt = expiresAt;
      await reqRecord.save();
      return res.json({ message: "Request approved", expiresAt });
    }

    res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });
  } catch (err) {
    console.error("Respond access request error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT /api/access/end/:id (Patient ends session - NO CHANGE NEEDED)
// Also uses request ID and patient's internal ID from token.
router.put("/end/:id", authMiddleware(["patient"]), async (req, res) => {
    try {
        const requestId = Number(req.params.id);
        const internalPatientId = req.user.id;
        const reqRecord = await AccessRequest.findByPk(requestId);

        if (!reqRecord) return res.status(404).json({ message: "Request not found" });
        if (internalPatientId !== reqRecord.patientId) return res.status(403).json({ message: "Forbidden: Not your request" });
        if (reqRecord.status !== "approved") return res.status(400).json({ message: "Session is not active" });

        reqRecord.status = "expired";
        reqRecord.expiresAt = new Date(); // Expire now
        await reqRecord.save();
        res.json({ message: "Session ended successfully" });
    } catch (err) {
        console.error("End session error:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// GET /api/access/doctor/:doctorId (Doctor views sent requests - MODIFY RESPONSE)
router.get("/doctor/:doctorId", authMiddleware(["doctor"]), async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId); // Internal doctor ID from URL
    // only allow doctor to view their own requests (using internal ID from token)
    if (req.user.id !== doctorId) {
      return res.status(403).json({ message: "Forbidden: can only view your own requests" });
    }

    const requests = await AccessRequest.findAll({
      where: { doctorId },
      // --- CHANGE: Include patientTagId, exclude internal patient id ---
      include: [{
          model: Patient,
          // Only select the fields needed by the frontend
          attributes: ["patientTagId", "fullName", "email"] // Explicitly ask for tag ID
      }],
      // --- END CHANGE ---
      order: [["createdAt", "DESC"]],
    });

    // --- Process requests to check for expired ones BEFORE sending ---
    const now = new Date();
    const processedRequests = await Promise.all(requests.map(async (req) => {
      // Check if the request exists and has an expiresAt date
      if (req && req.status === 'approved' && req.expiresAt && now > new Date(req.expiresAt)) {
        req.status = 'expired';
        // Update DB silently in the background (no need to await here)
        AccessRequest.update({ status: 'expired' }, { where: { id: req.id } }).catch(console.error);
      }
      return req; // Return the (potentially modified) request object
    }));
    // --- END PROCESSING ---

    // Map the response to ensure consistent structure (optional but good practice)
    const response = processedRequests.map(req => ({
        id: req.id,
        status: req.status,
        notes: req.notes,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
        expiresAt: req.expiresAt,
        // Ensure Patient object is included correctly
        Patient: req.Patient ? {
            patientTagId: req.Patient.patientTagId,
            fullName: req.Patient.fullName,
            email: req.Patient.email
        } : null // Handle potential null Patient if include failed
    }));

    res.json(response);
  } catch (err) {
    console.error("Doctor view access requests error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// --- RENAMED & MODIFIED ROUTE ---
// GET /api/access/check/:doctorId/tag/:patientTagId (Check Access using tag ID)
router.get("/check/:doctorId/tag/:patientTagId", authMiddleware(), async (req, res) => {
  try {
    const doctorId = Number(req.params.doctorId); // Internal doctor ID
    // --- CHANGE: Read patientTagId from params ---
    const patientTagId = Number(req.params.patientTagId);
    if (isNaN(patientTagId)) return res.status(400).json({ message: "Invalid patientTagId" });
    // --- END CHANGE ---

    // --- NEW: Find patient by patientTagId ---
    const patient = await Patient.findOne({ where: { patientTagId: patientTagId }, attributes: ['id'] });
    if (!patient) {
        // Patient not found via tag ID, definitely no access
        return res.json({ hasAccess: false, expiresAt: null });
    }
    const internalPatientId = patient.id;
    // --- END NEW ---

    // Find an active approved request using internal IDs
    const now = new Date();
    const active = await AccessRequest.findOne({
      where: {
        doctorId,
        patientId: internalPatientId, // Use internal ID found via tag ID
        status: "approved",
        expiresAt: { [Op.gt]: now }, // Check if expiry is in the future
      },
      attributes: ['expiresAt'] // Only need expiry date
    });

    // Respond with boolean and expiry date if active
    res.json({ hasAccess: !!active, expiresAt: active ? active.expiresAt : null });
  } catch (err) {
    console.error("Check access error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
// --- END RENAMED & MODIFIED ROUTE ---

module.exports = router;