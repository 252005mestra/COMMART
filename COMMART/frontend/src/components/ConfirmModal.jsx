import React from 'react';
import '../styles/confirmmodal.css';

const ConfirmModal = ({
  open,
  message,
  onCancel,
  onConfirm,
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  loading = false,
}) => {
  if (!open) return null;
  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal-content">
        <div className="confirm-modal-message">
          <span style={{ fontSize: '1.15rem' }}>{message}</span>
        </div>
        <div className="confirm-modal-actions">
          <button className="confirm-modal-cancel-btn" onClick={onCancel} disabled={loading}>
            {cancelText}
          </button>
          <button className="confirm-modal-confirm-btn" onClick={onConfirm} disabled={loading}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;