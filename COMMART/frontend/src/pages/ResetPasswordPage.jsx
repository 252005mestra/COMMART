import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react'; // Agregar estos imports
import logo from '../assets/LogoCOMMART.png';
import '../styles/modal.css';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Validaciones en tiempo real
  const validatePassword = (password) => {
    if (!password) return 'La contraseña es obligatoria.';
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (!/(?=.*[a-z])/.test(password)) return 'Debe contener al menos una letra minúscula.';
    if (!/(?=.*[A-Z])/.test(password)) return 'Debe contener al menos una letra mayúscula.';
    if (!/(?=.*\d)/.test(password)) return 'Debe contener al menos un número.';
    if (!/(?=.*[\W_])/.test(password)) return 'Debe contener al menos un carácter especial.';
    return null;
  };

  const handleNewPasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    
    const passwordError = validatePassword(value);
    setFieldErrors(prev => ({
      ...prev,
      newPassword: passwordError
    }));
    
    // Revalidar confirmación si existe
    if (confirmPassword && value !== confirmPassword) {
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: 'Las contraseñas no coinciden.'
      }));
    } else if (confirmPassword && value === confirmPassword) {
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: null
      }));
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    if (!value) {
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: 'Confirma tu contraseña.'
      }));
    } else if (value !== newPassword) {
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: 'Las contraseñas no coinciden.'
      }));
    } else {
      setFieldErrors(prev => ({
        ...prev,
        confirmPassword: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar antes de enviar
    const newPasswordError = validatePassword(newPassword);
    const confirmError = !confirmPassword ? 'Confirma tu contraseña.' 
                         : confirmPassword !== newPassword ? 'Las contraseñas no coinciden.' 
                         : null;
    
    setFieldErrors({
      newPassword: newPasswordError,
      confirmPassword: confirmError
    });
    
    if (newPasswordError || confirmError) {
      return;
    }
    
    setLoading(true);
    setError('');
    setMsg('');
    
    try {
      await axios.post('http://localhost:5000/api/auth/reset-password', {
        token,
        newPassword
      });
      
      setMsg('Contraseña restablecida exitosamente. Serás redirigido al inicio.');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-content">
      <section className="reset-password-section">
        <div className="modal-overlay">
          <div className="modal-content">
            <img src={logo} alt="Logo COMMART" />
            <h2>Cambiar Contraseña</h2>
            <p className="forgot-description">Cambia tu contraseña para recuperar el acceso a tu cuenta.</p>
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="password-input-container">
                <input
                  type={showNew ? 'text' : 'password'}
                  className={`${fieldErrors.newPassword ? 'input-error' : ''}`}
                  placeholder="Contraseña nueva"
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNew(v => !v)}
                  tabIndex={-1}
                  disabled={loading}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.newPassword && (
                <span className="input-error-message">{fieldErrors.newPassword}</span>
              )}
              
              <div className="password-input-container">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  className={`${fieldErrors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirm(v => !v)}
                  tabIndex={-1}
                  disabled={loading}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="input-error-message">{fieldErrors.confirmPassword}</span>
              )}
              
              <button type="submit" disabled={loading}>
                {loading ? <span className="spinner" /> : null}
                Cambiar
              </button>
            </form>
            {msg && <p className="success-message">{msg}</p>}
            {error && <p className="error-message">{error}</p>}
          </div>
        </div>
      </section>
    </main>
  );
};

export default ResetPasswordPage;