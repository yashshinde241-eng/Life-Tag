import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './components/context/AuthContext'; // 1. Import our provider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider> {/* 2. Wrap the App */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);