import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Trash2, Plus, X, Camera, Star, StarOff, CircleUserRound, CircleArrowLeft, CircleArrowRight } from 'lucide-react';
import axios from 'axios';
import UserListModal from './UserListModal';
import '../styles/artistportfolio.css';

const ArtistPortfolio = ({
  artist = {},
  allStyles = [],
  allLanguages = [],
  isOwnProfile = false,
  onSave,
  onOrder,
  onFollow,
  onFavorite,
  isFollowing = false,
  isFavorite = false,
  actionLoading = { follow: false, favorite: false }
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados locales para edición
  const [bio, setBio] = useState('');
  const [styles, setStyles] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [availability, setAvailability] = useState(true);
  const [pricePolicy, setPricePolicy] = useState('');
  const [portfolio, setPortfolio] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const fileInputRef = useRef(null);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // Carrusel
  const [currentImg, setCurrentImg] = useState(0);

  // Estados para modales
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showMyFavoritesModal, setShowMyFavoritesModal] = useState(false);
  const [showMyFollowingModal, setShowMyFollowingModal] = useState(false);

  // Inicializar estados cuando cambie el artista
  useEffect(() => {
    if (artist) {
      setBio(artist.bio || '');
      setStyles(artist.styles || []);
      setLanguages(artist.languages || []);
      setAvailability(artist.availability !== undefined ? artist.availability : true);
      setPricePolicy(artist.price_policy || '');
      setPortfolio(artist.portfolio || []);
      setProfileImagePreview(null);
      setProfileImage(null);
      setNewImages([]);
      setCurrentImg(0);
    }
  }, [artist]);

  // Handlers del carrusel
  const handlePrev = () => {
    const totalImages = portfolio.length + newImages.length;
    if (totalImages > 0) {
      setCurrentImg((prev) => (prev - 1 + totalImages) % totalImages);
    }
  };

  const handleNext = () => {
    const totalImages = portfolio.length + newImages.length;
    if (totalImages > 0) {
      setCurrentImg((prev) => (prev + 1) % totalImages);
    }
  };

  // Obtener imagen actual del carrusel
  const getCurrentImage = () => {
    const totalPortfolio = portfolio.length;
    if (currentImg < totalPortfolio) {
      return {
        type: 'existing',
        src: `http://localhost:5000/${portfolio[currentImg].image_path}`,
        id: portfolio[currentImg].id
      };
    } else {
      const newImageIndex = currentImg - totalPortfolio;
      return {
        type: 'new',
        src: newImages[newImageIndex]?.preview,
        file: newImages[newImageIndex]?.file,
        index: newImageIndex
      };
    }
  };

  // Handlers de edición
  const handleAddStyle = (style) => {
    if (style && !styles.includes(style)) {
      setStyles([...styles, style]);
    }
  };

  const handleRemoveStyle = (style) => {
    setStyles(styles.filter(s => s !== style));
  };

  const handleAddLanguage = (lang) => {
    if (lang && !languages.includes(lang)) {
      setLanguages([...languages, lang]);
    }
  };

  const handleRemoveLanguage = (lang) => {
    setLanguages(languages.filter(l => l !== lang));
  };

  // Manejar cambio de imagen de perfil
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede ser mayor a 5MB');
        return;
      }
      
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => setProfileImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Agregar imagen de portafolio
  const handleAddPortfolioImage = (e) => {
    const file = e.target.files[0];
    const totalImages = portfolio.length + newImages.length;
    
    if (file && totalImages < 6) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede ser mayor a 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen');
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewImages(prev => [...prev, { file, preview: ev.target.result }]);
      };
      reader.readAsDataURL(file);
    } else if (totalImages >= 6) {
      alert('Máximo 6 imágenes en el portafolio');
    }
  };

  // Eliminar imagen del portafolio
  const handleRemoveImage = async () => {
    const currentImage = getCurrentImage();
    
    if (currentImage.type === 'existing') {
      // Eliminar imagen existente de la base de datos
      try {
        await axios.delete(`http://localhost:5000/api/auth/artist/portfolio/${currentImage.id}`, {
          withCredentials: true
        });
        
        // Actualizar estado local
        const updatedPortfolio = portfolio.filter(img => img.id !== currentImage.id);
        setPortfolio(updatedPortfolio);
        
        // Ajustar currentImg si es necesario
        const totalImages = updatedPortfolio.length + newImages.length;
        if (currentImg >= totalImages && totalImages > 0) {
          setCurrentImg(totalImages - 1);
        } else if (totalImages === 0) {
          setCurrentImg(0);
        }
        
      } catch (error) {
        console.error('Error al eliminar imagen:', error);
        alert('Error al eliminar la imagen');
      }
    } else if (currentImage.type === 'new') {
      // Eliminar imagen nueva del estado local
      const updatedNewImages = newImages.filter((_, index) => index !== currentImage.index);
      setNewImages(updatedNewImages);
      
      // Ajustar currentImg
      const totalImages = portfolio.length + updatedNewImages.length;
      if (currentImg >= totalImages && totalImages > 0) {
        setCurrentImg(totalImages - 1);
      } else if (totalImages === 0) {
        setCurrentImg(0);
      }
    }
  };

  // Guardar cambios
  const handleSave = async () => {
    if (!onSave) return;
    
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('bio', bio);
      formData.append('availability', availability);
      formData.append('price_policy', pricePolicy);
      
      // Agregar estilos y idiomas como JSON strings
      formData.append('styles', JSON.stringify(styles));
      formData.append('languages', JSON.stringify(languages));
      
      // Agregar nuevas imágenes de portafolio
      newImages.forEach(img => {
        formData.append('portfolio_images', img.file);
      });
      
      // Agregar imagen de perfil si se cambió
      if (profileImage) {
        formData.append('profile_image', profileImage);
      }
      
      await onSave(formData);
      
      // Limpiar estado después de guardar exitosamente
      setNewImages([]);
      setProfileImage(null);
      setProfileImagePreview(null);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  // Cancelar edición
  const handleCancel = () => {
    // Restaurar estados originales
    setBio(artist.bio || '');
    setStyles(artist.styles || []);
    setLanguages(artist.languages || []);
    setAvailability(artist.availability !== undefined ? artist.availability : true);
    setPricePolicy(artist.price_policy || '');
    setPortfolio(artist.portfolio || []);
    setNewImages([]);
    setProfileImage(null);
    setProfileImagePreview(null);
    setCurrentImg(0);
    setIsEditing(false);
  };

  // Manejar clicks en estadísticas para mostrar modales
  const handleFollowersClick = () => {
    if (artist?.followers > 0) {
      setShowFollowersModal(true);
    }
  };

  // Renderizar estrellas
  const renderStars = (rating = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= Math.floor(rating) ? 'filled' : ''}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  // Obtener todas las imágenes para el carrusel
  const getAllImages = () => {
    const existingImages = portfolio.map(img => ({
      type: 'existing',
      src: `http://localhost:5000/${img.image_path}`,
      id: img.id
    }));
    
    const newImagesForCarousel = newImages.map((img, index) => ({
      type: 'new',
      src: img.preview,
      index
    }));
    
    return [...existingImages, ...newImagesForCarousel];
  };

  // ========== VISTA EDICIÓN ==========
  if (isOwnProfile && isEditing) {
    const allImages = getAllImages();

    return (
      <div className="artist-portfolio-container">
        <div className="artist-portfolio-profile">
          <div className="portfolio-header">
            <div className="artist-avatar-section">
              <div 
                className="artist-avatar editable-avatar"
                onClick={() => fileInputRef.current?.click()}
                title="Hacer click para cambiar foto de perfil"
              >
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt={artist?.username || 'Usuario'}
                  />
                ) : artist?.profile_image ? (
                  <img
                    src={`http://localhost:5000/${artist.profile_image}`}
                    alt={artist?.username || 'Usuario'}
                  />
                ) : (
                  <CircleUserRound size={60} />
                )}
                <div className="camera-overlay">
                  <Camera size={20} />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleProfileImageChange}
              />
              
              <div className="avatar-rating">
                <span className="rating-number">{artist?.rating || 0}</span>
                <div className="stars">
                  {renderStars(artist?.rating || 0)}
                </div>
              </div>
            </div>
            
            <div className="portfolio-artist-info">
              <div className="portfolio-main-info">
                <div className="artist-header-row">
                  <h1 className="portfolio-artist-name">{artist?.username || 'Usuario'}</h1>
                  {!isOwnProfile && (
                    <>
                      <button
                        className={`btn-follow ${actionLoading.follow ? 'btn-loading' : ''}`}
                        onClick={onFollow}
                        disabled={actionLoading.follow}
                      >
                        {actionLoading.follow ? 'Procesando...' : (isFollowing ? 'Siguiendo' : 'Seguir')}
                      </button>
                      <button
                        className="btn-favorite"
                        onClick={onFavorite}
                        disabled={actionLoading.favorite}
                        title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                      >
                        {isFavorite
                          ? <Star size={26} fill="#FFD700" stroke="#FFD700" />
                          : <Star size={26} stroke="#FFD700" />}
                      </button>
                    </>
                  )}
                </div>
                
                <div className="portfolio-artist-stats-line">
                  <span 
                    className={artist?.followers > 0 ? 'stat-clickable' : ''}
                    onClick={handleFollowersClick}
                  >
                    <strong>{artist?.followers || 0}</strong> Seguidores
                  </span>
                  <span
                    className={artist?.following > 0 ? 'stat-clickable' : ''}
                    onClick={() => artist?.following > 0 && setShowMyFollowingModal(true)}
                  >
                    <strong>{artist?.following || 0}</strong> Seguidos
                  </span>
                  <span><strong>{artist?.sales || 0}</strong> Ventas</span>
                  <span><strong>{artist?.purchases || 0}</strong> Compras</span>
                  <span
                    className={artist?.favorites > 0 ? 'stat-clickable' : ''}
                    onClick={() => setShowMyFavoritesModal(true)}
                  >
                    <strong>{artist?.favorites || 0}</strong> Favoritos
                  </span>
                  <span><strong>{artist?.reviews || 0}</strong> Reseñas</span>
                </div>

                <div className="portfolio-artist-styles-section">
                  <span className="style-tag-title">Estilos:</span>
                  {styles.slice(0, 3).map((style, idx) => (
                    <span className="style-tag-type" key={idx}>
                      {style}
                      <button className="remove-style-btn" onClick={() => handleRemoveStyle(style)}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  {styles.length > 3 && (
                    <span className="style-more">+{styles.length - 3}</span>
                  )}
                  <select 
                    className="add-style-select"
                    onChange={e => { 
                      if (e.target.value) {
                        handleAddStyle(e.target.value); 
                        e.target.value = ''; 
                      }
                    }}
                  >
                    <option value="">+ Agregar</option>
                    {allStyles.filter(s => !styles.includes(s.name)).map((style, idx) => (
                      <option key={idx} value={style.name}>{style.name}</option>
                    ))}
                  </select>
                </div>

                <div className="portfolio-artist-description">
                  <span className="portfolio-section-title">Descripción:</span>
                  <div className="artist-description">
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value.substring(0, 120))}
                      placeholder="Escribe una descripción sobre ti (máx. 120 caracteres)..."
                      maxLength={120}
                    />
                    <div className="char-counter">{bio.length}/120</div>
                  </div>
                </div>
              </div>

              <div className="portfolio-artist-actions">
                <button 
                  className="btn-secondary" 
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>

          <div className="artist-body">
            <div className="portfolio-section">
              {allImages.length > 0 ? (
                <div className="portfolio-carousel">
                  {allImages.length > 1 && (
                    <button onClick={handlePrev} className="carousel-btn prev-btn">
                      <CircleArrowLeft size={28} />
                    </button>
                  )}
                  <img
                    src={allImages[currentImg]?.src}
                    alt={`Portfolio ${currentImg + 1}`}
                    className="portfolio-image"
                  />
                  {allImages.length > 1 && (
                    <button onClick={handleNext} className="carousel-btn next-btn">
                      <CircleArrowRight size={28} />
                    </button>
                  )}
                  <button
                    className="remove-image-btn"
                    onClick={handleRemoveImage}
                    title="Eliminar imagen"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="empty-portfolio">
                  <p>No hay imágenes en el portafolio</p>
                </div>
              )}
              
              {allImages.length < 6 && (
                <label className="add-portfolio-btn" title="Agregar imagen">
                  <Plus size={24} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={handleAddPortfolioImage} 
                  />
                </label>
              )}
            </div>

            <div className="sidebar">
              <div className="sidebar-item">
                <span className="portfolio-section-title">Estado:</span>
                <button
                  className={`status-btn ${availability ? 'available' : 'unavailable'}`}
                  onClick={() => setAvailability(!availability)}
                >
                  {availability ? 'Disponible' : 'No disponible'}
                  <span className={`status-dot ${availability ? 'available' : 'unavailable'}`}></span>
                </button>
              </div>

              <div className="sidebar-item">
                <span className="portfolio-section-title">Idioma:</span>
                <div className="languages-edit">
                  {languages.map((lang, idx) => (
                    <span key={idx} className="language-tag">
                      {lang}
                      <button onClick={() => handleRemoveLanguage(lang)}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  <select 
                    onChange={e => { 
                      if (e.target.value) {
                        handleAddLanguage(e.target.value); 
                        e.target.value = ''; 
                      }
                    }}
                  >
                    <option value="">+ Agregar</option>
                    {allLanguages.filter(l => !languages.includes(l.name)).map((lang, idx) => (
                      <option key={idx} value={lang.name}>{lang.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sidebar-item">
                <span className="portfolio-section-title">Como manejo mis precios:</span>
                <textarea
                  value={pricePolicy}
                  onChange={e => setPricePolicy(e.target.value.substring(0, 300))}
                  placeholder="Describe tu política de precios (máx. 300 caracteres)..."
                  maxLength={300}
                />
                <div style={{color: '#999', fontSize: '12px', textAlign: 'right', marginTop: '4px'}}>
                  {pricePolicy.length}/300
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modales para modo edición */}
        <UserListModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          artistId={artist?.id}
          type="followers"
          title="Seguidores"
        />
        <UserListModal
          isOpen={showMyFavoritesModal}
          onClose={() => setShowMyFavoritesModal(false)}
          type="my-favorites"
          title="Favoritos"
        />
        <UserListModal
          isOpen={showMyFollowingModal}
          onClose={() => setShowMyFollowingModal(false)}
          type="my-following"
          title="Seguidos"
        />
      </div>
    );
  }

  // ========== VISTA SOLO LECTURA ==========
  return (
    <div className="artist-portfolio-container">
      <div className="artist-portfolio-profile">
        <div className="portfolio-header">
          <div className="artist-avatar-section">
            <div className="artist-avatar">
              {artist?.profile_image ? (
                <img
                  src={`http://localhost:5000/${artist.profile_image}`}
                  alt={artist?.username || 'Usuario'}
                />
              ) : (
                <CircleUserRound size={60} />
              )}
            </div>
            
            <div className="avatar-rating">
              <span className="rating-number">{artist?.rating || 0}</span>
              <div className="stars">
                {renderStars(artist?.rating || 0)}
              </div>
            </div>
          </div>
          
          <div className="portfolio-artist-info">
            <div className="portfolio-main-info">
              <div className="artist-header-row">
                <h1 className="portfolio-artist-name">{artist?.username || 'Usuario'}</h1>
                {!isOwnProfile && (
                  <>
                    <button
                      className={`btn-follow ${actionLoading.follow ? 'btn-loading' : ''}`}
                      onClick={onFollow}
                      disabled={actionLoading.follow}
                    >
                      {actionLoading.follow ? 'Procesando...' : (isFollowing ? 'Siguiendo' : 'Seguir')}
                    </button>
                    <button
                      className="btn-favorite"
                      onClick={onFavorite}
                      disabled={actionLoading.favorite}
                      title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                    >
                      {isFavorite
                        ? <Star size={26} fill="#FFD700" stroke="#FFD700" />
                        : <Star size={26} stroke="#FFD700" />}
                    </button>
                  </>
                )}
              </div>
              
              <div className="portfolio-artist-stats-line">
                <span 
                  className={artist?.followers > 0 ? 'stat-clickable' : ''}
                  onClick={handleFollowersClick}
                >
                  <strong>{artist?.followers || 0}</strong> Seguidores
                </span>
                <span
                  className={artist?.following > 0 ? 'stat-clickable' : ''}
                  onClick={() => artist?.following > 0 && setShowMyFollowingModal(true)}
                >
                  <strong>{artist?.following || 0}</strong> Seguidos
                </span>
                <span><strong>{artist?.sales || 0}</strong> Ventas</span>
                <span><strong>{artist?.purchases || 0}</strong> Compras</span>
                <span
                  className={artist?.favorites > 0 ? 'stat-clickable' : ''}
                  onClick={() => setShowMyFavoritesModal(true)}
                >
                  <strong>{artist?.favorites || 0}</strong> Favoritos
                </span>
                <span><strong>{artist?.reviews || 0}</strong> Reseñas</span>
              </div>
              
              <div className="portfolio-artist-styles-section">
                <span className="style-tag-title">Estilos:</span>
                {(artist?.styles || []).slice(0, 3).map((style, idx) => (
                  <span className="style-tag-type" key={idx}>{style}</span>
                ))}
                {(artist?.styles || []).length > 3 && (
                  <span className="style-more">+{(artist?.styles || []).length - 3}</span>
                )}
              </div>
              
              <div className="portfolio-artist-description">
                <span className="portfolio-section-title">Descripción:</span> {
                  artist?.bio || 'Agrega una descripción sobre ti aquí...'
                }
              </div>
            </div>
            
            <div className="portfolio-artist-actions">
              {isOwnProfile ? (
                <button className="btn-edit" onClick={() => setIsEditing(true)}>
                  <Edit2 size={16} />
                  Editar
                </button>
              ) : (
                <button 
                  className={`btn-order ${!artist?.availability ? 'btn-disabled' : ''}`}
                  onClick={artist?.availability ? onOrder : null}
                  disabled={!artist?.availability}
                  title={!artist?.availability ? 'El artista no está disponible' : 'Hacer pedido'}
                >
                  {!artist?.availability ? 'NO DISPONIBLE' : 'HACER PEDIDO'}
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="artist-body">
          <div className="portfolio-section">
            {artist?.portfolio && artist.portfolio.length > 0 ? (
              <div className="portfolio-carousel">
                {artist.portfolio.length > 1 && (
                  <button onClick={handlePrev} className="carousel-btn prev-btn">
                    <CircleArrowLeft size={28} />
                  </button>
                )}
                <div className="portfolio-slide-track">
                  {artist.portfolio.map((img, idx) => (
                    <img
                      key={img.id}
                      src={`http://localhost:5000/${img.image_path}`}
                      alt={`Portfolio ${idx + 1}`}
                      className={`portfolio-image${currentImg === idx ? ' active' : ''}`}
                      style={{
                        transform: `translateX(${(idx - currentImg) * 100}%)`
                      }}
                    />
                  ))}
                </div>
                {artist.portfolio.length > 1 && (
                  <button onClick={handleNext} className="carousel-btn next-btn">
                    <CircleArrowRight size={28} />
                  </button>
                )}
              </div>
            ) : (
              <div className="empty-portfolio">
                <p>No hay imágenes en el portafolio</p>
              </div>
            )}
          </div>
          
          <div className="sidebar">
            <div className="sidebar-item">
              <span className="portfolio-section-title">Estado:</span>
              <div className={`status-info ${artist?.availability ? 'available' : 'unavailable'}`}>
                {artist?.availability ? 'Disponible' : 'No disponible'}
                <span className={`status-dot ${artist?.availability ? 'available' : 'unavailable'}`}></span>
              </div>
            </div>

            <div className="sidebar-item">
              <span className="portfolio-section-title">Idioma:</span>
              <ul className="language-list">
                {(artist?.languages || []).slice(0, 4).map((lang, idx) => (
                  <li key={idx}>{lang}</li>
                ))}
                {(artist?.languages || []).length > 4 && (
                  <li>+{(artist?.languages || []).length - 4} más</li>
                )}
                {(!artist?.languages || artist.languages.length === 0) && (
                  <li style={{ color: '#999', fontStyle: 'italic' }}>Sin idiomas especificados</li>
                )}
              </ul>
            </div>

            <div className="sidebar-item">
              <span className="portfolio-section-title">Como manejo mis precios:</span>
              <ul className="price-policy-list">
                {artist?.price_policy ? (
                  artist.price_policy.substring(0, 300).split('\n').map((line, idx) => (
                    line.trim() && <li key={idx}>{line}</li>
                  ))
                ) : (
                  <li style={{ color: '#999', fontStyle: 'italic' }}>Sin política de precios definida</li>
                )}
                {(artist?.price_policy || '').length > 300 && (
                  <li style={{ color: '#999', fontStyle: 'italic' }}>...</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Modales */}
        <UserListModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          artistId={artist?.id}
          type="followers"
          title="Seguidores"
        />
        <UserListModal
          isOpen={showMyFavoritesModal}
          onClose={() => setShowMyFavoritesModal(false)}
          type="my-favorites"
          title="Favoritos"
        />
        <UserListModal
          isOpen={showMyFollowingModal}
          onClose={() => setShowMyFollowingModal(false)}
          type="my-following"
          title="Seguidos"
        />
      </div>
    </div>
  );
};

export default ArtistPortfolio;