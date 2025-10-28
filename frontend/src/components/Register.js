// src/components/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api';

const Register = () => {
  const [role, setRole] = useState('patient');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    age: '',
    gender: '',
    specialization: '',
    hospital: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    let data = {};
    if (role === 'patient') {
      url = '/users/register';
      data = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        age: formData.age || undefined,
        gender: formData.gender || undefined,
      };
    } else {
      url = '/doctors/register';
      data = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        specialization: formData.specialization,
        hospital: formData.hospital || undefined,
      };
    }
    try {
      const response = await apiClient.post(url, data);
      console.log('Registration successful:', response.data);
      setLoading(false);
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err.response);
      setLoading(false);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="glass-card dark">
      <h2>Create Your Account</h2>

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
        <label>Full Name</label>
        <input
          type="text"
          name="fullName"
          placeholder="John Doe"
          className="modern-input"
          onChange={handleChange}
          required
        />
        
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
          placeholder="Min. 6 characters"
          className="modern-input"
          onChange={handleChange}
          required
        />

        {role === 'patient' && (
          <>
            <label>Age (Optional)</label>
            <input
              type="number"
              name="age"
              placeholder="30"
              className="modern-input"
              onChange={handleChange}
            />
            
            <label>Gender (Optional)</label>
            <input
              type="text"
              name="gender"
              placeholder="Male / Female / Other"
              className="modern-input"
              onChange={handleChange}
            />
          </>
        )}

        {role === 'doctor' && (
          <>
            <label>Specialization</label>
            <input
              type="text"
              name="specialization"
              placeholder="Cardiology"
              className="modern-input"
              onChange={handleChange}
              required
            />
            
            <label>Hospital (Optional)</label>
            <input
              type="text"
              name="hospital"
              placeholder="City Hospital"
              className="modern-input"
              onChange={handleChange}
            />
          </>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default Register;