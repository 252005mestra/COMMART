import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/loginModal.css';
import logo from "../assets/LogoCOMMART.png";

const LoginModal = ({ onClose, onSwitchToRegister }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Validación en tiempo real
  const validate = () => {
    const newErrors = {};
    if (!identifier) newErrors.identifier = 'El nombre de usuario o el correo es obligatorio.';
    if (!password) newErrors.password = 'La contraseña es obligatoria.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validar en cada cambio
  const handleChange = (setter, field) => (e) => {
    const value = e.target.value;
    setter(value);

    setErrors((prev) => {
      const newErrors = { ...prev };
      if (field === 'identifier') {
        if (value) delete newErrors.identifier;
      }
      if (field === 'password') {
        if (value) delete newErrors.password;
      }
      return newErrors;
    });
    setTimeout(validate, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await axios.post(
        'http://localhost:5000/api/auth/login',
        { identifier, password },
        { withCredentials: true }
      );

      alert('¡Inicio de sesión exitoso!');
      navigate('/home');
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al iniciar sesión';
      if (msg === 'Usuario no encontrado.') {
        setErrors((prev) => ({ ...prev, identifier: msg }));
      } else if (msg === 'Contraseña incorrecta.') {
        setErrors((prev) => ({ ...prev, password: msg }));
      } else if (msg === 'Todos los campos son obligatorios.') {
        setErrors({
          identifier: !identifier ? 'El nombre de usuario o el correo es obligatorio.' : undefined,
          password: !password ? 'La contraseña es obligatoria.' : undefined,
        });
      } else {
        setErrorMessage(msg);
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <img src={logo} alt='Logo COMMART'/>
        <h2>Iniciar Sesión</h2>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <input
            type="text"
            placeholder="Usuario o Correo"
            value={identifier}
            onChange={handleChange(setIdentifier, 'identifier')}
            className={errors.identifier ? 'input-error' : ''}
          />
          {errors.identifier && <span className="input-error-message">{errors.identifier}</span>}
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={handleChange(setPassword, 'password')}
            className={errors.password ? 'input-error' : ''}
          />
          {errors.password && <span className="input-error-message">{errors.password}</span>}
          <Link to="/" className="forgot-password-link">¿Olvidaste tu contraseña?</Link>
          <button type="submit">INICIAR</button>
        </form>
        <p>
          ¿No tienes una cuenta?{' '}
          <button className="link-button" onClick={() => {
            onClose();
            setTimeout(onSwitchToRegister, 100);
          }}>
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginModal;
