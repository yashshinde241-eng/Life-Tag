// src/components/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import Loader from '../Loader';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null); // Will hold { token, role, id, patientTagId }
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const storedAuth = localStorage.getItem('lifetag-auth');
    if (storedAuth) {
      try {
        setAuth(JSON.parse(storedAuth));
      } catch (e) {
        console.error("Failed to parse stored auth:", e);
        localStorage.removeItem('lifetag-auth'); // Clear corrupted data
      }
    }
    // Mark auth load attempt complete
    setLoading(false);
  }, []);

  // --- MODIFIED LOGIN FUNCTION ---
  // Accepts patientTagId (or doctorId)
  const login = (token, role, id, tagId) => { // Added tagId
    const authData = { token, role, id, tagId }; // Store tagId
    setAuth(authData);
    localStorage.setItem('lifetag-auth', JSON.stringify(authData));
  };
  // --- END MODIFICATION ---

  // Start logout flow and wait for Loader to call finalizeLogout via onComplete
  const logout = () => {
    setLoggingOut(true);
  };

  const finalizeLogout = () => {
    setAuth(null);
    localStorage.removeItem('lifetag-auth');
    setLoggingOut(false);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, loading, loggingOut }}>
      {children}
  {loggingOut && <Loader text="Logging out..." minDisplayTime={1200} onComplete={finalizeLogout} />}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};