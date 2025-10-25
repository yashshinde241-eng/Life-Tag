// src/components/PatientRequests.js
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';
import './PatientRequests.css'; 
import CountdownTimer from './CountdownTimer';
import ConfirmationModal from './ConfirmationModal'; // Import modal

const PatientRequests = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const { auth } = useAuth();

  // State to manage the modal
  const [modalState, setModalState] = useState({
    isOpen: false,
    requestId: null,
    action: null, // 'approve', 'reject', or 'end'
    message: '',
    title: '', // Added title for the modal
  });

  const fetchRequests = useCallback(async () => {
    if (!auth?.token || !auth?.id) {
      // Don't reset loading if polling, just return
      if(loading) setLoading(false); 
      setError('User not authenticated.');
      return;
    }

    // Only show full loading on initial fetch
    if (!pendingRequests.length && !activeSessions.length) {
        setLoading(true);
    }

    try {
      const response = await apiClient.get(`/access/patient/${auth.id}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const now = new Date();
      const allRequests = response.data;
      const pending = allRequests.filter((req) => req.status === 'pending');
      const active = allRequests.filter((req) => 
        req.status === 'approved' && new Date(req.expiresAt) > now
      );
      setPendingRequests(pending);
      setActiveSessions(active);
      setError(null); // Clear previous errors on successful fetch
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch requests.');
    } finally {
        // Always set loading to false after fetch attempt
        setLoading(false);
    }
  }, [auth, loading, pendingRequests.length, activeSessions.length]); // Dependencies for fetchRequests

  useEffect(() => {
    fetchRequests(); // Fetch on initial load
    // Set up polling interval
    const intervalId = setInterval(fetchRequests, 5000); // Poll every 5 seconds
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [fetchRequests]); // Rerun effect if fetchRequests changes

  // Function to open the modal with specific details
  const openConfirmation = (requestId, action, title, message) => {
    setModalState({ isOpen: true, requestId, action, title, message });
  };
  // Function to close the modal
  const closeModal = () => {
    setModalState({ isOpen: false, requestId: null, action: null, title: '', message: '' });
  };

  // Function called when user clicks "Confirm" in the modal
  const handleConfirmAction = async () => {
    const { requestId, action } = modalState;
    if (!requestId || !action) return;

    setActionLoading(requestId); // Show loading on the specific item
    setError(null);
    closeModal(); // Close modal immediately

    try {
      if (action === 'end') {
        // End Session logic
        await apiClient.put(`/access/end/${requestId}`, { action: 'end' }, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
      } else {
        // Approve/Reject logic
        const payload = { action };
        if (action === 'approve') {
          payload.durationMinutes = 30; // 30 min duration
        }
        await apiClient.put(`/access/respond/${requestId}`, payload, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
      }
      // Success! Fetch the updated list
      fetchRequests(); 
    } catch (err) {
      console.error(`Error ${action}ing request:`, err);
      setError(err.response?.data?.message || `Failed to ${action} request.`);
    } finally {
      setActionLoading(null); // Stop loading indicator
    }
  };

  // Show loading indicator only on initial load
  if (loading && !pendingRequests.length && !activeSessions.length) {
     // Use color: '#FFF' for visibility on dark background
    return <p style={{color: '#FFF'}}>Loading requests...</p>;
  }
  
  // Show error message if fetch failed
  if (error && !pendingRequests.length && !activeSessions.length) {
    return <p className="error-message" style={{color: '#FFF'}}>{error}</p>;
  }

  return (
    // Render the two sections: Active Sessions and Pending Requests
    <>
      {/* 1. Active Sessions Card */}
      <div className="glass-card">
        <h3 style={{ marginTop: 0, color: '#111' }}>Active Sessions</h3>
        {activeSessions.length === 0 ? (
          <p style={{color: '#555'}}>No active sessions.</p>
        ) : (
          <div className="requests-list">
            {activeSessions.map((req) => (
              <div key={req.id} className="request-item">
                <div className="request-details">
                  <strong>Dr. {req.Doctor.fullName}</strong>
                  <span>{req.Doctor.specialization}</span>
                  {/* Display countdown timer for active session */}
                  <CountdownTimer
                    expiresAt={req.expiresAt}
                    onExpire={fetchRequests} // Refresh list when timer expires
                  />
                </div>
                <div className="request-actions">
                  {/* Button to end the session */}
                  <button
                    className="action-button end-session"
                    // Open confirmation modal on click
                    onClick={() => openConfirmation(req.id, 'end', 'Confirm End Session', 'Are you sure you want to end this session now?')}
                    disabled={actionLoading === req.id} // Disable button while action is loading
                  >
                    {actionLoading === req.id ? "..." : "End Session Now"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Pending Requests Card */}
      <div className="glass-card">
        <h3 style={{ marginTop: 0, color: '#111' }}>Pending Access Requests</h3>
        {pendingRequests.length === 0 ? (
          <p style={{color: '#555'}}>No pending access requests.</p>
        ) : (
          <div className="requests-list">
            {pendingRequests.map((req) => (
              <div key={req.id} className="request-item">
                <div className="request-details">
                  <strong>Dr. {req.Doctor.fullName}</strong>
                  <span>{req.Doctor.specialization}</span>
                  <span className="notes">
                    Notes: "{req.notes || "No notes provided."}"
                  </span>
                </div>
                <div className="request-actions">
                  {/* Button to reject request */}
                  <button
                    className="action-button reject"
                    // Open confirmation modal on click
                    onClick={() => openConfirmation(req.id, 'reject', 'Confirm Rejection', 'Are you sure you want to REJECT this access request?')}
                    disabled={actionLoading === req.id} // Disable button while action is loading
                  >
                    {actionLoading === req.id ? "..." : "Reject"}
                  </button>
                  {/* Button to approve request */}
                  <button
                    className="action-button approve"
                    // Open confirmation modal on click
                    onClick={() => openConfirmation(req.id, 'approve', 'Confirm Approval', 'Are you sure you want to APPROVE access for 30 minutes?')}
                    disabled={actionLoading === req.id} // Disable button while action is loading
                  >
                    {actionLoading === req.id ? "..." : "Approve"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Render the confirmation modal */}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={closeModal} // Function to close modal
        onConfirm={handleConfirmAction} // Function to execute on confirm
        title={modalState.title} // Dynamic title
        message={modalState.message} // Dynamic message
      />
    </>
  );
};

export default PatientRequests;