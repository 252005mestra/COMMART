import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import { CircleUserRound, Camera, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import '../styles/editprofile.css';

const EditProfile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // Estados para la búsqueda (necesarios para MainNav)
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [styles, setStyles] = useState([]);
  
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
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState({});

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar datos del usuario
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

        // Cargar datos para la búsqueda
        const [artistsResponse, stylesResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/auth/artists', { withCredentials: true }),
          axios.get('http://localhost:5000/api/auth/styles')
        ]);
        
        setUsers(artistsResponse.data);
        setStyles(stylesResponse.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setErrors({ general: 'Error al cargar los datos del perfil' });
      }
    };

    fetchData();
  }, []);

  // Sugerencias para la búsqueda
  const artistSuggestions = users
    .filter(user =>
      searchTerm &&
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 4);

  const styleSuggestions = styles
    .filter(style =>
      searchTerm &&
      style.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 4);

  const getProfileImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-profile.jpg';

  const handleStyleSelect = (style) => {
    // Función requerida por MainNav, no necesaria aquí pero debe existir
  };

  // Función para verificar contraseña actual con el servidor
  const verifyCurrentPassword = async (password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/verify-password', {
        current_password: password
      }, { withCredentials: true });
      
      return response.data.valid;
    } catch (error) {
      console.error('Error al verificar contraseña:', error);
      return false;
    }
  };

  // Validaciones en tiempo real (usando las mismas del registro)
  const validateField = async (field, value, isPasswordField = false) => {
    const newErrors = { ...errors };
    
    if (isPasswordField) {
      // Validaciones para campos de contraseña
      switch (field) {
        case 'current_password':
          if (!value.trim()) {
            newErrors.current_password = 'La contraseña es obligatoria.';
          } else if (/\s/.test(value)) {
            newErrors.current_password = 'El nombre de usuario y la contraseña no pueden contener espacios.';
          } else if (/[<>"'&/]/.test(value)) {
            newErrors.current_password = 'El nombre de usuario y la contraseña no pueden contener caracteres peligrosos como < > " \' / &';
          } else {
            // Verificar con el servidor si la contraseña es correcta
            const isValid = await verifyCurrentPassword(value);
            if (!isValid) {
              newErrors.current_password = 'Contraseña incorrecta.';
            } else {
              delete newErrors.current_password;
            }
          }
          break;
          
        case 'new_password':
          if (!value.trim()) {
            newErrors.new_password = 'La contraseña es obligatoria.';
          } else if (/[<>"'&/]/.test(value)) {
            newErrors.new_password = 'El nombre de usuario y la contraseña no pueden contener caracteres peligrosos como < > " \' / &';
          } else if (/\s/.test(value)) {
            newErrors.new_password = 'El nombre de usuario y la contraseña no pueden contener espacios.';
          } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(value)) {
            newErrors.new_password = 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial.';
          } else if (passwordData.current_password && value === passwordData.current_password) {
            newErrors.new_password = 'La nueva contraseña debe ser diferente a la actual.';
          } else {
            delete newErrors.new_password;
          }
          break;
          
        case 'confirm_password':
          if (!value.trim()) {
            newErrors.confirm_password = 'Confirma tu contraseña.';
          } else if (passwordData.new_password && value !== passwordData.new_password) {
            newErrors.confirm_password = 'Las contraseñas no coinciden.';
          } else {
            delete newErrors.confirm_password;
          }
          break;
      }
    } else {
      // Validaciones para campos normales
      switch (field) {
        case 'username':
          if (!value.trim()) {
            newErrors.username = 'El nombre de usuario es obligatorio.';
          } else if (/[<>"'&/]/.test(value)) {
            newErrors.username = 'El nombre de usuario y la contraseña no pueden contener caracteres peligrosos como < > " \' / &';
          } else if (/\s/.test(value)) {
            newErrors.username = 'El nombre de usuario y la contraseña no pueden contener espacios.';
          } else if (value !== initialData.username) {
            // Verificar disponibilidad del username en tiempo real
            try {
              const response = await axios.post('http://localhost:5000/api/auth/check-username', {
                username: value,
                excludeUserId: initialData.id
              }, { withCredentials: true });
              
              if (!response.data.available) {
                newErrors.username = 'El nombre de usuario ya está en uso.';
              } else {
                delete newErrors.username;
              }
            } catch (error) {
              // Si hay error en la verificación, no mostrar error aún
              delete newErrors.username;
            }
          } else {
            delete newErrors.username;
          }
          break;
          
        case 'recovery_email':
          if (value && !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value)) {
            newErrors.recovery_email = 'Formato de correo inválido.';
          } else {
            delete newErrors.recovery_email;
          }
          break;
      }
    }
    
    setErrors(newErrors);
  };

  // Manejar cambios en inputs normales
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  // Manejar cambios en inputs de contraseña
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    // Validación en tiempo real
    validateField(name, value, true);
    
    // Si cambia la contraseña actual, revalidar la nueva contraseña
    if (name === 'current_password' && passwordData.new_password) {
      setTimeout(() => validateField('new_password', passwordData.new_password, true), 100);
    }
    
    // Si cambia la nueva contraseña, revalidar la confirmación
    if (name === 'new_password' && passwordData.confirm_password) {
      setTimeout(() => validateField('confirm_password', passwordData.confirm_password, true), 100);
    }
  };

  // Manejar selección de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Solo se permiten archivos de imagen' }));
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'La imagen no puede superar los 5MB' }));
        return;
      }
      
      setProfileImage(file);
      setErrors(prev => ({ ...prev, image: undefined }));
      
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Alternar visibilidad de contraseñas
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Verificar si hay cambios
  const hasChanges = () => {
    return (
      formData.username !== initialData.username ||
      formData.recovery_email !== (initialData.recovery_email || '') ||
      profileImage
    );
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
    setProfileImage(null);
    
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

    // Verificar si hay errores después de un breve delay para permitir que las validaciones async terminen
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
    
    setLoading(true);
    
    try {
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
      
      if (profileImage) {
        formDataToSend.append('profile_image', profileImage);
      }
      
      await axios.put('http://localhost:5000/api/auth/profile', formDataToSend, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      alert('Perfil actualizado exitosamente');
      
      // En lugar de redirigir, actualizar los datos iniciales y limpiar el estado
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
      setProfileImage(null);
      
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
      <MainNav
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        artistSuggestions={artistSuggestions}
        styleSuggestions={styleSuggestions}
        getProfileImageUrl={getProfileImageUrl}
        onStyleSelect={handleStyleSelect}
      />
      
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
                <div className="profile-image-preview">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Profile" />
                  ) : (
                    <CircleUserRound size={60} />
                  )}
                  <button
                    type="button"
                    className="edit-image-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={16} />
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                {errors.image && (
                  <span className="field-error">{errors.image}</span>
                )}
              </div>

              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-field">
                  <label>Usuario</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
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
                  type={showPasswords.current ? 'text' : 'password'}
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
                  onClick={() => togglePasswordVisibility('current')}
                >
                  {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.current_password && (
                  <span className="field-error">{errors.current_password}</span>
                )}
              </div>

              <div className="password-input-group">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
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
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {errors.new_password && (
                  <span className="field-error">{errors.new_password}</span>
                )}
              </div>

              <div className="password-input-group">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
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
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
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
      
      <Footer />
    </>
  );
};

export default EditProfile;