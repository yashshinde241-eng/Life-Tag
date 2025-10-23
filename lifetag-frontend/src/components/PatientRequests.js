import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';
import './PatientRequests.css'; // We will create this

const PatientRequests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // Tracks which button is loading
  const { auth } = useAuth();

  // We wrap this in useCallback so it doesn't cause useEffect to re-run unnecessarily
  const fetchRequests = useCallback(async () => {
    if (!auth?.token || !auth?.id) {
      setLoading(false);
      setError('User not authenticated.');
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch the list of requests using the patient's ID
      const response = await apiClient.get(`/access/patient/${auth.id}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      
      // 2. We only want to show "pending" requests
      setRequests(response.data.filter(req => req.status === 'pending'));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch requests.');
      setLoading(false);
    }
  }, [auth]); // Dependency on auth object

  // 3. Fetch requests when the component loads
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]); // Now useEffect depends on the stable fetchRequests function

  // 4. This function handles the "Approve" or "Reject" click
  const handleResponse = async (requestId, action) => {
    setActionLoading(requestId); // Set loading state for this specific button
    setError(null);

    try {
      const payload = { action };
      // Only add duration if approving
      if (action === 'approve') {
        payload.durationMinutes = 30; // Default 30 minutes
      }

      await apiClient.put(`/access/respond/${requestId}`, payload, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      // 5. Success! Refresh the list to remove the request
      setActionLoading(null);
      fetchRequests(); // Re-fetch the list
    } catch (err) {
      console.error(`Error ${action}ing request:`, err);
      setError(err.response?.data?.message || 'Failed to process response.');
      setActionLoading(null);
    }
  };

  // 6. Render loading state
  if (loading) {
    return (
      <div className="glass-card">
        <h3>Access Requests</h3>
        <p>Loading requests...</p>
      </div>
    );
  }

  // 7. Render error state
  if (error) {
    return (
      <div className="glass-card">
        <h3>Access Requests</h3>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  // 8. Render the list of pending requests
  return (
    <div className="glass-card">
      <h3 style={{ marginTop: 0 }}>Pending Access Requests</h3>
      
      {requests.length === 0 ? (
        <p>No pending access requests.</p>
      ) : (
        <div className="requests-list">
          {requests.map((req) => (
            <div key={req.id} className="request-item">
              <div className="request-details">
                <strong>Dr. {req.Doctor.fullName}</strong>
                <span>{req.Doctor.specialization}</span>
                <span className="notes">Notes: "{req.notes || 'No notes provided.'}"</span>
              </div>
              <div className="request-actions">
                <button
                  className="action-button reject"
                  onClick={() => handleResponse(req.id, 'reject')}
                  disabled={actionLoading === req.id}
                >
                  {actionLoading === req.id ? '...' : 'Reject'}
                </button>
                <button
                  className="action-button approve"
                  onClick={() => handleResponse(req.id, 'approve')}
                  disabled={actionLoading === req.id}
                >
                  {actionLoading === req.id ? '...' : 'Approve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientRequests;