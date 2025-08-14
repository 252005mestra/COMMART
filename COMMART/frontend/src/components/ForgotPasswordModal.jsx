import { useState } from 'react';
import axios from 'axios';

const ForgotPasswordModal = ({ onClose }) => {
  const [identifier, setIdentifier] = useState('');
  const [userEmails, setUserEmails] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Paso 1: Buscar usuario por identificador
  const handleFindUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMsg('');
    setUserEmails(null);
    setSelectedEmail('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/find-user', { identifier });
      if (res.data.email && res.data.recovery_email) {
        setUserEmails(res.data);
      } else if (res.data.email) {
        setSelectedEmail(res.data.email);
        await handleSendEmail(res.data.email);
      } else if (res.data.recovery_email) {
        setSelectedEmail(res.data.recovery_email);
        await handleSendEmail(res.data.recovery_email);
      } else {
        setError('No se encontró ningún correo asociado a ese usuario.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'No se encontró el usuario.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Enviar correo de recuperación
  const handleSendEmail = async (emailToSend) => {
    setLoading(true);
    setError('');
    setMsg('');
    try {
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email: emailToSend });
      setMsg('Correo enviado. Revisa tu bandeja de entrada.');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose} disabled={loading}>×</button>
        <img src="/src/assets/LogoCOMMART.png" alt="COMMART" style={{ height: '3rem', marginBottom: '1rem' }} />
        <h2>¿Tienes problemas para iniciar sesión?</h2>
        <p>
          Ingresa tu nombre de usuario, el correo asociado a tu cuenta o tu correo de recuperación para poder identificar tu cuenta. Luego, te enviaremos un enlace de recuperación a uno de los correos asociados.
        </p>
        {!userEmails ? (
          <form onSubmit={handleFindUser}>
            <input
              type="text"
              placeholder="Usuario, correo electrónico o correo de recuperación"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
              disabled={loading}
            />
            <button type="submit" disabled={loading || !identifier}>
              {loading ? (
                <span>
                  <span className="spinner" /> Enviando...
                </span>
              ) : 'Enviar'}
            </button>
          </form>
        ) : (
          <>
            <p>Selecciona a qué correo deseas recibir el enlace de recuperación:</p>
            <div style={{ marginBottom: '1rem' }}>
              {userEmails.email && (
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  <input
                    type="radio"
                    name="email"
                    value={userEmails.email}
                    checked={selectedEmail === userEmails.email}
                    onChange={() => setSelectedEmail(userEmails.email)}
                    disabled={loading}
                  />
                  {userEmails.email} (principal)
                </label>
              )}
              {userEmails.recovery_email && (
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  <input
                    type="radio"
                    name="email"
                    value={userEmails.recovery_email}
                    checked={selectedEmail === userEmails.recovery_email}
                    onChange={() => setSelectedEmail(userEmails.recovery_email)}
                    disabled={loading}
                  />
                  {userEmails.recovery_email} (recuperación)
                </label>
              )}
            </div>
            <button
              type="button"
              disabled={loading || !selectedEmail}
              onClick={() => handleSendEmail(selectedEmail)}
            >
              {loading ? (
                <span>
                  <span className="spinner" /> Enviando...
                </span>
              ) : 'Enviar enlace'}
            </button>
          </>
        )}
        {msg && <p>{msg}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;