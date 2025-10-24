// backend/routes/accessRoutes.js
const express = require("express");
const { Op } = require("sequelize");
const router = express.Router();
const { AccessRequest, Doctor, Patient } = require("../models");
const authMiddleware = require("../middleware/authMiddleware");

// POST /api/access/request
// Doctor creates a request for a patient
// Body: { patientId, notes (optional) }
router.post("/request", authMiddleware(["doctor"]), async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { patientId, notes } = req.body;

    if (!patientId)
      return res.status(400).json({ message: "patientId is required" });

    const reqRecord = await AccessRequest.create({
      doctorId,
      patientId: Number(patientId),
      status: "pending",
      notes: notes || null,
    });

    res
      .status(201)
      .json({ message: "Access request created", requestId: reqRecord.id });
  } catch (err) {
    console.error("Create access request error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/access/patient/:patientId
// Patient views requests targeted to them (pending/approved/rejected)
router.get(
  "/patient/:patientId",
  authMiddleware(["patient"]),
  async (req, res) => {
    try {
      const patientId = Number(req.params.patientId);
      // Ensure patient is requesting their own requests
      if (req.user.id !== patientId) {
        return res
          .status(403)
          .json({ message: "Forbidden: can only view your own requests" });
      }

      const requests = await AccessRequest.findAll({
        where: { patientId },
        include: [
          {
            model: Doctor,
            attributes: ["id", "fullName", "specialization", "hospital"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      res.json(requests);
    } catch (err) {
      console.error("Patient view access requests error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// PUT /api/access/respond/:id
// Patient approves or rejects a request
// Body: { action: "approve"|"reject", durationMinutes: number (only for approve) }
router.put("/respond/:id", authMiddleware(["patient"]), async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const { action, durationMinutes } = req.body;

    const reqRecord = await AccessRequest.findByPk(requestId);
    if (!reqRecord)
      return res.status(404).json({ message: "Request not found" });

    // Ensure patient owns this request
    if (req.user.id !== reqRecord.patientId) {
      return res
        .status(403)
        .json({ message: "Forbidden: cannot respond to this request" });
    }

    if (action === "reject") {
      reqRecord.status = "rejected";
      reqRecord.expiresAt = null;
      await reqRecord.save();
      return res.json({ message: "Request rejected" });
    }

    if (action === "approve") {
      const mins = Number(durationMinutes) || 30; // default 10 minutes if not provided
      const expiresAt = new Date(Date.now() + mins * 60 * 1000);
      reqRecord.status = "approved";
      reqRecord.expiresAt = expiresAt;
      await reqRecord.save();
      return res.json({ message: "Request approved", expiresAt });
    }

    res
      .status(400)
      .json({ message: "Invalid action. Use 'approve' or 'reject'." });
  } catch (err) {
    console.error("Respond access request error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT /api/access/end/:id
// Patient manually ends an active, approved session
router.put("/end/:id", authMiddleware(["patient"]), async (req, res) => {
  try {
    const requestId = Number(req.params.id);
    const reqRecord = await AccessRequest.findByPk(requestId);

    if (!reqRecord) {
      return res.status(404).json({ message: "Request not found" });
    }

    // Ensure patient owns this request
    if (req.user.id !== reqRecord.patientId) {
      return res.status(403).json({ message: "Forbidden: Not your request" });
    }

    // Ensure the request is currently approved
    if (reqRecord.status !== "approved") {
      return res.status(400).json({ message: "Session is not active" });
    }

    // --- This is the new logic ---
    // We manually expire the session
    reqRecord.status = "expired";
    reqRecord.expiresAt = new Date(); // Set expiry to *now*
    await reqRecord.save();
    // ----------------------------

    res.json({ message: "Session ended successfully" });

  } catch (err) {
    console.error("End session error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/access/doctor/:doctorId
// Doctor views the requests they created
// GET /api/access/doctor/:doctorId
// Doctor views the requests they created
router.get(
  "/doctor/:doctorId",
  authMiddleware(["doctor"]),
  async (req, res) => {
    try {
      const doctorId = Number(req.params.doctorId); // only allow doctor to view their own requests
      if (req.user.id !== doctorId) {
        return res
          .status(403)
          .json({ message: "Forbidden: can only view your own requests" });
      }

      const requests = await AccessRequest.findAll({
        where: { doctorId },
        include: [{ model: Patient, attributes: ["id", "fullName", "email"] }],
        order: [["createdAt", "DESC"]],
      });

      // **** START OF NEW LOGIC ****
      const now = new Date();

      // Process requests to check for expired ones
      const processedRequests = await Promise.all(
        requests.map(async (req) => {
          // If it's approved and the time has passed
          if (req.status === "approved" && now > new Date(req.expiresAt)) {
            // Update status to 'expired'
            req.status = "expired";

            // Also save this change to the database
            await req.save();
          }
          return req;
        })
      );
      // **** END OF NEW LOGLOGIC ****

      // Send the updated list
      res.json(processedRequests);
    } catch (err) {
      console.error("Doctor view access requests error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// GET /api/access/check/:doctorId/:patientId
// Check if doctor has an active approved access for patient
router.get(
  "/check/:doctorId/:patientId",
  authMiddleware(),
  async (req, res) => {
    try {
      const doctorId = Number(req.params.doctorId);
      const patientId = Number(req.params.patientId);

      // find an approved request not yet expired
      const now = new Date();
      const active = await AccessRequest.findOne({
        where: {
          doctorId,
          patientId,
          status: "approved",
          expiresAt: { [Op.gt]: now },
        },
      });

      res.json({
        hasAccess: !!active,
        expiresAt: active ? active.expiresAt : null,
      });
    } catch (err) {
      console.error("Check access error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

module.exports = router;
