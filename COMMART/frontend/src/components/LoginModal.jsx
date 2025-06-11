import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/loginModal.css';
import logo from "../assets/LogoCOMMART.png";

const LoginModal = ({ onClose, onSwitchToRegister }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        'http://localhost:5000/api/auth/login',
        { identifier, password },
        { withCredentials: true }
      );

      alert('¡Inicio de sesión exitoso!');
      navigate('/home');
      onClose();
    } catch (error) {
      console.error(error.response?.data?.message || error.message);
      setErrorMessage(error.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <img src={logo} alt="Logo COMMART" className="modal-logo" />
        <h2>Iniciar Sesión</h2>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Usuario o Correo"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Entrar</button>
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
