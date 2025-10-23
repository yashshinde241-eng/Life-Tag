import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import our pages
import Welcome from './components/Welcome';
import Login from './components/Login';
import Register from './components/Register';

// 1. Import our new components
import ProtectedRoute from './components/ProtectedRoute';
import DashboardWrapper from './components/DashboardWrapper';

import './App.css';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* 2. Create the Protected Dashboard Route */}
        {/* This route is wrapped by ProtectedRoute */}
        <Route path="/dashboard" element={<ProtectedRoute />}>
          {/* If the user is logged in, it will render this child */}
          <Route index element={<DashboardWrapper />} />
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;