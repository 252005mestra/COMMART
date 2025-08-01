import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/modal.css';
import logo from '../assets/LogoCOMMART.png';

// Regex igual que backend
const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const containsXSSChars = (input) => /[<>"'&/]/.test(input);

const RegisterModal = ({ onClose, onSwitchToLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Validación en tiempo real
  const validate = (custom = {}) => {
    const newErrors = {};

    const currentUsername = custom.username ?? username;
    const currentEmail = custom.email ?? email;
    const currentPassword = custom.password ?? password;
    const currentConfirmPassword = custom.confirmPassword ?? confirmPassword;

    // Validar que todos los campos estén completos
    if (!currentUsername) newErrors.username = 'El nombre de usuario es obligatorio.';
    if (!currentEmail) newErrors.email = 'El correo es obligatorio.';
    if (!currentPassword) newErrors.password = 'La contraseña es obligatoria.';
    if (!currentConfirmPassword) newErrors.confirmPassword = 'Confirma tu contraseña.';

    // Validar que las contraseñas coincidan
    if (
      currentPassword &&
      currentConfirmPassword &&
      currentPassword !== currentConfirmPassword
    ) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    // Validar caracteres peligrosos en username y password
    if (currentUsername && containsXSSChars(currentUsername)) {
      newErrors.username = 'El nombre de usuario y la contraseña no pueden contener caracteres peligrosos como < > " \' / &';
    }
    if (currentPassword && containsXSSChars(currentPassword)) {
      newErrors.password = 'El nombre de usuario y la contraseña no pueden contener caracteres peligrosos como < > " \' / &';
    }

    // Validar formato de correo
    if (currentEmail && !emailRegex.test(currentEmail)) {
      newErrors.email = 'Formato de correo inválido.';
    }

    // Validar que no haya espacios en blanco en username y password
    if (currentUsername && /\s/.test(currentUsername)) {
      newErrors.username = 'El nombre de usuario y la contraseña no pueden contener espacios.';
    }
    if (currentPassword && /\s/.test(currentPassword)) {
      newErrors.password = 'El nombre de usuario y la contraseña no pueden contener espacios.';
    }

    // Validar que la contraseña sea fuerte
    if (currentPassword && !passwordRegex.test(currentPassword)) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validar en cada cambio
  const handleChange = (setter, field) => (e) => {
    const value = e.target.value;
    setter(value);

    setErrors((prev) => {
      const newErrors = { ...prev };
      if (field === 'username') {
        if (
          value &&
          !containsXSSChars(value) &&
          !/\s/.test(value)
        ) delete newErrors.username;
      }
      if (field === 'email') {
        if (value && emailRegex.test(value)) delete newErrors.email;
      }
      if (field === 'password') {
        if (
          value &&
          !containsXSSChars(value) &&
          !/\s/.test(value) &&
          passwordRegex.test(value)
        ) delete newErrors.password;
        if (confirmPassword && value === confirmPassword) delete newErrors.confirmPassword;
      }
      if (field === 'confirmPassword') {
        if (value && value === password) delete newErrors.confirmPassword;
        if (!value) delete newErrors.confirmPassword;
      }
      return newErrors;
    });

    if (field === 'username') validate({ username: value });
    else if (field === 'email') validate({ email: value });
    else if (field === 'password') validate({ password: value });
    else if (field === 'confirmPassword') validate({ confirmPassword: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        username,
        email,
        password,
        confirmPassword,
      });

      alert('¡Usuario registrado exitosamente!');
      onClose();
      setTimeout(onSwitchToLogin, 100);
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al registrarse';
      if (msg === 'El correo ya está registrado.') {
        setErrors((prev) => ({ ...prev, email: msg }));
      } else if (msg === 'El nombre de usuario ya está en uso.') {
        setErrors((prev) => ({ ...prev, username: msg }));
      } else {
        setErrorMessage(msg);
      }
    }
  };

  return (
    <div className='modal-overlay'>
      <div className='modal-content'>
        <button className='close-button' onClick={onClose}>×</button>
        <img src={logo} alt='Logo COMMART' className='modal-logo' />
        <h2>Registrarse</h2>
        {errorMessage && <p className='error-message'>{errorMessage}</p>}
        <form className='login-form' onSubmit={handleSubmit} noValidate>
          <input
            type='text'
            placeholder='Nombre de Usuario'
            value={username}
            onChange={handleChange(setUsername, 'username')}
            className={errors.username ? 'input-error' : ''}
          />
          {errors.username && <span className='input-error-message'>{errors.username}</span>}
          <input
            type='email'
            placeholder='Correo Electrónico'
            value={email}
            onChange={handleChange(setEmail, 'email')}
            className={errors.email ? 'input-error' : ''}
          />
          {errors.email && <span className='input-error-message'>{errors.email}</span>}
          <input
            type='password'
            placeholder='Contraseña'
            value={password}
            onChange={handleChange(setPassword, 'password')}
            className={errors.password ? 'input-error' : ''}
          />
          {errors.password && <span className='input-error-message'>{errors.password}</span>}
          <input
            type='password'
            placeholder='Confirmar Contraseña'
            value={confirmPassword}
            onChange={handleChange(setConfirmPassword, 'confirmPassword')}
            className={errors.confirmPassword ? 'input-error' : ''}
          />
          {errors.confirmPassword && <span className='input-error-message'>{errors.confirmPassword}</span>}
          <button type='submit'>CREAR</button>
        </form>
        <p>
          ¿Ya tienes una cuenta?{' '}
          <button className='link-button' onClick={() => {
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
