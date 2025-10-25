// src/components/ShortcutCard.js
import React from 'react';
import { Link } from 'react-router-dom';
import './ShortcutCard.css';

const ShortcutCard = ({ to, icon, title }) => {
  return (
    <Link to={to} className="shortcut-card">
      <div className="shortcut-icon">{icon}</div>
      <div className="shortcut-title">{title}</div>
    </Link>
  );
};

export default ShortcutCard;