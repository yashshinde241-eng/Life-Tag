// src/components/PatientUploadForm.js
import React, { useState } from 'react';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';
import ConfirmationModal from './ConfirmationModal';
// Reuse doctor's upload CSS (or create a new one if needed)
import './UploadRecord.css';

const PatientUploadForm = () => {
  // We only need recordType and file state here
  const [recordType, setRecordType] = useState('');
  const [file, setFile] = useState(null);
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const { auth } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleConfirmUpload = async () => {
    setIsModalOpen(false);
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Use FormData for the upload
    const formData = new FormData();
    formData.append('file', file);
    if (recordType) {
      formData.append('recordType', recordType);
    }

    try {
      // Call the NEW patient upload endpoint
      await apiClient.post('/records/upload/patient', formData, {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'multipart/form-data', 
        },
      });

      setLoading(false);
      setSuccess(`Record "${file?.name}" uploaded successfully.`);
      setRecordType('');
      setFile(null);
      // Reset the file input via form ID
      document.getElementById('patient-upload-form').reset(); 

    } catch (err) {
      console.error('Error uploading patient record:', err);
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to upload record.');
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!file) {
      setError('A file is required.');
      return;
    }
    // Open the confirmation modal
    setIsModalOpen(true);
  };

  return (
    // Use the glass card, ensure text is visible on dark canvas
    <div className="glass-card" style={{ textAlign: 'left', color: '#FFF' }}> 
      <h3 style={{ textAlign: 'center', marginTop: 0 }}>Upload Your Record</h3>
      {/* Give form an ID */}
      <form id="patient-upload-form" onSubmit={handleSubmit}>
        
        <label>Record Type (Optional)</label>
        <input
          type="text"
          name="recordType"
          placeholder="e.g., 'Prescription', 'Lab Result'"
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
          required // File input requires this
        />

        {error && (
          <div className="error-message">{error}</div>
        )}
        
        {success && (
          // Use green success message style
          <div className="success-message" style={{ color: '#006400', backgroundColor: '#C8E6C9', border: '1px solid #006400', borderRadius: '8px', padding: '10px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {success}
          </div>
        )}

        <button type="submit" className="primary-button" disabled={loading || isModalOpen}>
          {loading ? 'Uploading...' : 'Upload Record'}
        </button>
      </form>
      
      {/* Render the confirmation modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmUpload}
        title="Confirm Upload"
        message={`Are you sure you want to upload "${file?.name}"?`}
      />
    </div>
  );
};

export default PatientUploadForm;