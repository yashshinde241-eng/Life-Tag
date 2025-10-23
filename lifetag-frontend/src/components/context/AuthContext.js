import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Create the Context
const AuthContext = createContext();

// 2. Create the Provider Component
// This component will wrap our entire app and provide the auth state
export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null); // Will hold { token, role, id }

  // This useEffect will run once when the app loads
  // It checks if we already have auth data saved in localStorage
  useEffect(() => {
    const storedAuth = localStorage.getItem('lifetag-auth');
    if (storedAuth) {
      setAuth(JSON.parse(storedAuth));
    }
  }, []);

  // Function to log the user in
  const login = (token, role, id) => {
    const authData = { token, role, id };
    setAuth(authData);
    // Save to localStorage so it persists after a page refresh
    localStorage.setItem('lifetag-auth', JSON.stringify(authData));
  };

  // Function to log the user out
  const logout = () => {
    setAuth(null);
    localStorage.removeItem('lifetag-auth');
  };

  // The value 'prop' is what we pass down to all components
  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Create a "hook" to easily use the context
// This lets any component get the auth state by just calling useAuth()
export const useAuth = () => {
  return useContext(AuthContext);
};