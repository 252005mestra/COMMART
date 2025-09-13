import React, { useEffect } from 'react';
import '../styles/alertmodal.css';

const icons = {
  success: (
    <svg width="90" height="90" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#16b86a" strokeWidth="4"/>
      <polyline points="30,55 46,70 70,38" fill="none" stroke="#16b86a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="90" height="90" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="none" stroke="#e74c3c" strokeWidth="4"/>
      <line x1="35" y1="35" x2="65" y2="65" stroke="#e74c3c" strokeWidth="5" strokeLinecap="round"/>
      <line x1="65" y1="35" x2="35" y2="65" stroke="#e74c3c" strokeWidth="5" strokeLinecap="round"/>
    </svg>
  )
};

const AlertModal = ({ open, type = 'success', message, onClose, duration = 2500 }) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, onClose, duration]);

  if (!open) return null;

  return (
    <div className="alert-modal-overlay">
      <div className="alert-modal">
        <div className="alert-modal-icon">{icons[type]}</div>
        <div className="alert-modal-message">{message}</div>
      </div>
    </div>
  );
};

export default AlertModal;