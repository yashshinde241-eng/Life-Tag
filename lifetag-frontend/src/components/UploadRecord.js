// src/components/UploadRecord.js
import React, { useState } from 'react';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';
import './UploadRecord.css';
import ConfirmationModal from './ConfirmationModal'; // 1. Import modal

const UploadRecord = () => {
  const [patientTagId, setPatientTagId] = useState('');
  const [recordType, setRecordType] = useState('');
  const [file, setFile] = useState(null); 
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const { auth } = useAuth();
  
  // 2. Add state to control the modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // 3. This is the new "confirm" function
  const handleConfirmUpload = async () => {
    setIsModalOpen(false);
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    // --- CHANGE: Append patientTagId ---
    formData.append('patientTagId', patientTagId); // Send tag ID
    // --- END CHANGE ---
    formData.append('file', file);
    if (recordType) {
      formData.append('recordType', recordType);
    }

    try {
      await apiClient.post('/records/upload', formData, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setLoading(false);
      setSuccess(`Record uploaded successfully for Patient ID: ${patientTagId}.`);
      setPatientTagId('');
      setRecordType('');
      setFile(null);
      // Reset the file input (requires a form)
      document.getElementById('upload-form').reset(); 

    } catch (err) {
      console.error('Error uploading record:', err);
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to upload record. Do you have active access?');
    }
  };
  
  // 4. This function now *opens* the modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!patientTagId || !file) {
      setError('Patient ID and a file are required.');
      return;
    }
    
    // Just open the modal
    setIsModalOpen(true);
  };

  return (
    <div className="glass-card" style={{ textAlign: 'left', color: '#FFF' }}>
      <h3 style={{ textAlign: 'center', marginTop: 0 }}>Upload Medical Record</h3>
      {/* 5. Give the form an ID so we can reset it */}
      <form id="upload-form" onSubmit={handleSubmit}>
        <label>Patient ID</label>
        <input
          type="number"
          name="patientId"
          placeholder="Enter Patient ID"
          className="modern-input"
          value={patientTagId}
          onChange={(e) => setPatientTagId(e.target.value)}
          required
        />
        
        <label>Record Type (Optional)</label>
        <input
          type="text"
          name="recordType"
          placeholder="e.g., 'Lab Report', 'X-Ray'"
          className="modern-input"
          value={recordType}
          onChange={(e) => setRecordType(e.target.value)}
        />
        
        <label>File</label>
        <input
          type="file"
          name="file"
          className="modern-input file-input"
          onChange={handleFileChange}
          required
        />

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message" style={{ 
            color: '#006400', 
            backgroundColor: '#C8E6C9', 
            border: '1px solid #006400',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            {success}
          </div>
        )}

        <button type="submit" className="primary-button" disabled={loading || isModalOpen}>
          {loading ? 'Uploading...' : 'Upload Record'}
        </button>
      </form>
      
      {/* 6. Render the modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmUpload}
        title="Confirm Upload"
        message={`Are you sure you want to upload "${file?.name}" for Patient ID: ${patientTagId}?`}
      />
    </div>
  );
};

export default UploadRecord;