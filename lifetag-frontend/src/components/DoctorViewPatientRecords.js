import React, { useState } from 'react';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';
// We can reuse the patient's record styles!
import './PatientRecords.css'; 

const DoctorViewPatientRecords = () => {
  const [patientId, setPatientId] = useState('');
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // To show "no records" msg
  const { auth } = useAuth();

  const handleViewRecords = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRecords([]); // Clear previous records
    setHasSearched(false);

    if (!patientId) {
      setError('Patient ID is required.');
      setLoading(false);
      return;
    }

    try {
      // 1. Check for access first
      const checkResponse = await apiClient.get(
        `/access/check/${auth.id}/${patientId}`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        }
      );

      if (checkResponse.data.hasAccess) {
        // 2. If access is true, fetch the records
        const recordsResponse = await apiClient.get(
          `/records/patient/${patientId}`, {
            headers: { Authorization: `Bearer ${auth.token}` },
          }
        );
        
        setRecords(recordsResponse.data);
        setHasSearched(true); // We've completed a search
      } else {
        // 3. No access
        setError('Access is not active or has expired for this patient.');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error viewing records:', err);
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to check access or get records.');
    }
  };

  return (
    <div className="glass-card" style={{ textAlign: 'left' }}>
      <h3 style={{ textAlign: 'center', marginTop: 0 }}>View Patient Records</h3>
      
      {/* 4. The Form */}
      <form onSubmit={handleViewRecords}>
        <label>Patient ID</label>
        <input
          type="number"
          name="patientId"
          placeholder="Enter Patient ID to view records"
          className="modern-input"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          required
        />
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Checking Access...' : 'View Records'}
        </button>
      </form>

      {/* 5. The Read-Only Records List */}
      <div className="records-list" style={{ marginTop: '2rem' }}>
        {records.length > 0 ? (
          records.map((record) => (
            // We use the exact same styles as the patient dashboard
            <div key={record.id} className="record-item">
              <div className="record-icon">📄</div>
              <div className="record-details">
                <strong>{record.fileName}</strong>
                <span>Type: {record.recordType || 'N/A'}</span>
                {/* Note: The API doesn't seem to return the doctor
                    when another doctor requests it, so we'll be safe. */}
                <span>Uploaded by: Dr. {record.doctor?.fullName || 'Unknown'}</span>
              </div>
              <div className="record-date">
                {new Date(record.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        ) : (
          // Only show this *after* a search
          hasSearched && <p style={{textAlign: 'center'}}>No records found for this patient.</p>
        )}
      </div>
    </div>
  );
};

export default DoctorViewPatientRecords;