import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

// This component is the "shell" for all logged-in pages
const LayoutWithNavbar = () => {
  return (
    <>
      <Navbar />
      
      {/* The <Outlet /> is where React Router will render 
          the current page (e.g., DashboardWrapper or Profile) */}
      <Outlet />
    </>
  );
};

export default LayoutWithNavbar;