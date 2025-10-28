import React from 'react';
import PatientRequests from '../components/PatientRequests';
import './PageWrapper.css';

const PatientRequestsPage = () => (
  <div className="page-wrapper" style={{gap: '2rem'}}>
    <PatientRequests />
  </div>
);

export default PatientRequestsPage;