// src/components/RequestAccess.js
import React, { useState } from 'react';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';
import ConfirmationModal from './ConfirmationModal'; // 1. Import modal

const RequestAccess = () => {
  const [patientTagId, setPatientTagId] = useState('');
  const [notes, setNotes] = useState('');
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const { auth } = useAuth();
  
  // 2. Add state to control the modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 3. This is the new "confirm" function
  const handleConfirmRequest = async () => {
    setIsModalOpen(false); // Close modal
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // --- CHANGE: Send patientTagId in payload ---
      const payload = {
        patientTagId: parseInt(patientTagId, 10), // Send tag ID
        notes: notes || undefined,
      };
      // --- END CHANGE ---

      await apiClient.post('/access/request', payload, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setLoading(false);
      // --- CHANGE: Update success message ---
      setSuccess(`Access requested for Patient Tag ID: ${patientTagId}.`);
      setPatientTagId(''); // Clear tag ID state
      // --- END CHANGE ---
      setNotes('');
    } catch (err) {
      console.error('Error requesting access:', err);
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to send request.');
    }
  };

  // 4. This function now *opens* the modal instead of sending the API call
  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    // --- CHANGE: Validate patientTagId ---
    if (!patientTagId) {
      setError('Patient Tag ID is required.');
      return;
    }
    // --- END CHANGE ---
    setIsModalOpen(true);
  };

  return (
    <div className="glass-card" style={{ textAlign: 'left', color: '#FFF' }}>
      <h3 style={{ textAlign: 'center', marginTop: 0 }}>Request Patient Access</h3>
      <form onSubmit={handleSubmit}>
        <label htmlFor="reqPatientTagId">Patient Tag ID</label> 
        <input
          id="reqPatientTagId"
          type="number"
          name="patientTagId" // Use correct name
          placeholder="Enter 7-Digit Patient Tag ID"
          className="modern-input"
          value={patientTagId} // Use correct state variable
          onChange={(e) => setPatientTagId(e.target.value)} // Update correct state
          required
          autoComplete="numeric" // Add autocomplete
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

        {/* 5. The submit button is now "disabled" by the modal, not just "loading" */}
        <button type="submit" className="primary-button" disabled={loading || isModalOpen}>
          {loading ? 'Sending...' : 'Request Access'}
        </button>
      </form>

      {/* 6. Render the modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmRequest}
        title="Confirm Access Request"
        // --- CHANGE: Update modal message ---
        message={`Are you sure you want to request access for Patient Tag ID: ${patientTagId}?`}
        // --- END CHANGE ---
      />
    </div>
  );
};

export default RequestAccess;