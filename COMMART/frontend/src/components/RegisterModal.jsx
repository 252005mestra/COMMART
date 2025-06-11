import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/loginModal.css';
import logo from "../assets/LogoCOMMART.png";

const RegisterModal = ({ onClose, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        username,
        email,
        password,
        confirmPassword,
      });

      alert('¡Usuario registrado exitosamente!');
      onClose();// Cerrar modal después del registro
      setTimeout(onSwitchToLogin, 100); // Abrir modal de login después de cerrar la de registro 
    } catch (error) {
      console.error(error.response?.data?.message || error.message);
      setErrorMessage(error.response?.data?.message || 'Error al registrarse');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <img src={logo} alt="Logo COMMART" className="modal-logo" />
        <h2>Registrarse</h2>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre de Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="email"
            placeholder="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirmar Contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button type="submit">Registrarse</button>
        </form>
        <p>
          ¿Ya tienes una cuenta?{' '}
          <button className="link-button" onClick={() => {
            onClose();
            setTimeout(onSwitchToLogin, 100);
          }}>
            Inicia sesión aquí
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterModal;
