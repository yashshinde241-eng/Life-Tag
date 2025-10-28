// src/pages/CloudRecordsPage.js
import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../api";
import { useAuth } from "../components/context/AuthContext";
import ConfirmationModal from "../components/ConfirmationModal";
import "../components/PatientRecords.css"; // Reuse styles
import "./PageWrapper.css"; // For page header

const CloudRecordsPage = () => {
  const [localRecords, setLocalRecords] = useState([]);
  const [cloudRecords, setCloudRecords] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // For Add/Delete buttons
  const { auth } = useAuth();

  // State for confirmation modal
  const [modalState, setModalState] = useState({
    isOpen: false,
    recordId: null,
    action: null, // 'backup' or 'delete'
    title: "",
    message: "",
  });

  // Function to fetch records
  const fetchRecords = useCallback(async () => {
    if (!auth?.token) {
      if (loading) setLoading(false);
      setError("User not authenticated.");
      return;
    }
    // Only set full loading on initial load
    if (!localRecords.length && !cloudRecords.length) {
      setLoading(true);
    }

    try {
      const response = await apiClient.get("/records/patient", {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      // Filter records based on s3Key presence
      const local = response.data.filter((rec) => !rec.s3Key);
      const cloud = response.data.filter((rec) => rec.s3Key);
      setLocalRecords(local);
      setCloudRecords(cloud);
      setError(null); // Clear errors on success
    } catch (err) {
      console.error("Error fetching patient records:", err);
      setError(err.response?.data?.message || "Failed to fetch records.");
    } finally {
      setLoading(false);
    }
  }, [auth, loading, localRecords.length, cloudRecords.length]); // Dependencies

  // Fetch records on load and set up polling
  useEffect(() => {
    fetchRecords();
    const intervalId = setInterval(fetchRecords, 7000); // Poll every 7 seconds
    return () => clearInterval(intervalId);
  }, [fetchRecords]);

  // --- Modal Handling ---
  const openConfirmation = (recordId, action, title, message) => {
    setModalState({ isOpen: true, recordId, action, title, message });
  };
  const closeModal = () => {
    setModalState({
      isOpen: false,
      recordId: null,
      action: null,
      title: "",
      message: "",
    });
  };

  // --- API Action Handler ---
  const handleConfirmAction = async () => {
    const { recordId, action } = modalState;
    if (!recordId || !action) return;

    setActionLoading(recordId); // Show loading on the specific item
    setError(null);
    closeModal();

    try {
      if (action === "backup") {
        // Call the backup API
        await apiClient.post(
          `/records/backup/${recordId}`,
          {},
          {
            // Empty body
            headers: { Authorization: `Bearer ${auth.token}` },
          }
        );
      } else if (action === "delete") {
        // Call the delete API
        await apiClient.delete(`/records/cloud/${recordId}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
      }
      // Success! Fetch the updated list immediately
      fetchRecords();
    } catch (err) {
      console.error(`Error ${action}ing record ${recordId}:`, err);
      setError(err.response?.data?.message || `Failed to ${action} record.`);
    } finally {
      setActionLoading(null); // Stop loading indicator
    }
  };

  // --- Render Logic ---
  if (loading && !localRecords.length && !cloudRecords.length) {
    return <p style={{ color: '#FFF' }}>Loading records...</p>;
  }

  return (
    <div className="page-wrapper"> {/* Keep the main page wrapper */}
      
      {/* --- Section 1: Records Ready for Backup --- */}
      <div> {/* Use a simple div, no card */}
        {/* Use the standard page header style */}
        <h2 className="page-header">Ready for Cloud Backup</h2> 

        {/* Display overall error only once if needed */}
        {error && actionLoading === null && !loading && <p className="error-message" style={{color: '#FFF'}}>{error}</p>}

        {localRecords.length === 0 ? (
          <p style={{color: '#EEE', textAlign: 'center'}}>No local records waiting for backup.</p>
        ) : (
          <div className="records-list"> {/* Reuse the existing list class */}
            {localRecords.map((record) => (
              <div key={record.id} className="record-item"> {/* Standard record item */}
                 <div className="record-icon">📄</div> {/* Document Icon */}
                 <div className="record-details">
                   <strong>{record.fileName}</strong>
                   <span>Type: {record.recordType || 'N/A'}</span>
                   <span>Uploaded by: {record.doctor ? `Dr. ${record.doctor.fullName}`: 'You'}</span>
                 </div>
                 <div className="record-date">
                   {new Date(record.createdAt).toLocaleDateString()}
                 </div>
                 {/* Backup Button */}
                 <button
                    className="action-button backup" // Use backup class
                    onClick={() => openConfirmation(record.id, 'backup', 'Confirm Backup', `Add "${record.fileName}" to cloud storage?`)}
                    disabled={actionLoading === record.id}
                 >
                    {actionLoading === record.id ? 'Adding...' : 'Add to Cloud'}
                 </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Add Spacing Between Sections --- */}
      <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '3rem 0' }} />

      {/* --- Section 2: Records Already in Cloud --- */}
      <div> {/* Use a simple div, no card */}
        {/* Use the standard page header style */}
        <h2 className="page-header">Records in Cloud</h2>

        {cloudRecords.length === 0 ? (
          <p style={{color: '#EEE', textAlign: 'center'}}>No records currently stored in the cloud.</p>
        ) : (
          <div className="records-list"> {/* Reuse the existing list class */}
            {cloudRecords.map((record) => (
              // Make cloud records clickable to view
              <div 
                key={record.id} 
                className="record-item clickable" 
                // onClick={() => setSelectedRecord(record)} // Add this if you want view functionality here too
              > 
                 <div className="record-icon">☁️</div> {/* Cloud Icon */}
                 <div className="record-details">
                   <strong>{record.fileName}</strong>
                   <span>Type: {record.recordType || 'N/A'}</span>
                   <span>Uploaded by: {record.doctor ? `Dr. ${record.doctor.fullName}`: 'You'}</span>
                 </div>
                 <div className="record-date">
                   {new Date(record.createdAt).toLocaleDateString()}
                 </div>
                 {/* Delete Button */}
                 <button
                    className="action-button reject" // Use reject style (red)
                    onClick={(e) => {
                        e.stopPropagation(); 
                        openConfirmation(record.id, 'delete', 'Confirm Deletion', `Permanently delete "${record.fileName}" from cloud? This cannot be undone.`);
                    }}
                    disabled={actionLoading === record.id}
                 >
                    {actionLoading === record.id ? 'Deleting...' : 'Delete'}
                 </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Render the confirmation modal (remains the same) */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirmAction}
        title={modalState.title}
        message={modalState.message}
      />

      {/* Render the File Viewer Modal if needed (add selectedRecord state back if you enable clicks) */}
      {/* {selectedRecord && (
        <FileViewerModal 
          record={selectedRecord} 
          onClose={() => setSelectedRecord(null)}
          isReadOnly={false} // Patient has full access
        />
      )} */}
    </div> // End page-wrapper
  );
}; // End CloudRecordsPage component

export default CloudRecordsPage;
