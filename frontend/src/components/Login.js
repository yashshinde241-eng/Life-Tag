// src/components/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';
import Loader from './Loader';

const Login = () => {
  const [role, setRole] = useState('patient');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleRoleChange = (newRole) => {
    setRole(newRole);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    let url = '';
    let roleToSend = '';
    if (role === 'patient') {
      url = '/users/login';
      roleToSend = 'patient';
    } else {
      url = '/doctors/login';
      roleToSend = 'doctor';
    }
    try {
      const response = await apiClient.post(url, formData);

      // --- MODIFIED DATA EXTRACTION ---
      const { token, patientId, doctorId, patientTagId } = response.data; // Get patientTagId
      // Determine the internal ID based on the role
      const internalId = role === 'patient' ? patientId : doctorId;
      // Determine the tag ID (only patients have it for now)
      const tagId = role === 'patient' ? patientTagId : null; 
      // --- END MODIFICATION ---

  // --- MODIFIED LOGIN CALL ---
  // Pass internalId and tagId to the context login function
  login(token, roleToSend, internalId, tagId);
  // --- END MODIFICATION ---

  // Keep the loader visible and delay navigation until the Loader
  // calls onComplete. Set the desired redirect path here.
  setRedirectPath('/dashboard');
    } catch (err) {
      console.error('Login error:', err.response);
      setLoading(false);
      setError(err.response?.data?.message || 'Login failed.');
    }
  };

  return (
    <>
      {loading && (
        <Loader
          text="Signing in..."
          minDisplayTime={1200}
          onComplete={() => {
            setLoading(false);
            // navigate to the saved redirect path (fallback to /dashboard)
            navigate(redirectPath || '/dashboard');
            setRedirectPath(null);
          }}
        />
      )}
      <div className="glass-card dark">
        <h2>Login to Your Account</h2>

      {/* --- NEW CORRECTED HTML --- */}
      <div 
        className={`form-toggle ${role === 'doctor' ? 'doctor-active' : ''}`}
      >
        {/* Layer 1: White Text (Background) */}
        <div className="toggle-text-layer background-text">
          <span>Patient</span>
          <span>Doctor</span>
        </div>

        {/* Layer 2: Sliding Pill (Mask) */}
        <div className="sliding-pill">
          {/* Layer 3: White/Bold Text (Foreground) */}
          <div className="toggle-text-layer foreground-text">
            <span>Patient</span>
            <span>Doctor</span>
          </div>
        </div>

        {/* Layer 4: Click Handlers */}
        <div className="toggle-clickable-layer">
           <div onClick={() => handleRoleChange('patient')}></div>
           <div onClick={() => handleRoleChange('doctor')}></div>
        </div>
      </div>
      {/* --- END NEW HTML --- */}

      <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
        <label>Email</label>
        <input
          type="email"
          name="email"
          placeholder="john@example.com"
          className="modern-input"
          onChange={handleChange}
          required
        />
        
        <label>Password</label>
        <input
          type="password"
          name="password"
          placeholder="Your password"
          className="modern-input"
          onChange={handleChange}
          required
        />

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
    </>
  );
};

export default Login;