// src/components/Sidebar.js
import React from 'react';
import { NavLink, useNavigate }from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!auth) return null; // Should never happen here, but good check

  return (
    <nav className="sidebar-container">
      <div className="sidebar-header">
        <span className="sidebar-logo">🩺</span>
        <h3>LifeTag</h3>
      </div>
      
      <div className="sidebar-links">
        <NavLink to="/dashboard" className="sidebar-button">
          <span className="nav-icon">🏠</span>
          <span className="nav-text">Home</span>
        </NavLink>

        <NavLink to="/profile" className="sidebar-button">
          <span className="nav-icon">👤</span>
          <span className="nav-text">Profile</span>
        </NavLink>

        {/* --- PATIENT LINKS --- */}
        {auth.role === 'patient' && (
          <>
            <NavLink to="/cloud-records" className="sidebar-button">
              <span className="nav-icon">☁️</span>
              <span className="nav-text">Cloud Records</span>
            </NavLink>
            <NavLink to="/my-requests" className="sidebar-button">
              <span className="nav-icon">🔔</span>
              <span className="nav-text">My Requests</span>
            </NavLink>
          </>
        )}

        {/* --- DOCTOR LINKS --- */}
        {auth.role === 'doctor' && (
          <>
            <NavLink to="/request-access" className="sidebar-button">
              <span className="nav-icon">🔑</span>
              <span className="nav-text">Request</span>
            </NavLink>
            <NavLink to="/sent-requests" className="sidebar-button">
              <span className="nav-icon">📤</span>
              <span className="nav-text">Sent</span>
            </NavLink>
            <NavLink to="/view-records" className="sidebar-button">
              <span className="nav-icon">👀</span>
              <span className="nav-text">View</span>
            </NavLink>
            <NavLink to="/upload-record" className="sidebar-button">
              <span className="nav-icon">☁️</span>
              <span className="nav-text">Upload</span>
            </NavLink>
          </>
        )}

        <NavLink to="/settings" className="sidebar-button">
          <span className="nav-icon">⚙️</span>
          <span className="nav-text">Settings</span>
        </NavLink>
      </div>
      
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-button logout">
          <span className="nav-icon">🚪</span>
          <span className="nav-text">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;