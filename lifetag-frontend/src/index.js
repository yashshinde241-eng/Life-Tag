import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppWrapper from './App'; // <-- Import AppWrapper instead of App

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppWrapper /> {/* <-- Render AppWrapper */}
  </React.StrictMode>
);