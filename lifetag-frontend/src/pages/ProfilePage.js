import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/context/AuthContext';
import apiClient from '../api';
import './PageWrapper.css';

// We have combined all the logic into this one file.

const ProfilePage = () => {
  const { auth } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return; // Wait for auth to be ready

    // Determine which API endpoint and data key to use
    const url = auth.role === 'patient' ? '/users/profile' : '/doctors/profile';
    const dataKey = auth.role === 'patient' ? 'patient' : 'doctor';

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get(url, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        setProfile(response.data[dataKey]);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.message || 'Failed to fetch profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [auth]); // Run when auth state is available

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="glass-card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper">
        <div className="glass-card">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null; // Should not happen if loading/error are handled
  }

  // Render the correct profile based on role
  return (
    <div className="page-wrapper center-content">
      <div className="glass-card" style={{ textAlign: 'left', maxWidth: '420px' }}>
        <h3 style={{ textAlign: 'center', marginTop: 0 }}>My Profile</h3>
        
        {/* Common fields */}
        <p><strong>Name:</strong> {profile.fullName}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        
        {/* Patient-specific fields */}
        {auth.role === 'patient' && (
          <>
            <p><strong>Age:</strong> {profile.age || 'N/A'}</p>
            <p><strong>Gender:</strong> {profile.gender || 'N/A'}</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              <strong>Patient ID:</strong> {profile.id}
            </p>
          </>
        )}
        
        {/* Doctor-specific fields */}
        {auth.role === 'doctor' && (
          <>
            <p><strong>Specialization:</strong> {profile.specialization}</p>
            <p><strong>Hospital:</strong> {profile.hospital || 'N/A'}</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              <strong>Doctor ID:</strong> {profile.id}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;