import React, { useState } from 'react';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';

const RequestAccess = () => {
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // For success message
  const [loading, setLoading] = useState(false);
  const { auth } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!patientId) {
      setError('Patient ID is required.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        patientId: parseInt(patientId, 10), // Ensure it's a number
        notes: notes || undefined, // Send undefined if empty
      };

      // 1. Make the API call
      await apiClient.post('/access/request', payload, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      // 2. Show success message
      setLoading(false);
      setSuccess(`Access requested for Patient ID: ${patientId}.`);
      setPatientId(''); // Clear the form
      setNotes('');

    } catch (err) {
      console.error('Error requesting access:', err);
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to send request.');
    }
  };

  return (
    <div className="glass-card" style={{ textAlign: 'left' }}>
      <h3 style={{ textAlign: 'center', marginTop: 0 }}>Request Patient Access</h3>
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
        
        <label>Notes (Optional)</label>
        <input
          type="text"
          name="notes"
          placeholder="e.g., 'Need access for lab review'"
          className="modern-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* 3. Show Success or Error Messages */}
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
          {loading ? 'Sending Request...' : 'Request Access'}
        </button>
      </form>
    </div>
  );
};

export default RequestAccess;