import React from 'react';
import DoctorViewPatientRecords from '../components/DoctorViewPatientRecords';
import './PageWrapper.css';

const DoctorViewRecordsPage = () => (
  <div className="page-wrapper center-content">
    <DoctorViewPatientRecords />
  </div>
);

export default DoctorViewRecordsPage;