// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/context/AuthContext';

// Import Layouts
import MainLayout from './components/MainLayout'; // Our new layout!
import ProtectedRoute from './components/ProtectedRoute';

// Import Public Pages
import Welcome from './components/Welcome';
import Login from './components/Login';
import Register from './components/Register';

// Import Core Protected Pages
import DashboardWrapper from './components/DashboardWrapper';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

// Import Patient Pages
import PatientRequestsPage from './pages/PatientRequestsPage';
import CloudRecordsPage from './pages/CloudRecordsPage';

// Import Doctor Pages
import DoctorRequestAccessPage from './pages/DoctorRequestAccessPage';
import DoctorSentRequestsPage from './pages/DoctorSentRequestsPage';
import DoctorUploadPage from './pages/DoctorUploadPage';
import DoctorViewRecordsPage from './pages/DoctorViewRecordsPage';

// Import CSS
import './App.css';
import './index.css';
import Loader from './components/Loader';

function App() {
  const { auth, loading } = useAuth(); // Get auth and loading to decide routes

  // Remove the static preloader once we finish initializing auth.
  useEffect(() => {
    if (!loading && typeof window !== 'undefined' && window.removePreloader) {
      window.removePreloader();
    }
  }, [loading]);

  if (loading) return <Loader />;

  // We wrap public routes in the centering class from index.css
  const publicRouteWrapper = (element) => (
    <div className="centered-page-wrapper">{element}</div>
  );

  return (
    <BrowserRouter>
      <Routes>
        {/* --- 1. PUBLIC ROUTES --- */}
        <Route path="/" element={publicRouteWrapper(<Welcome />)} />
        <Route path="/login" element={publicRouteWrapper(<Login />)} />
        <Route path="/register" element={publicRouteWrapper(<Register />)} />

        {/* --- 2. PROTECTED ROUTES --- */}
        <Route element={<ProtectedRoute />}>
          {/* All protected routes render inside MainLayout */}
          <Route element={<MainLayout />}>
            {/* Core Pages (both roles) */}
            <Route path="/dashboard" element={<DashboardWrapper />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Patient Routes */}
            {auth?.role === 'patient' && (
              <>
                <Route path="/cloud-records" element={<CloudRecordsPage />} />
                <Route path="/my-requests" element={<PatientRequestsPage />} />
              </>
            )}

            {/* Doctor Routes */}
            {auth?.role === 'doctor' && (
              <>
                <Route path="/request-access" element={<DoctorRequestAccessPage />} />
                <Route path="/sent-requests" element={<DoctorSentRequestsPage />} />
                <Route path="/upload-record" element={<DoctorUploadPage />} />
                <Route path="/view-records" element={<DoctorViewRecordsPage />} />
              </>
            )}
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

const AppWrapper = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWrapper;