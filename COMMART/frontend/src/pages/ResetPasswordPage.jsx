import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/LogoCOMMART.png';
import '../styles/resetpassword.css';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const containsXSSChars = (input) => /[<>"'&/]/.test(input);

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Validación en tiempo real
  const validateFields = (field, value) => {
    let errors = { ...fieldErrors };
    if (field === 'newPassword') {
      if (!value) errors.newPassword = 'La contraseña es obligatoria.';
      else if (/\s/.test(value)) errors.newPassword = 'La contraseña no puede contener espacios.';
      else if (containsXSSChars(value)) errors.newPassword = 'La contraseña contiene caracteres peligrosos.';
      else if (!passwordRegex.test(value)) errors.newPassword = 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial.';
      else delete errors.newPassword;
      // Validar confirmación si ya hay valor
      if (confirmPassword && value !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden.';
      else if (confirmPassword) delete errors.confirmPassword;
    }
    if (field === 'confirmPassword') {
      if (!value) errors.confirmPassword = 'Confirma tu contraseña.';
      else if (newPassword && value !== newPassword) errors.confirmPassword = 'Las contraseñas no coinciden.';
      else delete errors.confirmPassword;
    }
    setFieldErrors(errors);
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    validateFields('newPassword', e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    validateFields('confirmPassword', e.target.value);
  };

  // Validación final antes de enviar
  const validate = () => {
    if (!newPassword || !confirmPassword) return 'Completa ambos campos.';
    if (newPassword !== confirmPassword) return 'Las contraseñas no coinciden.';
    if (/\s/.test(newPassword)) return 'La contraseña no puede contener espacios.';
    if (containsXSSChars(newPassword)) return 'La contraseña contiene caracteres peligrosos.';
    if (!passwordRegex.test(newPassword)) return 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, {
        password: newPassword
      });
      setMsg('¡Contraseña cambiada exitosamente!');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <img src={logo} alt="COMMART" style={{ height: '3rem', marginBottom: '1rem' }} />
        <h2>Cambiar Contraseña</h2>
        <p>Cambia tu contraseña para recuperar el acceso a tu cuenta.</p>
        <form className="reset-password-form" onSubmit={handleSubmit}>
          <div className="reset-password-input-group">
            <input
              type={showNew ? 'text' : 'password'}
              className={`reset-password-input${fieldErrors.newPassword ? ' input-error' : ''}`}
              placeholder="Contraseña nueva"
              value={newPassword}
              onChange={handleNewPasswordChange}
              disabled={loading}
            />
            <button
              type="button"
              className="reset-password-toggle-btn"
              onClick={() => setShowNew(v => !v)}
              tabIndex={-1}
              disabled={loading}
            >
              {showNew ? '🙈' : '👁️'}
            </button>
            {fieldErrors.newPassword && (
              <span className="input-error-message">{fieldErrors.newPassword}</span>
            )}
          </div>
          <div className="reset-password-input-group">
            <input
              type={showConfirm ? 'text' : 'password'}
              className={`reset-password-input${fieldErrors.confirmPassword ? ' input-error' : ''}`}
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              disabled={loading}
            />
            <button
              type="button"
              className="reset-password-toggle-btn"
              onClick={() => setShowConfirm(v => !v)}
              tabIndex={-1}
              disabled={loading}
            >
              {showConfirm ? '🙈' : '👁️'}
            </button>
            {fieldErrors.confirmPassword && (
              <span className="input-error-message">{fieldErrors.confirmPassword}</span>
            )}
          </div>
          <button
            type="submit"
            className="reset-password-btn"
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : null}
            Cambiar
          </button>
        </form>
        {msg && <p style={{ color: '#78966a', marginTop: '1rem' }}>{msg}</p>}
        {error && <p style={{ color: '#e74c3c', marginTop: '1rem' }}>{error}</p>}
      </div>
    </div>
  );
};

export default ResetPassword;