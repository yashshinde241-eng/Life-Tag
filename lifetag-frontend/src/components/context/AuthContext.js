// src/components/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null); // Will hold { token, role, id, patientTagId }

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
  }, []);

  // --- MODIFIED LOGIN FUNCTION ---
  // Accepts patientTagId (or doctorId)
  const login = (token, role, id, tagId) => { // Added tagId
    const authData = { token, role, id, tagId }; // Store tagId
    setAuth(authData);
    localStorage.setItem('lifetag-auth', JSON.stringify(authData));
  };
  // --- END MODIFICATION ---

  const logout = () => {
    setAuth(null);
    localStorage.removeItem('lifetag-auth');
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};