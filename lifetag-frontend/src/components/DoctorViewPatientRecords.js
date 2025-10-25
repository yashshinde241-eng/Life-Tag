// src/components/DoctorViewPatientRecords.js
import React, { useState } from 'react';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';
import './PatientRecords.css'; // Reuse patient styles
import FileViewerModal from './FileViewerModal'; // 1. Import the modal

const DoctorViewPatientRecords = () => {
  const [patientId, setPatientId] = useState('');
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { auth } = useAuth();
  
  // 2. Add state for the modal
  const [selectedRecord, setSelectedRecord] = useState(null);

  const handleViewRecords = async (e) => {
    // ... (handleViewRecords logic is unchanged) ...
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRecords([]);
    setHasSearched(false);
    if (!patientId) {
      setError('Patient ID is required.');
      setLoading(false);
      return;
    }
    try {
      const checkResponse = await apiClient.get(
        `/access/check/${auth.id}/${patientId}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );
      if (checkResponse.data.hasAccess) {
        const recordsResponse = await apiClient.get(
          `/records/patient/${patientId}`, {
            headers: { Authorization: `Bearer ${auth.token}` },
          }
        );
        setRecords(recordsResponse.data);
        setHasSearched(true);
      } else {
        setError('Access is not active or has expired for this patient.');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error viewing records:', err);
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to check access or get records.');
    }
  };

  return (
    <div className="glass-card" style={{ textAlign: 'left' }}>
      <h3 style={{ textAlign: 'center', marginTop: 0 }}>View Patient Records</h3>
      
      <form onSubmit={handleViewRecords}>
        {/* ... (form is unchanged) ... */}
        <label>Patient ID</label>
        <input
          type="number"
          name="patientId"
          placeholder="Enter Patient ID to view records"
          className="modern-input"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          required
        />
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Checking Access...' : 'View Records'}
        </button>
      </form>

      <div className="records-list" style={{ marginTop: '2rem' }}>
        {records.length > 0 ? (
          records.map((record) => (
            // 3. Make the item clickable
            <div 
              key={record.id} 
              className="record-item clickable" // Added 'clickable'
              onClick={() => setSelectedRecord(record)} // Set the record
            >
              <div className="record-icon">📄</div>
              <div className="record-details">
                <strong>{record.fileName}</strong>
                <span>Type: {record.recordType || 'N/A'}</span>
                <span>Uploaded by: Dr. {record.doctor?.fullName || 'Unknown'}</span>
              </div>
              <div className="record-date">
                {new Date(record.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        ) : (
          hasSearched && <p style={{textAlign: 'center'}}>No records found for this patient.</p>
        )}
      </div>

      {/* 4. Render the modal if a record is selected */}
      {selectedRecord && (
        <FileViewerModal 
          record={selectedRecord} 
          onClose={() => setSelectedRecord(null)} // Function to close
        />
      )}
    </div>
  );
};

export default DoctorViewPatientRecords;