// src/components/ConfirmationModal.js
import React from 'react';
import ReactDOM from 'react-dom'; // Make sure ReactDOM is imported
import './ConfirmationModal.css';

const ConfirmationModal = ({ title, message, isOpen, onClose, onConfirm }) => {
  if (!isOpen) {
    return null;
  }

  // --- Use createPortal with the correct target ---
  return ReactDOM.createPortal(
    // This is the blurry background
    <div className="confirm-modal-backdrop" onClick={onClose}>
      
      {/* This is the "small card" */}
      <div 
        className="confirm-modal-content glass-card" 
        onClick={(e) => e.stopPropagation()} // Prevents clicks inside modal from closing it
      >
        <div className="confirm-modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="confirm-modal-close-button">&times;</button>
        </div>
        
        <div className="confirm-modal-body">
          <p>{message}</p>
        </div>
        
        <div className="confirm-modal-footer">
          <button onClick={onClose} className="confirm-modal-button cancel">
            Cancel
          </button>
          <button onClick={onConfirm} className="confirm-modal-button confirm">
            Confirm
          </button>
        </div>
      </div>
    </div>,
    // Target the specific div we created in public/index.html
    document.getElementById('modal-root') 
  );
  // --- End Portal ---
};

export default ConfirmationModal;