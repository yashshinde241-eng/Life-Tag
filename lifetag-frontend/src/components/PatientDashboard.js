import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import PatientProfile from './PatientProfile'; // 1. Import our new component
import './Dashboard.css'; // 2. Import the dashboard styles
import PatientRecords from './PatientRecords'; 
import PatientRequests from './PatientRequests'; 

const PatientDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      {/* 3. Dashboard Header with Logout */}
      <div className="dashboard-header glass-card">
        <h2>Patient Dashboard</h2>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      {/* 4. Dashboard Layout */}
      <div className="dashboard-layout">
        <aside className="profile-column">
          {/* The Profile Card goes here */}
          <PatientProfile /> 
        </aside>

        <main className="main-column">
          {/* Other cards will go here in the next steps */}
          <PatientRecords />
          <PatientRequests />
        </main>
      </div>
    </div>
  );
};

export default PatientDashboard;