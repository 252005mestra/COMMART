import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import { Camera, CircleUserRound, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import '../styles/editprofile.css';

const EditProfile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  // Estados adicionales
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [initialData, setInitialData] = useState({});
  const [isArtist, setIsArtist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
    
    // Limpiar errores específicos del campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
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

  // Manejar cambios en inputs de contraseña
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores específicos del campo
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validación de campos
  const validateField = async (field, value, isRequired = false) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'username':
        if (!value) {
          newErrors.username = 'El nombre de usuario es obligatorio';
        } else if (value.length < 3) {
          newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          newErrors.username = 'El nombre de usuario solo puede contener letras, números y guiones bajos';
        } else {
          delete newErrors.username;
        }
        break;
        
      case 'recovery_email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
          newErrors.recovery_email = 'Formato de correo inválido';
        } else {
          delete newErrors.recovery_email;
        }
        break;
        
      case 'current_password':
        if (isRequired && !value) {
          newErrors.current_password = 'La contraseña actual es obligatoria';
        } else {
          delete newErrors.current_password;
        }
        break;
        
      case 'new_password':
        if (isRequired && !value) {
          newErrors.new_password = 'La nueva contraseña es obligatoria';
        } else if (value && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(value)) {
          newErrors.new_password = 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial';
        } else {
          delete newErrors.new_password;
        }
        break;
        
      case 'confirm_password':
        if (isRequired && !value) {
          newErrors.confirm_password = 'Confirma tu nueva contraseña';
        } else if (isRequired && value !== passwordData.new_password) {
          newErrors.confirm_password = 'Las contraseñas no coinciden';
        } else {
          delete newErrors.confirm_password;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  // Función para cancelar y restaurar datos originales
  const handleCancel = () => {
    // Restaurar datos originales
    setFormData({
      username: initialData.username || '',
      email: initialData.email || '',
      recovery_email: initialData.recovery_email || ''
    });
    
    // Restaurar imagen original
    if (initialData.profile_image) {
      setImagePreview(`http://localhost:5000/${initialData.profile_image}`);
    } else {
      setImagePreview(null);
    }
    
    // Limpiar imagen seleccionada
    setSelectedFile(null);
    
    // Limpiar errores
    setErrors({});
    
    // Resetear el input de archivo
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
    // Limpiar errores de contraseña
    const newErrors = { ...errors };
    delete newErrors.current_password;
    delete newErrors.new_password;
    delete newErrors.confirm_password;
    setErrors(newErrors);
  };

  // Confirmar cambio de contraseña
  const handlePasswordConfirm = async () => {
    // Validar todos los campos de contraseña
    await validateField('current_password', passwordData.current_password, true);
    await validateField('new_password', passwordData.new_password, true);
    await validateField('confirm_password', passwordData.confirm_password, true);

    // Verificar si hay errores después de un breve delay
    setTimeout(() => {
      const hasPasswordErrors = ['current_password', 'new_password', 'confirm_password']
        .some(field => errors[field]);

      if (!hasPasswordErrors && passwordData.current_password && 
          passwordData.new_password && passwordData.confirm_password) {
        setShowPasswordModal(false);
        // Proceder con el envío del formulario completo
        handleSubmit(null, true);
      }
    }, 500);
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
      alert('¡Cuenta de artista activada exitosamente!');
      
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
    
    // Validar que no haya errores
    if (Object.keys(errors).some(key => key !== 'general' && errors[key])) {
      return;
    }
    
    try {
      setLoading(true);
      const formDataToSend = new FormData();
      
      // Solo enviar campos que han cambiado
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
      
      alert('Perfil actualizado exitosamente');
      
      // Recargar los datos del usuario actualizado
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
      
      // Actualizar imagen de perfil si se cambió
      if (userData.profile_image) {
        setImagePreview(`http://localhost:5000/${userData.profile_image}`);
      }
      
      // Limpiar el estado de la imagen seleccionada
      setSelectedFile(null);
      
      // Limpiar datos de contraseña si se cambió
      if (includePassword) {
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      }
      
      // Limpiar errores
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

              {errors.general && (
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
                    <span className="field-error">{errors.username}</span>
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
                    <span className="field-error">{errors.recovery_email}</span>
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
              onSubmit={(e) => e.preventDefault()}
              onKeyDown={handlePasswordFormKeyDown}
            >
              <div className="password-input-group">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordInputChange}
                  className={errors.current_password ? 'input-error' : ''}
                  placeholder="Contraseña actual"
                  onKeyDown={handlePasswordFormKeyDown}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowCurrentPassword(prev => !prev)}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.current_password && (
                  <span className="field-error">{errors.current_password}</span>
                )}
              </div>

              <div className="password-input-group">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordInputChange}
                  className={errors.new_password ? 'input-error' : ''}
                  placeholder="Contraseña nueva"
                  onKeyDown={handlePasswordFormKeyDown}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowNewPassword(prev => !prev)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.new_password && (
                  <span className="field-error">{errors.new_password}</span>
                )}
              </div>

              <div className="password-input-group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordInputChange}
                  className={errors.confirm_password ? 'input-error' : ''}
                  placeholder="Confirmar contraseña"
                  onKeyDown={handlePasswordFormKeyDown}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.confirm_password && (
                  <span className="field-error">{errors.confirm_password}</span>
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

      <Footer />
    </>
  );
};

export default EditProfile;