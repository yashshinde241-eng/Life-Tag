import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';

const PatientProfile = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { auth } = useAuth(); // Get auth state to send the token

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth?.token) {
        setLoading(false);
        setError('No authentication token found.');
        return;
      }

      try {
        // 1. Make the API call with the auth token in the header
        const response = await apiClient.get('/users/profile', {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
        
        // 2. Save the patient data from the response
        setProfile(response.data.patient);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.message || 'Failed to fetch profile.');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [auth]); // Re-run if auth state changes

  // 3. Show different UI based on the state
  if (loading) {
    return (
      <div className="glass-card">
        <h3>My Profile</h3>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card">
        <h3>My Profile</h3>
        <p className="error-message">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return null; // Should not happen if loading/error are handled
  }

  // 4. Display the profile data
  return (
    <div className="glass-card" style={{ textAlign: 'left' }}>
      <h3 style={{ textAlign: 'center', marginTop: 0 }}>My Profile</h3>
      <p><strong>Name:</strong> {profile.fullName}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Age:</strong> {profile.age || 'N/A'}</p>
      <p><strong>Gender:</strong> {profile.gender || 'N/A'}</p>
      <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
        <strong>Patient ID:</strong> {profile.id}
      </p>
    </div>
  );
};

export default PatientProfile;