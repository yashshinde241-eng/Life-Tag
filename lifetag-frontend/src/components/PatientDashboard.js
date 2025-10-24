import React from 'react';
import WelcomeHeader from './WelcomeHeader';
import './Home.css';

const PatientDashboard = () => {
  return (
    <div className="home-container">
      <WelcomeHeader />
      
      {/* We can add shortcut cards here later */}
      <div className="shortcut-grid">
        {/* Example:
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
        */}
      </div>
    </div>
  );
};

export default PatientDashboard;