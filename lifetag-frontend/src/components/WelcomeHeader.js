import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { useAuth } from './context/AuthContext';
import './Home.css';

const WelcomeHeader = () => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const { auth } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth) return;

      const url = auth.role === 'patient' ? '/users/profile' : '/doctors/profile';
      const dataKey = auth.role === 'patient' ? 'patient' : 'doctor';

      try {
        const response = await apiClient.get(url, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        setName(response.data[dataKey].fullName);
        setRole(auth.role);
      } catch (err) {
        console.error('Failed to fetch profile for header', err);
        setName('User');
        setRole(auth.role);
      }
    };

    fetchProfile();
  }, [auth]);

  return (
    <div className="welcome-header">
      <h2>Welcome, {name}</h2>
      <p>You are logged in as a {role}.</p>
    </div>
  );
};

export default WelcomeHeader;