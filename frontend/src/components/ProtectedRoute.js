import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = () => {
  const { auth } = useAuth(); // Get auth state from context

  // Check if the user is authenticated
  if (!auth) {
    // If not, redirect them to the /login page
    return <Navigate to="/login" replace />;
  }

  // If they are logged in, show the child components
  // (which will be our new DashboardWrapper)
  return <Outlet />;
};

export default ProtectedRoute;