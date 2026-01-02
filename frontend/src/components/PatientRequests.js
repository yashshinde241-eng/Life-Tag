// src/components/PatientRequests.js
import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../api";
import { useAuth } from "./context/AuthContext";
import "./PatientRequests.css";
import CountdownTimer from "./CountdownTimer";
import ConfirmationModal from "./ConfirmationModal"; // Import modal

const PatientRequests = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Start loading initially
  const [actionLoading, setActionLoading] = useState(null);
  const { auth } = useAuth();

  // State to manage the modal
  const [modalState, setModalState] = useState({
    isOpen: false,
    requestId: null,
    action: null, // 'approve', 'reject', or 'end'
    message: "",
    title: "", // Added title for the modal
  });

  // Function to fetch records
  const fetchRequests = useCallback(async () => {
    // Check if auth context is ready and has the necessary info
    if (!auth?.token || !auth?.tagId) {
      // Don't repeatedly set error if polling while logged out or context not ready
      if (loading) { // <-- Reads 'loading' state
          setError(!auth?.tagId ? 'Patient Tag ID not found in auth context.' : 'User not authenticated.');
          setLoading(false);
      }
      return; // Exit if not authenticated
    }

    // Set loading state only if it's not already loading (avoids flicker during polling)
    setLoading(true); // Set loading state

    try {
      // Fetch requests using the patient's tag ID
      const response = await apiClient.get(
        `/access/patient/tag/${auth.tagId}`,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      // Process the response data
      const now = new Date();
      const allRequests = response.data;

      // Filter requests into pending and active lists
      const pending = allRequests.filter((req) => req.status === "pending");
      const active = allRequests.filter(
        (req) =>
          req.status === "approved" &&
          req.expiresAt &&
          new Date(req.expiresAt) > now // Added check for req.expiresAt
      );

      // Update state with the fetched and filtered requests
      setPendingRequests(pending);
      setActiveSessions(active);
      setError(null); // Clear any previous errors on successful fetch
    } catch (err) {
      console.error('Error fetching requests:', err);
      // Set error state only if it's different from the current error to avoid re-renders
      const newError = err.response?.data?.message || 'Failed to fetch requests.';
      if (error !== newError) { // <-- Reads 'error' state
          setError(newError);
      }
    } finally {
      // Ensure loading is set to false after every fetch attempt
      setLoading(false);
    }
  // --- CORRECTED DEPENDENCY ARRAY ---
  // Add 'error' and 'loading'
  }, [auth, error, loading]);
  // --- END CORRECTION ---

  // useEffect hook to fetch data on mount and set up polling
  useEffect(() => {
    fetchRequests(); // Fetch immediately when component mounts or fetchRequests changes
    // Set up interval to poll for new data every 5 seconds
    const intervalId = setInterval(fetchRequests, 5000);
    // Cleanup function to clear interval when component unmounts
    return () => clearInterval(intervalId);
  }, [fetchRequests]); // Dependency array includes fetchRequests

  // Function to open the confirmation modal
  const openConfirmation = (requestId, action, title, message) => {
    setModalState({ isOpen: true, requestId, action, title, message });
  };
  // Function to close the confirmation modal
  const closeModal = () => {
    setModalState({
      isOpen: false,
      requestId: null,
      action: null,
      title: "",
      message: "",
    });
  };

  // Function to handle the confirmed action (Approve, Reject, End Session)
  const handleConfirmAction = async () => {
    const { requestId, action } = modalState;
    if (!requestId || !action) return; // Exit if modal state is invalid

    setActionLoading(requestId); // Set loading state for the specific button
    setError(null); // Clear previous errors
    closeModal(); // Close the modal

    try {
      // Perform API call based on the action
      if (action === "end") {
        // API call to end the session
        await apiClient.put(
          `/access/end/${requestId}`,
          { action: "end" },
          {
            headers: { Authorization: `Bearer ${auth.token}` },
          }
        );
      } else {
        // API call to approve or reject the request
        const payload = { action };
        if (action === "approve") {
          payload.durationMinutes = 30; // Set duration for approval
        }
        await apiClient.put(`/access/respond/${requestId}`, payload, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
      }
      // Success: Immediately fetch the updated list of requests
      fetchRequests();
    } catch (err) {
      console.error(`Error ${action}ing request:`, err);
      // Set error state based on API response or default message
      setError(err.response?.data?.message || `Failed to ${action} request.`);
    } finally {
      setActionLoading(null); // Clear loading state for the button
    }
  };

  // --- Render Logic ---
  // Show loading message only during the very initial load
  if (loading && !pendingRequests.length && !activeSessions.length) {
    return <p style={{ color: "#FFF" }}>Loading requests...</p>;
  }

  // Show error message if fetch failed and there's no data to display
  if (error && !pendingRequests.length && !activeSessions.length) {
    return (
      <p className="error-message" style={{ color: "#FFF" }}>
        {error}
      </p>
    );
  }

  return (
    <>
      {/* 1. Active Sessions Card */}
      <div className="glass-card">
        <h3 style={{ marginTop: 0, color: "#111" }}>Active Sessions</h3>
        {activeSessions.length === 0 ? (
          <p style={{ color: "#555" }}>No active sessions.</p>
        ) : (
          <div className="requests-list">
            {activeSessions.map((req) => (
              <div key={req.id} className="request-item">
                <div className="request-details">
                  {/* Safely access doctor info */}
                  <strong>
                    Dr. {req.Doctor?.fullName || "Unknown Doctor"}
                  </strong>
                  <span>{req.Doctor?.specialization || "N/A"}</span>
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
                    onClick={() =>
                      openConfirmation(
                        req.id,
                        "end",
                        "Confirm End Session",
                        "Are you sure you want to end this session now?"
                      )
                    }
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
        <h3 style={{ marginTop: 0, color: "#111" }}>Pending Access Requests</h3>
        {/* Display overall error here if polling fails after initial load */}
        {error && (pendingRequests.length > 0 || activeSessions.length > 0) && (
          <p
            className="error-message"
            style={{ color: "#111", marginBottom: "1rem" }}
          >
            {error}
          </p>
        )}
        {pendingRequests.length === 0 ? (
          <p style={{ color: "#555" }}>No pending access requests.</p>
        ) : (
          <div className="requests-list">
            {pendingRequests.map((req) => (
              <div key={req.id} className="request-item">
                <div className="request-details">
                  {/* Safely access doctor info */}
                  <strong>
                    Dr. {req.Doctor?.fullName || "Unknown Doctor"}
                  </strong>
                  <span>{req.Doctor?.specialization || "N/A"}</span>
                  <span className="notes">
                    Notes: "{req.notes || "No notes provided."}"
                  </span>
                </div>
                <div className="request-actions">
                  {/* Button to reject request */}
                  <button
                    className="action-button reject"
                    // Open confirmation modal on click
                    onClick={() =>
                      openConfirmation(
                        req.id,
                        "reject",
                        "Confirm Rejection",
                        "Are you sure you want to REJECT this access request?"
                      )
                    }
                    disabled={actionLoading === req.id} // Disable button while action is loading
                  >
                    {actionLoading === req.id ? "..." : "Reject"}
                  </button>
                  {/* Button to approve request */}
                  <button
                    className="action-button approve"
                    // Open confirmation modal on click
                    onClick={() =>
                      openConfirmation(
                        req.id,
                        "approve",
                        "Confirm Approval",
                        "Are you sure you want to APPROVE access for 30 minutes?"
                      )
                    }
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
