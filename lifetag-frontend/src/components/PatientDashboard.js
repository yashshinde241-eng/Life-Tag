// src/components/PatientDashboard.js
import React from 'react';
import WelcomeHeader from './WelcomeHeader';
import ShortcutCard from './ShortcutCard'; // Import
import './Home.css';

const PatientDashboard = () => {
  return (
    <div className="home-container">
      <WelcomeHeader />
      
      <div className="shortcut-grid-patient">
        <ShortcutCard 
          title="My Profile" 
          icon="👤" 
          to="/profile" 
        />
        <ShortcutCard 
          title="My Records" 
          icon="🩺" 
          to="/my-records" 
        />
        <ShortcutCard 
          title="My Requests" 
          icon="🔔" 
          to="/my-requests" 
        />
        <ShortcutCard 
          title="Settings" 
          icon="⚙️" 
          to="/settings" 
        />
      </div>
    </div>
  );
};

export default PatientDashboard;