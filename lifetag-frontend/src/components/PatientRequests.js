import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../api";
import { useAuth } from "./context/AuthContext";
import "./PatientRequests.css"; // We reuse the same CSS
import CountdownTimer from "./CountdownTimer"; // We will use the timer here too!

const PatientRequests = () => {
  // We now need two lists
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const { auth } = useAuth();

  const fetchRequests = useCallback(async () => {
    if (!auth?.token || !auth?.id) {
      setLoading(false);
      setError("User not authenticated.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.get(`/access/patient/${auth.id}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      // --- New Logic ---
      // We check for expired sessions on the frontend too
      const now = new Date();
      const allRequests = response.data;

      // 1. Find PENDING requests
      const pending = allRequests.filter((req) => req.status === "pending");

      // 2. Find ACTIVE sessions (approved AND not expired)
      const active = allRequests.filter(
        (req) => req.status === "approved" && new Date(req.expiresAt) > now
      );
      // --- End New Logic ---

      setPendingRequests(pending);
      setActiveSessions(active);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError(err.response?.data?.message || "Failed to fetch requests.");
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handles "Approve" / "Reject"
  const handleResponse = async (requestId, action) => {
    setActionLoading(requestId);
    setError(null);

    try {
      const payload = { action };
      if (action === "approve") {
        payload.durationMinutes = 30; // Our 30 min default
      }

      await apiClient.put(`/access/respond/${requestId}`, payload, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      setActionLoading(null);
      fetchRequests(); // Re-fetch the list
    } catch (err) {
      console.error(`Error ${action}ing request:`, err);
      setError(err.response?.data?.message || "Failed to process response.");
      setActionLoading(null);
    }
  };

  // --- NEW FUNCTION ---
  // Handles "End Session Now"
  const handleEndSession = async (requestId) => {
    setActionLoading(requestId); // Reuse the same loading state
    setError(null);

    // This is the NEW (FIXED) code
    try {
      // Call our NEW backend endpoint
      // axios.put(url, data, config)
      await apiClient.put(
        `/access/end/${requestId}`,
        { action: "end" }, // Send a non-empty body
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      setActionLoading(null);
      fetchRequests(); // Re-fetch the list
    } catch (err) {
      console.error("Error ending session:", err);
      setError(err.response?.data?.message || "Failed to end session.");
      setActionLoading(null);
    }
  };
  // --- END NEW FUNCTION ---

  if (loading) {
    return (
      <div className="glass-card">
        <p>Loading requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    // We'll return TWO cards (or sections)
    <>
      {/* 1. Active Sessions Card */}
      <div className="glass-card">
        <h3 style={{ marginTop: 0 }}>Active Sessions</h3>
        {activeSessions.length === 0 ? (
          <p>No active sessions.</p>
        ) : (
          <div className="requests-list">
            {activeSessions.map((req) => (
              <div key={req.id} className="request-item">
                <div className="request-details">
                  <strong>Dr. {req.Doctor.fullName}</strong>
                  <span>{req.Doctor.specialization}</span>
                  {/* Show the timer! */}
                  <CountdownTimer
                    expiresAt={req.expiresAt}
                    onExpire={fetchRequests}
                  />
                </div>
                <div className="request-actions">
                  {/* Our New Button! */}
                  <button
                    className="action-button end-session" // new style
                    onClick={() => handleEndSession(req.id)}
                    disabled={actionLoading === req.id}
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
        <h3 style={{ marginTop: 0 }}>Pending Access Requests</h3>
        {pendingRequests.length === 0 ? (
          <p>No pending access requests.</p>
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
                  <button
                    className="action-button reject"
                    onClick={() => handleResponse(req.id, "reject")}
                    disabled={actionLoading === req.id}
                  >
                    {actionLoading === req.id ? "..." : "Reject"}
                  </button>
                  <button
                    className="action-button approve"
                    onClick={() => handleResponse(req.id, "approve")}
                    disabled={actionLoading === req.id}
                  >
                    {actionLoading === req.id ? "..." : "Approve"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PatientRequests;
