// src/components/DoctorRequests.js
import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../api";
import { useAuth } from "./context/AuthContext";
import "./DoctorRequests.css";
import CountdownTimer from "./CountdownTimer";

const DoctorRequests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { auth } = useAuth();

  const fetchRequests = useCallback(async () => {
    // ... (fetchRequests logic is unchanged) ...
    if (!auth?.token || !auth?.id) {
      setLoading(false);
      setError("User not authenticated.");
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.get(`/access/doctor/${auth.id}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
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
  }, [auth]);

  // 3. Fetch requests when the component loads AND poll for updates
  useEffect(() => {
    // 1. Fetch data immediately on load
    fetchRequests();

    // 2. Set up an interval to re-fetch every 5 seconds
    const intervalId = setInterval(() => {
      fetchRequests();
    }, 5000); // 5000ms = 5 seconds

    // 3. This is crucial: stop the interval when you leave the page
    //    to prevent memory leaks.
    return () => clearInterval(intervalId);
  }, [fetchRequests]); // We already use useCallback, so this is safe

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
                <strong>
                  Patient: {req.Patient.fullName} (ID: {req.Patient.id})
                </strong>
                <span className="notes">Notes: "{req.notes || "N/A"}"</span>
              </div>
              <div className="request-status">
                {req.status === "approved" && req.expiresAt ? (
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
