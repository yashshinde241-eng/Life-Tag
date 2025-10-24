import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import DoctorProfile from './DoctorProfile'; // 1. Import our new component
import './Dashboard.css'; // 2. REUSE the same dashboard styles
import RequestAccess from './RequestAccess'; 
import DoctorRequests from './DoctorRequests'; 
import UploadRecord from './UploadRecord'; 
import DoctorViewPatientRecords from './DoctorViewPatientRecords';

const DoctorDashboard = () => {
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
        <h2>Doctor Dashboard</h2>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      {/* 4. Dashboard Layout */}
      <div className="dashboard-layout">
        <aside className="profile-column">
          {/* The Profile Card goes here */}
          <DoctorProfile />
        </aside>

        <main className="main-column" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Other cards will go here in the next steps */}
          <RequestAccess />
          <DoctorRequests />
          <DoctorViewPatientRecords />
          <UploadRecord />
        </main>
      </div>
    </div>
  );
};

export default DoctorDashboard;