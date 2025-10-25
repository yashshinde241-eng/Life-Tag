// src/components/DoctorRequests.js
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';
import './DoctorRequests.css'; 
import CountdownTimer from './CountdownTimer';

const DoctorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { auth } = useAuth();

  const fetchRequests = useCallback(async () => {
    // ... (fetchRequests logic is unchanged) ...
    if (!auth?.token || !auth?.id) {
      setLoading(false);
      setError('User not authenticated.');
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.get(`/access/doctor/${auth.id}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const activeRequests = response.data.filter(
        (req) => req.status === 'pending' || req.status === 'approved'
      );
      setRequests(activeRequests);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err.response?.data?.message || 'Failed to fetch requests.');
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  if (loading) {
    return <p>Loading requests...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <>
      <h2 className="page-header">My Sent Requests</h2>
      
      {requests.length === 0 ? (
        <p>You have no active or pending requests.</p>
      ) : (
        <div className="doctor-requests-list">
          {requests.map((req) => (
            <div key={req.id} className="doctor-request-item">
              <div className="request-details">
                <strong>Patient: {req.Patient.fullName} (ID: {req.Patient.id})</strong>
                <span className="notes">Notes: "{req.notes || 'N/A'}"</span>
              </div>
              <div className="request-status">
                {req.status === 'approved' && req.expiresAt ? (
                  <CountdownTimer 
                    expiresAt={req.expiresAt} 
                    onExpire={fetchRequests} 
                  />
                ) : (
                  <span className={`status-badge status-${req.status}`}>
                    {req.status}
                  </span>
                )}
                <span className="request-date">
                  {new Date(req.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default DoctorRequests;