import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!auth) return null; // Shouldn't happen, but good safeguard

  return (
    <nav className="floating-navbar">
      <NavLink to="/dashboard" className="nav-button">
        <span className="nav-icon">🏠</span>
        <span className="nav-text">Home</span>
      </NavLink>

      <NavLink to="/profile" className="nav-button">
        <span className="nav-icon">👤</span>
        <span className="nav-text">Profile</span>
      </NavLink>

      {/* --- PATIENT LINKS --- */}
      {auth.role === 'patient' && (
        <>
          <NavLink to="/my-records" className="nav-button">
            <span className="nav-icon">🩺</span>
            <span className="nav-text">My Records</span>
          </NavLink>
          <NavLink to="/my-requests" className="nav-button">
            <span className="nav-icon">🔔</span>
            <span className="nav-text">My Requests</span>
          </NavLink>
        </>
      )}

      {/* --- DOCTOR LINKS --- */}
      {auth.role === 'doctor' && (
        <>
          <NavLink to="/request-access" className="nav-button">
            <span className="nav-icon">🔑</span>
            <span className="nav-text">Request</span>
          </NavLink>
          <NavLink to="/sent-requests" className="nav-button">
            <span className="nav-icon">📤</span>
            <span className="nav-text">Sent</span>
          </NavLink>
          <NavLink to="/view-records" className="nav-button">
            <span className="nav-icon">👀</span>
            <span className="nav-text">View</span>
          </NavLink>
          <NavLink to="/upload-record" className="nav-button">
            <span className="nav-icon">☁️</span>
            <span className="nav-text">Upload</span>
          </NavLink>
        </>
      )}

      <NavLink to="/settings" className="nav-button">
        <span className="nav-icon">⚙️</span>
        <span className="nav-text">Settings</span>
      </NavLink>

      <button onClick={handleLogout} className="nav-button logout">
        <span className="nav-icon">🚪</span>
        <span className="nav-text">Logout</span>
      </button>
    </nav>
  );
};

export default Navbar;