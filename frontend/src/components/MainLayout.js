// src/components/MainLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './MainLayout.css';

const MainLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="content-area">
        <Outlet /> {/* This is where our pages will render */}
      </main>
    </div>
  );
};

export default MainLayout;