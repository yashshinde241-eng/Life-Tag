// src/components/DoctorViewPatientRecords.js
import React, { useState } from "react";
import apiClient from "../api";
import { useAuth } from "./context/AuthContext";
import "./PatientRecords.css"; // Reuse patient styles
import FileViewerModal from "./FileViewerModal";

const DoctorViewPatientRecords = () => {
  const [patientTagId, setPatientTagId] = useState("");
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { auth } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleViewRecords = async (e) => {
    // ... (handleViewRecords logic is unchanged) ...
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRecords([]);
    setHasSearched(false);
    if (!patientTagId) {
      setError("Patient Tag ID is required.");
      setLoading(false);
      return;
    }
    try {
      // --- CHANGE: Call the new Check Access route first ---
      const checkResponse = await apiClient.get(
        // Use internal doctor ID and patient Tag ID
        `/access/check/${auth.id}/tag/${patientTagId}`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );
      if (checkResponse.data.hasAccess) {
        // --- CHANGE: Call the new View Records route ---
        const recordsResponse = await apiClient.get(
          `/records/patient/tag/${patientTagId}`, // Use tag ID in URL
          { headers: { Authorization: `Bearer ${auth.token}` } }
        );
        // --- END CHANGE ---
        setRecords(recordsResponse.data);
        setHasSearched(true);
      } else {
        setError("Access is not active or has expired for this patient.");
      }
      setLoading(false);
    } catch (err) {
      console.error("Error viewing records:", err);
      setLoading(false);
      setError(
        err.response?.data?.message || "Failed to check access or get records."
      );
    }
  };

  return (
    <>
      <h2 className="page-header">View Patient Records</h2>

      {/* --- NEW: Form is now a header card --- */}
      <div className="glass-card patient-select-header">
        {" "}
        {/* Added new class */}
        {/* Use a form tag here for semantics */}
        <form onSubmit={handleViewRecords} className="patient-select-form">
          {" "}
          {/* Added new class */}
          <label htmlFor="viewPatientTagId">Patient Tag ID</label>
          <input
            id="viewPatientTagId"
            type="number"
            name="patientTagId" // Use correct name
            placeholder="Enter 7-Digit Tag ID"
            className="modern-input"
            value={patientTagId} // Use correct state
            onChange={(e) => setPatientTagId(e.target.value)} // Update correct state
            required
            autoComplete="numeric"
          />
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "Checking..." : "View Records"}
          </button>
        </form>
        {/* Moved error display inside the header card */}
        {error && <div className="error-message header-error">{error}</div>}
      </div>
      {/* --- END HEADER CARD --- */}

      {/* --- Records List remains below --- */}
      <div className="records-list-container" style={{ marginTop: "2rem" }}>
        {loading && <p style={{ color: "#FFF" }}>Loading records...</p>}

        {!loading && records.length > 0 && (
          <div className="records-list">
            {records.map((record) => (
              <div
                key={record.id}
                className="record-item clickable"
                onClick={() => setSelectedRecord(record)}
              >
                {/* ... record item JSX ... */}
                <div className="record-icon">📄</div>
                <div className="record-details">
                  <strong>{record.fileName}</strong>
                  <span>Type: {record.recordType || "N/A"}</span>
                  <span>
                    Uploaded by: Dr. {record.Doctor?.fullName || "Unknown"}
                  </span>
                </div>
                <div className="record-date">
                  {new Date(record.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && hasSearched && records.length === 0 && (
          <p style={{ textAlign: "center", color: "#FFF" }}>
            No records found for this patient.
          </p>
        )}
      </div>

      {/* Modal - Pass isReadOnly={true} */}
      {selectedRecord && (
        <FileViewerModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          isReadOnly={true} // <-- ADD THIS PROP FOR DOCTOR
        />
      )}
    </>
  );
};

export default DoctorViewPatientRecords;
