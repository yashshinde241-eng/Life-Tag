// src/pages/PatientUploadPage.js
import React from 'react';
import PatientUploadForm from '../components/PatientUploadForm';
import './PageWrapper.css';

const PatientUploadPage = () => (
  // Use page-wrapper and center-content classes
  <div className="page-wrapper center-content"> 
    <PatientUploadForm />
  </div>
);

export default PatientUploadPage;