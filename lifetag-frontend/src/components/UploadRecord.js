import React, { useState } from 'react';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';
import './UploadRecord.css'; // We'll create this

const UploadRecord = () => {
  const [patientId, setPatientId] = useState('');
  const [recordType, setRecordType] = useState('');
  const [file, setFile] = useState(null); // State for the file itself
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const { auth } = useAuth();

  const handleFileChange = (e) => {
    setFile(e.target.files[0]); // Get the first file
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!patientId || !file) {
      setError('Patient ID and a file are required.');
      setLoading(false);
      return;
    }

    // 1. We must use FormData for file uploads
    const formData = new FormData();
    formData.append('patientId', patientId);
    formData.append('file', file);
    if (recordType) {
      formData.append('recordType', recordType);
    }

    try {
      // 2. Make the API call
      await apiClient.post('/records/upload', formData, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'multipart/form-data', // This header is crucial
        },
      });

      // 3. Show success message
      setLoading(false);
      setSuccess(`Record uploaded successfully for Patient ID: ${patientId}.`);
      setPatientId('');
      setRecordType('');
      setFile(null);
      e.target.reset(); // Reset the form fields

    } catch (err) {
      console.error('Error uploading record:', err);
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to upload record. Do you have active access?');
    }
  };

  return (
    <div className="glass-card" style={{ textAlign: 'left' }}>
      <h3 style={{ textAlign: 'center', marginTop: 0 }}>Upload Medical Record</h3>
      <form onSubmit={handleSubmit}>
        <label>Patient ID</label>
        <input
          type="number"
          name="patientId"
          placeholder="Enter Patient ID"
          className="modern-input"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
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
          className="modern-input file-input" // Special class for file input
          onChange={handleFileChange}
          required
        />

        {/* 4. Show Success or Error Messages */}
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

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload Record'}
        </button>
      </form>
    </div>
  );
};

export default UploadRecord;