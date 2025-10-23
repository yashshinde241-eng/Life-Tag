import React from 'react';
import { Link } from 'react-router-dom';
import './Welcome.css'; // We'll create this file next

const Welcome = () => {
  return (
    <div className="glass-card welcome-card">
      <h1>Welcome to LifeTag</h1>
      <p>Your secure, decentralized health record system.</p>
      <div className="welcome-buttons">
        <Link to="/login" className="primary-button">
          Login
        </Link>
        <Link to="/register" className="primary-button secondary">
          Register
        </Link>
      </div>
    </div>
  );
};

export default Welcome;