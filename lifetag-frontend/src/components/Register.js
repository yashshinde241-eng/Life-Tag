import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api'; // Import our new api helper

const Register = () => {
  // 'patient' or 'doctor'
  const [role, setRole] = useState('patient'); 
  
  // This state will hold all the form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    age: '',
    gender: '',
    specialization: '',
    hospital: '',
  });

  // States for loading and error messages
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // This hook lets us redirect the user after they register
  const navigate = useNavigate();

  // This function updates the formData state when you type
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // This function runs when you click the "Register" button
  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop the page from reloading
    setLoading(true);
    setError(null);

    let url = '';
    let data = {};

    // 1. Prepare the data based on the selected role
    if (role === 'patient') {
      url = '/users/register';
      data = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        age: formData.age || undefined, // Send 'undefined' if empty
        gender: formData.gender || undefined,
      };
    } else { // role === 'doctor'
      url = '/doctors/register';
      data = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        specialization: formData.specialization,
        hospital: formData.hospital || undefined,
      };
    }

    // 2. Try to send the data to the backend
    try {
      const response = await apiClient.post(url, data);
      
      // If it works:
      console.log('Registration successful:', response.data);
      setLoading(false);
      // Redirect to the login page
      navigate('/login'); 
      
    } catch (err) {
      // If it fails:
      console.error('Registration error:', err.response);
      setLoading(false);
      // Set the error message from the backend
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="glass-card">
      <h2>Create Your Account</h2>

      {/* 3. The Toggle Buttons */}
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

      {/* 4. The Registration Form */}
      <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
        
        {/* Fields for EVERYONE */}
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

        {/* 5. Conditional Fields for PATIENT */}
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

        {/* 6. Conditional Fields for DOCTOR */}
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

        {/* 7. Error Message Display */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* 8. Submit Button */}
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