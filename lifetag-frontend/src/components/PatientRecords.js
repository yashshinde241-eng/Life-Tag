import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';
import './PatientRecords.css'; // We will create this file

const PatientRecords = () => {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { auth } = useAuth();

  useEffect(() => {
    const fetchRecords = async () => {
      if (!auth?.token) {
        setLoading(false);
        setError('No authentication token found.');
        return;
      }

      try {
        // 1. Make the API call
        const response = await apiClient.get('/records/patient', {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
        
        // 2. Save the list of records
        setRecords(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching records:', err);
        setError(err.response?.data?.message || 'Failed to fetch records.');
        setLoading(false);
      }
    };

    fetchRecords();
  }, [auth]); // Re-run if auth state changes

  // 3. Render loading state
  if (loading) {
    return (
      <div className="glass-card">
        <h3>My Medical Records</h3>
        <p>Loading records...</p>
      </div>
    );
  }

  // 4. Render error state
  if (error) {
    return (
      <div className="glass-card">
        <h3>My Medical Records</h3>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  // 5. Render the list of records
  return (
    <div className="glass-card">
      <h3 style={{ marginTop: 0 }}>My Medical Records</h3>
      
      {/* Check if the list is empty */}
      {records.length === 0 ? (
        <p>No medical records found.</p>
      ) : (
        <div className="records-list">
          {records.map((record) => (
            <div key={record.id} className="record-item">
              <div className="record-icon">📄</div>
              <div className="record-details">
                <strong>{record.fileName}</strong>
                <span>Type: {record.recordType || 'N/A'}</span>
                <span>Uploaded by: {record.doctor.fullName}</span>
              </div>
              <div className="record-date">
                {new Date(record.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientRecords;