import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api';
import { useAuth } from './context/AuthContext'; // 1. Import the useAuth hook

const Login = () => {
  const [role, setRole] = useState('patient');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth(); // 2. Get the login function from our context

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
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

      // 3. Extract data from the successful response
      const { token, patientId, doctorId } = response.data;
      
      // Determine the ID based on the role
      const id = role === 'patient' ? patientId : doctorId;

      // 4. Call our global login function!
      login(token, roleToSend, id);
      
      setLoading(false);
      
      // 5. Redirect to the (currently empty) dashboard
      navigate('/dashboard');

    } catch (err) {
      console.error('Login error:', err.response);
      setLoading(false);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="glass-card">
      <h2>Login to Your Account</h2>

      <div className="form-toggle">
        <button
          className={`toggle-button ${role === 'patient' ? 'active' : ''}`}
          onClick={() => setRole('patient')}
        >
          I am a Patient
        </button>
        <button
          className={`toggle-button ${role === 'doctor' ? 'active' : ''}`}
          onClick={() => setRole('doctor')}
        >
          I am a Doctor
        </button>
      </div>

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
  );
};

export default Login;