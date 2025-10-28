// src/components/PatientRecords.js
import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';
import './PatientRecords.css';
import FileViewerModal from './FileViewerModal'; // 1. Import the modal

const PatientRecords = () => {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { auth } = useAuth();
  
  // 2. Add state for the modal
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    // ... (useEffect logic is unchanged) ...
    const fetchRecords = async () => {
      if (!auth?.token) {
        setLoading(false);
        setError('No authentication token found.');
        return;
      }
      try {
        const response = await apiClient.get('/records/patient', {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        setRecords(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching records:', err);
        setError(err.response?.data?.message || 'Failed to fetch records.');
      }
    };
    fetchRecords();
  }, [auth]);

  if (loading) {
    return <p>Loading records...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <>
      <h2 className="page-header">My Medical Records</h2>
      
      {records.length === 0 ? (
        <p>No medical records found.</p>
      ) : (
        <div className="records-list">
          {records.map((record) => (
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
                <span>Uploaded by: {record.doctor.fullName}</span>
              </div>
              <div className="record-date">
                {new Date(record.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Render the modal if a record is selected */}
      {selectedRecord && (
        <FileViewerModal 
          record={selectedRecord} 
          onClose={() => setSelectedRecord(null)} // Function to close
        />
      )}
    </>
  );
};

export default PatientRecords;