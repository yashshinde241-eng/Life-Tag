import React from 'react';
import WelcomeHeader from './WelcomeHeader';
import './Home.css';

const DoctorDashboard = () => {
  return (
    <div className="home-container">
      <WelcomeHeader />
      
      {/* We can add shortcut cards here later */}
      <div className="shortcut-grid">
        {/* Example:
        <ShortcutCard 
          title="Request Access" 
          icon="🔑" 
          to="/request-access" 
        />
        <ShortcutCard 
          title="Sent Requests" 
          icon="📤" 
          to="/sent-requests" 
        />
        <ShortcutCard 
          title="Upload Record" 
          icon="☁️" 
          to="/upload-record" 
        />
        */}
      </div>
    </div>
  );
};

export default DoctorDashboard;