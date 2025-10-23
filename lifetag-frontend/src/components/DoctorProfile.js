import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';

const DoctorProfile = () => {
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
        // 1. Make the API call to the DOCTOR'S profile route
        const response = await apiClient.get('/doctors/profile', {
          headers: {
            Authorization: `Bearer ${auth.token}`,
          },
        });
        
        // 2. Save the doctor data from the response
        setProfile(response.data.doctor);
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
    return null;
  }

  // 4. Display the profile data
  return (
    <div className="glass-card" style={{ textAlign: 'left' }}>
      <h3 style={{ textAlign: 'center', marginTop: 0 }}>My Profile</h3>
      <p><strong>Name:</strong> {profile.fullName}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      <p><strong>Specialization:</strong> {profile.specialization}</p>
      <p><strong>Hospital:</strong> {profile.hospital || 'N/A'}</p>
      <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
        <strong>Doctor ID:</strong> {profile.id}
      </p>
    </div>
  );
};

export default DoctorProfile;