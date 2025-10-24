import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../api";
import { useAuth } from "./context/AuthContext";
import "./DoctorRequests.css"; // We will create this
import CountdownTimer from "./CountdownTimer";

const DoctorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { auth } = useAuth();

  // We wrap this in useCallback to make it stable
  const fetchRequests = useCallback(async () => {
    if (!auth?.token || !auth?.id) {
      setLoading(false);
      setError("User not authenticated.");
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch requests using the DOCTOR'S ID
      const response = await apiClient.get(`/access/doctor/${auth.id}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      // 2. Save the list
      // This will filter out 'expired', 'rejected', etc.
      const activeRequests = response.data.filter(
        (req) => req.status === "pending" || req.status === "approved"
      );
      setRequests(activeRequests);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError(err.response?.data?.message || "Failed to fetch requests.");
      setLoading(false);
    }
  }, [auth]); // Dependency on auth object

  // 3. Fetch requests when the component loads
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // 4. Render states
  if (loading) {
    return (
      <div className="glass-card">
        <h3>My Sent Requests</h3>
        <p>Loading requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card">
        <h3>My Sent Requests</h3>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  // 5. Render the list
  return (
    <div className="glass-card">
      <h3 style={{ marginTop: 0 }}>My Sent Requests</h3>

      {requests.length === 0 ? (
        <p>You have not sent any access requests.</p>
      ) : (
        <div className="doctor-requests-list">
          {requests.map((req) => (
            <div key={req.id} className="doctor-request-item">
              <div className="request-details">
                <strong>Patient ID: {req.Patient.id}</strong>
                <span>Name: {req.Patient.fullName}</span>
                <span className="notes">Notes: "{req.notes || "N/A"}"</span>
              </div>
              {/* This is the NEW code to paste */}
              <div className="request-status">
                {/* IF the status is "approved" AND expiresAt exists, show the timer.
    Otherwise, show the normal status badge.
  */}
                {req.status === "approved" && req.expiresAt ? (
                  // Pass the fetchRequests function as the onExpire prop!
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
    </div>
  );
};

export default DoctorRequests;
