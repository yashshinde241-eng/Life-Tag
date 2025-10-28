// src/components/DashboardWrapper.js
import React from 'react';
import { useAuth } from './context/AuthContext';
import PatientDashboard from './PatientDashboard';
import DoctorDashboard from './DoctorDashboard';

const DashboardWrapper = () => {
  const { auth } = useAuth();

  // This should never really happen if ProtectedRoute works
  if (!auth) {
    return null; 
  }

  // Read the 'role' from our auth context
  if (auth.role === 'patient') {
    return <PatientDashboard />;
  } else if (auth.role === 'doctor') {
    return <DoctorDashboard />;
  }

  // Fallback in case role is somehow missing
  return <div>Unknown role. Please log out and try again.</div>;
};

export default DashboardWrapper;