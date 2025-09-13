import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import { Camera, CircleUserRound, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import AlertModal from '../components/AlertModal';
import '../styles/editprofile.css';

const EditProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Estado para alertas
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });

  // Estados para imagen y modal de confirmación
  const [imagePreview, setImagePreview] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingImageUrl, setPendingImageUrl] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    recovery_email: ''
  });

  // Estados para modales
  const [showPasswordConfirmModal, setShowPasswordConfirmModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Estados para la contraseña
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [errors, setErrors] = useState({});

  // Estados adicionales
  const [selectedFile, setSelectedFile] = useState(null);
  const [initialData, setInitialData] = useState({});
  const [isArtist, setIsArtist] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para activación de artista
  const [showArtistConfirm, setShowArtistConfirm] = useState(false);
  const [artistActivationLoading, setArtistActivationLoading] = useState(false);
  const [artistActivationError, setArtistActivationError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userResponse = await axios.get('http://localhost:5000/api/auth/profile', {
          withCredentials: true
        });

        const userData = userResponse.data;
        setFormData({
          username: userData.username || '',
          email: userData.email || '',
          recovery_email: userData.recovery_email || ''
        });
        setInitialData(userData);

        if (userData.profile_image) {
          setImagePreview(`http://localhost:5000/${userData.profile_image}`);
        }

        setIsArtist(!!userData.is_artist);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setErrors({ general: 'Error al cargar los datos del perfil' });
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (location.state?.scrollTo) {
      const el = document.getElementById(location.state.scrollTo);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [location.state]);

  // Verificar si hay cambios
  const hasChanges = () => {
    return (
      formData.username !== initialData.username ||
      formData.recovery_email !== (initialData.recovery_email || '') ||
      selectedFile
    );
  };

  // Manejar cambios en inputs de texto
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Validación en tiempo real para username y recovery_email
    if (name === 'username' || name === 'recovery_email') {
      validateField(name, value);
    }
  };

  // Manejar cambio de imagen (con preview y confirmación)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'La imagen no puede ser mayor a 5MB' }));
        return;
      }

      // Validar tipo
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Solo se permiten archivos de imagen' }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        setPendingImage(file);
        setPendingImageUrl(ev.target.result);
        setShowConfirm(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Confirmar cambio de imagen
  const handleConfirmChange = () => {
    setSelectedFile(pendingImage);
    setImagePreview(pendingImageUrl);
    setShowConfirm(false);
    setPendingImage(null);
    setPendingImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Cancelar cambio de imagen
  const handleCancelChange = () => {
    setPendingImage(null);
    setPendingImageUrl(null);
    setShowConfirm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Regex igual que en registro
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  const containsXSSChars = (input) => /[<>"'&/]/.test(input);

  // Alternar visibilidad de contraseñas
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Validación de campos (incluye contraseñas)
  const validateField = async (field, value, isRequired = false, pwdData = passwordData) => {
    let newErrors = { ...errors };

    switch (field) {
      case 'username':
        if (!value) {
          newErrors.username = 'El nombre de usuario es obligatorio.';
        } else if (value.length < 3) {
          newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres.';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          newErrors.username = 'Solo letras, números y guiones bajos.';
        } else if (containsXSSChars(value)) {
          newErrors.username = 'No se permiten caracteres peligrosos como < > " \' / &';
        } else if (/\s/.test(value)) {
          newErrors.username = 'No se permiten espacios.';
        } else {
          try {
            const res = await axios.post(
              'http://localhost:5000/api/auth/check-username',
              { username: value, excludeUserId: initialData.id },
              { withCredentials: true }
            );
            if (!res.data.available) {
              newErrors.username = 'El nombre de usuario ya está en uso.';
            } else {
              delete newErrors.username;
            }
          } catch (err) {
            newErrors.username = 'Error al verificar el nombre de usuario.';
          }
        }
        break;

      case 'recovery_email':
        if (value && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value)) {
          newErrors.recovery_email = 'Formato de correo inválido.';
        } else if (value) {
          try {
            const res = await axios.post(
              'http://localhost:5000/api/auth/check-recovery-email',
              { recovery_email: value, excludeUserId: initialData.id },
              { withCredentials: true }
            );
            if (!res.data.available) {
              newErrors.recovery_email = 'El correo ya está en uso.';
            } else {
              delete newErrors.recovery_email;
            }
          } catch (err) {
            newErrors.recovery_email = 'Error al verificar correo.';
          }
        } else {
          delete newErrors.recovery_email;
        }
        break;

      case 'current_password':
        if (isRequired && !value) {
          newErrors.current_password = 'La contraseña actual es obligatoria.';
        } else if (/\s/.test(value)) {
          newErrors.current_password = 'No se permiten espacios.';
        } else if (containsXSSChars(value)) {
          newErrors.current_password = 'No se permiten caracteres peligrosos como < > " \' / &';
        } else if (value) {
          try {
            const res = await axios.post(
              'http://localhost:5000/api/auth/verify-password',
              { current_password: value },
              { withCredentials: true }
            );
            if (!res.data.valid) {
              newErrors.current_password = 'La contraseña actual es incorrecta.';
            } else {
              delete newErrors.current_password;
            }
          } catch {
            newErrors.current_password = 'Error al verificar contraseña actual.';
          }
        } else {
          delete newErrors.current_password;
        }
        break;

      case 'new_password':
        if (isRequired && !value) {
          newErrors.new_password = 'La nueva contraseña es obligatoria.';
        } else if (value === pwdData.current_password && value) {
          newErrors.new_password = 'La nueva contraseña no puede ser igual a la actual.';
        } else if (value && containsXSSChars(value)) {
          newErrors.new_password = 'No se permiten caracteres peligrosos como < > " \' / &';
        } else if (value && /\s/.test(value)) {
          newErrors.new_password = 'No se permiten espacios.';
        } else if (value && !passwordRegex.test(value)) {
          newErrors.new_password = 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial.';
        } else {
          delete newErrors.new_password;
        }
        break;

      case 'confirm_password':
        if (!value) {
          newErrors.confirm_password = 'Confirma tu nueva contraseña.';
        } else if (pwdData.new_password && value !== pwdData.new_password) {
          newErrors.confirm_password = 'Las contraseñas no coinciden.';
        } else {
          delete newErrors.confirm_password;
        }
        break;
    }

    setErrors(newErrors);
  };

  // Handler de cambio de input de contraseña
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => {
      const updated = { ...prev, [name]: value };
      validateField(name, value, true, updated);
      if (name === 'new_password' || name === 'confirm_password') {
        validateField('confirm_password', updated.confirm_password, true, updated);
      }
      if (name === 'current_password' || name === 'new_password') {
        validateField('new_password', updated.new_password, true, updated);
      }
      return updated;
    });
  };

  // Función para cancelar y restaurar datos originales
  const handleCancel = () => {
    setFormData({
      username: initialData.username || '',
      email: initialData.email || '',
      recovery_email: initialData.recovery_email || ''
    });

    if (initialData.profile_image) {
      setImagePreview(`http://localhost:5000/${initialData.profile_image}`);
    } else {
      setImagePreview(null);
    }

    setSelectedFile(null);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Función para volver al home
  const handleGoBack = () => {
    navigate('/home');
  };

  // Mostrar modal de confirmación para cambio de contraseña
  const handlePasswordChangeClick = () => {
    setShowPasswordConfirmModal(true);
  };

  // Confirmar que quiere cambiar contraseña
  const handlePasswordConfirmContinue = () => {
    setShowPasswordConfirmModal(false);
    setShowPasswordModal(true);
  };

  // Cancelar cambio de contraseña
  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setShowPasswordConfirmModal(false);
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    const newErrors = { ...errors };
    delete newErrors.current_password;
    delete newErrors.new_password;
    delete newErrors.confirm_password;
    setErrors(newErrors);
  };

  // Confirmar cambio de contraseña
  const handlePasswordConfirm = async () => {
    await validateField('current_password', passwordData.current_password, true);
    await validateField('new_password', passwordData.new_password, true);
    await validateField('confirm_password', passwordData.confirm_password, true);

    setTimeout(() => {
      const hasPasswordErrors = ['current_password', 'new_password', 'confirm_password']
        .some(field => errors[field]);

      if (
        !hasPasswordErrors &&
        passwordData.current_password &&
        passwordData.new_password &&
        passwordData.confirm_password
      ) {
        setShowPasswordModal(false);
        handleSubmit(null, true);
      }
    }, 0);
  };

  // Prevenir submit con Enter en el modal de contraseña
  const handlePasswordFormKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  // Manejar solicitud de activación de artista
  const handleArtistActivationRequest = () => {
    setShowArtistConfirm(true);
  };

  // Cancelar activación de artista
  const handleCancelArtistActivation = () => {
    setShowArtistConfirm(false);
    setArtistActivationError('');
  };

  // Activar cuenta de artista
  const handleArtistActivation = async () => {
    try {
      setArtistActivationLoading(true);
      setArtistActivationError('');

      const formDataToSend = new FormData();
      formDataToSend.append('is_artist', 'true');

      await axios.put('http://localhost:5000/api/auth/profile', formDataToSend, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setIsArtist(true);
      setShowArtistConfirm(false);
      setAlert({ open: true, type: 'success', message: '¡Cuenta de artista activada exitosamente!' });
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al activar cuenta de artista';
      setArtistActivationError(msg);
    } finally {
      setArtistActivationLoading(false);
    }
  };

  // Enviar formulario
  const handleSubmit = async (e = null, includePassword = false) => {
    if (e) e.preventDefault();

    if (!hasChanges() && !includePassword) {
      setErrors({ general: 'No se han realizado cambios' });
      return;
    }

    if (Object.keys(errors).some(key => key !== 'general' && errors[key])) {
      return;
    }

    try {
      setLoading(true);
      const formDataToSend = new FormData();

      if (formData.username !== initialData.username) {
        formDataToSend.append('username', formData.username);
      }

      if (formData.recovery_email !== (initialData.recovery_email || '')) {
        formDataToSend.append('recovery_email', formData.recovery_email);
      }

      if (includePassword && passwordData.new_password) {
        formDataToSend.append('current_password', passwordData.current_password);
        formDataToSend.append('new_password', passwordData.new_password);
      }

      if (selectedFile) {
        formDataToSend.append('profile_image', selectedFile);
      }

      await axios.put('http://localhost:5000/api/auth/profile', formDataToSend, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setAlert({ open: true, type: 'success', message: 'Perfil actualizado exitosamente' });

      const userResponse = await axios.get('http://localhost:5000/api/auth/profile', {
        withCredentials: true
      });

      const userData = userResponse.data;
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        recovery_email: userData.recovery_email || ''
      });
      setInitialData(userData);

      if (userData.profile_image) {
        setImagePreview(`http://localhost:5000/${userData.profile_image}`);
      }

      setSelectedFile(null);

      if (includePassword) {
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      }

      setErrors({});
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al actualizar el perfil';
      setErrors(prev => ({ ...prev, general: msg }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MainNav />

      <main className="main-content">
        <section className="edit-profile-section">
          <div className="edit-profile-container">
            <div className="edit-profile-header">
              <button
                type="button"
                className="back-btn"
                onClick={handleGoBack}
                title="Volver al inicio"
              >
                <ArrowLeft size={20} />
                Volver
              </button>
              <h1>Datos Principales</h1>
            </div>
            <div className="edit-profile-card">
              <div className="card-header">
                <h2>Datos de Cuenta</h2>
              </div>

              {errors.general && !errors.username && (
                <div className="general-error">
                  {errors.general}
                </div>
              )}

              <div className="profile-image-container">
                <div
                  className="profile-image-preview"
                  onClick={() => fileInputRef.current?.click()}
                  title="Hacer click para cambiar foto de perfil"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Vista previa" />
                  ) : (
                    <CircleUserRound size={60} />
                  )}
                  <div className="camera-overlay">
                    <Camera size={20} />
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                </div>
              </div>
              {errors.image && (
                <span className="field-error">{errors.image}</span>
              )}

              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-field">
                  <label>Usuario</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    onBlur={() => validateField('username', formData.username)}
                    className={errors.username ? 'input-error' : ''}
                  />
                  {errors.username && (
                    <span className="input-error-message">{errors.username}</span>
                  )}
                </div>

                <div className="form-field">
                  <label>Correo electrónico</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="disabled-field"
                  />
                </div>

                <div className="form-field">
                  <label>Correo de recuperación</label>
                  <input
                    type="email"
                    name="recovery_email"
                    value={formData.recovery_email}
                    onChange={handleInputChange}
                    onBlur={() => validateField('recovery_email', formData.recovery_email)}
                    className={errors.recovery_email ? 'input-error' : ''}
                  />
                  {errors.recovery_email && (
                    <span className="input-error-message">{errors.recovery_email}</span>
                  )}
                </div>

                <div className="form-field password-field">
                  <label>Contraseña</label>
                  <div className="password-display" onClick={handlePasswordChangeClick}>
                    <span className="password-dots">●●●●●●●●●●●●</span>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={handleCancel}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="save-btn"
                    disabled={loading || (!hasChanges() && Object.keys(errors).some(key => key !== 'general' && errors[key]))}
                  >
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Separador visual */}
        <section className="section-separator">
          <hr className="section-divider" />
        </section>

        {/* Sección de activar cuenta de artista */}
        <section className="artist-activation-section">
          <div className="edit-profile-container">
            <div className="edit-profile-header">
              <button
                type="button"
                className="back-btn"
                onClick={handleGoBack}
                title="Volver al inicio"
              >
                <ArrowLeft size={20} />
                Volver
              </button>
              <h2 id="artist-activation-title">Activar cuenta de artista</h2>
            </div>
            <div className="edit-profile-card">
              <div className="artist-activation-content">
                <div className="artist-activation-logo">
                  <img src="/src/assets/LogoCOMMART.png" alt="COMMART" />
                </div>
                <h2 className="artist-activation-title">¿Deseas convertir tu cuenta como artista?</h2>
                <div className="artist-activation-desc">
                  Al activar esta opción, tu cuenta se convertirá en una cuenta de ARTISTA. Mantendrás todas las funciones de una cuenta de USUARIO, pero contarás con herramientas adicionales, como un portafolio personal para gestionar y recibir comisiones.
                </div>
                <div className="artist-activation-warning">
                  <b>(IMPORTANTE: Esta función es para aquellos usuarios que deseen comercializar sus ilustraciones a través de comisiones. Ten en cuenta que, una vez activada, no podrás desactivar esta función).</b>
                </div>
                {artistActivationError && (
                  <div className="field-error">{artistActivationError}</div>
                )}
                {!isArtist ? (
                  <button
                    type="button"
                    className="save-btn"
                    onClick={handleArtistActivationRequest}
                    disabled={artistActivationLoading}
                  >
                    {artistActivationLoading ? 'Activando...' : 'Activar cuenta de ARTISTA'}
                  </button>
                ) : (
                  <div className="already-artist-msg">
                    Ya eres artista. Esta acción no se puede deshacer.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modal de confirmación para cambio de contraseña */}
      {showPasswordConfirmModal && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <h3>¿Deseas cambiar tu contraseña?</h3>
            <div className="confirmation-buttons">
              <button
                className="cancel-modal-btn"
                onClick={() => setShowPasswordConfirmModal(false)}
              >
                Cancelar
              </button>
              <button
                className="continue-modal-btn"
                onClick={handlePasswordConfirmContinue}
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de cambio de contraseña */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="password-change-modal">
            <div className="modal-header">
              <img src="/src/assets/LogoCOMMART.png" alt="COMMART" className="modal-logo" />
              <h2>Cambiar Contraseña</h2>
            </div>

            <form
              className="password-change-form"
              onSubmit={e => e.preventDefault()}
              onKeyDown={handlePasswordFormKeyDown}
            >
              <div className="password-input-group">
                <div className="password-input-container">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordInputChange}
                    className={errors.current_password ? 'input-error' : ''}
                    placeholder="Contraseña actual"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => togglePasswordVisibility('current')}
                    tabIndex={-1}
                  >
                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.current_password && (
                  <span className="input-error-message">{errors.current_password}</span>
                )}
              </div>

              <div className="password-input-group">
                <div className="password-input-container">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordInputChange}
                    className={errors.new_password ? 'input-error' : ''}
                    placeholder="Contraseña nueva"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => togglePasswordVisibility('new')}
                    tabIndex={-1}
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.new_password && (
                  <span className="input-error-message">{errors.new_password}</span>
                )}
              </div>

              <div className="password-input-group">
                <div className="password-input-container">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordInputChange}
                    className={errors.confirm_password ? 'input-error' : ''}
                    placeholder="Confirmar contraseña"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => togglePasswordVisibility('confirm')}
                    tabIndex={-1}
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirm_password && (
                  <span className="input-error-message">{errors.confirm_password}</span>
                )}
              </div>

              <div className="modal-buttons">
                <button
                  type="button"
                  className="cancel-modal-btn"
                  onClick={handlePasswordCancel}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="save-modal-btn"
                  onClick={handlePasswordConfirm}
                  disabled={
                    !passwordData.current_password ||
                    !passwordData.new_password ||
                    !passwordData.confirm_password ||
                    Object.keys(errors).some(key => key.includes('password') && errors[key])
                  }
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para activar artista */}
      {showArtistConfirm && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <p style={{ marginBottom: '1.2rem', marginTop: 0 }}>
              ¿Estas seguro que deseas activar tu cuenta como <b>ARTISTA</b>?
            </p>
            <p style={{ fontWeight: 700, marginBottom: '2rem' }}>
              (RECUERDA: No podrás desactivar esta opción una vez activada)
            </p>
            <div className="confirmation-buttons">
              <button className="cancel-modal-btn" onClick={handleCancelArtistActivation}>
                Cancelar
              </button>
              <button className="continue-modal-btn" onClick={handleArtistActivation}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de imagen */}
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 350, textAlign: 'center' }}>
            <h3 className="modal-title-goldman">¿Deseas cambiar tu foto de perfil?</h3>
            <div style={{ margin: '1rem 0' }}>
              <img
                src={pendingImageUrl}
                alt="Vista previa"
                style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '3px solid #b3b792' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="cancel-btn" onClick={handleCancelChange}>Cancelar</button>
              <button className="save-btn" onClick={handleConfirmChange}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* AlertModal para mostrar mensajes */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert(a => ({ ...a, open: false }))}
      />

      <Footer />
    </>
  );
};

export default EditProfile;