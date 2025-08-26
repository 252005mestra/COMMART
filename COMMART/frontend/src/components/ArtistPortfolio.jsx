import React, { useState, useRef } from 'react';
import { Edit2, Trash2, Plus, X, Camera, Star, StarOff, CircleUserRound, CircleArrowLeft, CircleArrowRight } from 'lucide-react';
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
  isFavorite = false
}) => {
  const [isEditing, setIsEditing] = useState(false);

  // Estados locales para edición
  const [bio, setBio] = useState(artist?.bio || '');
  const [styles, setStyles] = useState(artist?.styles || []);
  const [languages, setLanguages] = useState(artist?.languages || []);
  const [availability, setAvailability] = useState(artist?.availability || false);
  const [pricePolicy, setPricePolicy] = useState(artist?.price_policy || '');
  const [portfolio, setPortfolio] = useState(artist?.portfolio || []);
  const [newImage, setNewImage] = useState(null);
  const fileInputRef = useRef(null);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);

  // Carrusel
  const [currentImg, setCurrentImg] = useState(0);
  const handlePrev = () => setCurrentImg((currentImg - 1 + portfolio.length) % portfolio.length);
  const handleNext = () => setCurrentImg((currentImg + 1) % portfolio.length);

  // Handlers edición
  const handleAddStyle = (style) => {
    if (style && !styles.includes(style)) setStyles([...styles, style]);
  };
  const handleRemoveStyle = (style) => setStyles(styles.filter(s => s !== style));
  const handleAddLanguage = (lang) => {
    if (lang && !languages.includes(lang)) setLanguages([...languages, lang]);
  };
  const handleRemoveLanguage = (lang) => setLanguages(languages.filter(l => l !== lang));

  // Portafolio
  const handleAddPortfolioImage = (e) => {
    const file = e.target.files[0];
    if (file && portfolio.length < 6) {
      const reader = new FileReader();
      reader.onload = (ev) => setPortfolio([...portfolio, { image_path: ev.target.result, file }]);
      reader.readAsDataURL(file);
      setNewImage(null);
    }
  };
  const handleRemovePortfolioImage = (idx) => setPortfolio(portfolio.filter((_, i) => i !== idx));

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => setProfileImagePreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Guardar cambios
  const handleSave = async () => {
    if (!onSave) return;
    
    const formData = new FormData();
    formData.append('bio', bio);
    formData.append('availability', availability ? 1 : 0);
    formData.append('price_policy', pricePolicy);
    styles.forEach(s => formData.append('styles[]', s));
    languages.forEach(l => formData.append('languages[]', l));
    portfolio.forEach((img, idx) => {
      if (img.file) formData.append('portfolio_images', img.file);
    });
    if (profileImage) formData.append('profile_image', profileImage);

    await onSave(formData);
    setIsEditing(false);
  };

  // Renderiza estrellas de rating
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

  // ========== VISTA EDICIÓN ==========
  if (isOwnProfile && isEditing) {
    return (
      <div className="artist-portfolio-container">
        <div className="artist-portfolio-profile">
          {/* Header con información del artista */}
          <div className="portfolio-header">
            <div className="artist-avatar-section">
              <div 
                className="artist-avatar editable-avatar"
                onClick={() => fileInputRef.current?.click()}
                title="Hacer click para cambiar foto de perfil"
              >
                {profileImagePreview || artist?.profile_image ? (
                  <img
                    src={profileImagePreview || `http://localhost:5000/${artist.profile_image}`}
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
                <span className="rating-number">{artist?.rating || 4}</span>
                <div className="stars">
                  {renderStars(artist?.rating || 4)}
                </div>
              </div>
            </div>
            
            <div className="portfolio-artist-info">
              <div className="portfolio-main-info">
                <h1 className="portfolio-artist-name">{artist?.username || 'Usuario'}</h1>
                
                <div className="portfolio-artist-stats-line">
                  <span><strong>{artist?.followers || 0}</strong> Seguidores</span>
                  <span><strong>{artist?.following || 0}</strong> Seguidos</span>
                  <span><strong>{artist?.sales || 0}</strong> Ventas</span>
                  <span><strong>{artist?.purchases || 0}</strong> Compras</span>
                  <span><strong>{artist?.favorites || 0}</strong> Favoritos</span>
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
                    onChange={e => { handleAddStyle(e.target.value); e.target.value=''; }}
                  >
                    <option value="">+ Agregar</option>
                    {allStyles.filter(s => !styles.includes(s.name)).map((style, idx) => (
                      <option key={idx} value={style.name}>{style.name}</option>
                    ))}
                  </select>
                </div>

                <div className="portfolio-artist-description">
                  <strong>Descripción:</strong>
                  <div className="artist-description">
                    <textarea
                      value={bio}
                      onChange={e => setBio(e.target.value.substring(0, 120))}
                      placeholder="Escribe una descripción (máx. 120 caracteres)..."
                      maxLength={120}
                    />
                    <div className="char-counter">{bio.length}/120</div>
                  </div>
                </div>
              </div>

              <div className="portfolio-artist-actions">
                <button className="btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={handleSave}>
                  Guardar
                </button>
              </div>
            </div>
          </div>

          {/* Body con portfolio y sidebar */}
          <div className="artist-body">
            <div className="portfolio-section">
              {portfolio.length > 0 ? (
                <div className="portfolio-carousel">
                  <button onClick={handlePrev} className="carousel-btn prev-btn">
                    <CircleArrowLeft size={28} />
                  </button>
                  <img
                    src={portfolio[currentImg].image_path}
                    alt={`Portfolio ${currentImg + 1}`}
                    className="portfolio-image"
                  />
                  <button onClick={handleNext} className="carousel-btn next-btn">
                    <CircleArrowRight size={28} />
                  </button>
                  <button
                    className="remove-image-btn"
                    onClick={() => handleRemovePortfolioImage(currentImg)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="empty-portfolio">
                  <p>No hay imágenes en el portafolio</p>
                </div>
              )}
              
              {portfolio.length < 6 && (
                <label className="add-portfolio-btn">
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
                <strong>Estado:</strong>
                <button
                  className={`status-btn ${availability ? 'available' : 'unavailable'}`}
                  onClick={() => setAvailability(!availability)}
                >
                  {availability ? 'Disponible' : 'No disponible'}
                  <span className={`status-dot ${availability ? 'available' : 'unavailable'}`}></span>
                </button>
              </div>

              <div className="sidebar-item">
                <strong>Idioma:</strong>
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
                    onChange={e => { handleAddLanguage(e.target.value); e.target.value=''; }}
                  >
                    <option value="">+ Agregar</option>
                    {allLanguages.filter(l => !languages.includes(l.name)).map((lang, idx) => (
                      <option key={idx} value={lang.name}>{lang.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sidebar-item">
                <strong>Como manejo mis precios:</strong>
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
              <span className="rating-number">{artist?.rating || 4}</span>
              <div className="stars">
                {renderStars(artist?.rating || 4)}
              </div>
            </div>
          </div>
          
          <div className="portfolio-artist-info">
            <div className="portfolio-main-info">
              <h1 className="portfolio-artist-name">{artist?.username || 'Usuario'}</h1>
              
              {!isOwnProfile && (
                <div className="portfolio-follow-favorite-buttons">
                  <button
                    className="btn-secondary"
                    onClick={onFollow}
                  >
                    {isFollowing ? 'Siguiendo' : 'Seguir'}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={onFavorite}
                  >
                    {isFavorite ? '★' : '☆'} Favorito
                  </button>
                </div>
              )}
              
              <div className="portfolio-artist-stats-line">
                <span><strong>{artist?.followers || 0}</strong> Seguidores</span>
                <span><strong>{artist?.following || 0}</strong> Seguidos</span>
                <span><strong>{artist?.sales || 0}</strong> Ventas</span>
                <span><strong>{artist?.purchases || 0}</strong> Compras</span>
                <span><strong>{artist?.favorites || 0}</strong> Favoritos</span>
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
                <strong>Descripción:</strong> {(artist?.bio || artist?.description || 'Hago dibujos de estilo anime y manga, no dibujo realismo ni infantil.').substring(0, 120)}{(artist?.bio || artist?.description || '').length > 120 ? '...' : ''}
              </div>
            </div>
            
            <div className="portfolio-artist-actions">
              {isOwnProfile ? (
                <button className="btn-edit" onClick={() => setIsEditing(true)}>
                  Editar
                </button>
              ) : (
                <button className="btn-order" onClick={onOrder}>
                  HACER PEDIDO
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="artist-body">
          <div className="portfolio-section">
            {artist?.portfolio && artist.portfolio.length > 0 ? (
              <div className="portfolio-carousel">
                <button onClick={handlePrev} className="carousel-btn prev-btn">
                  <CircleArrowLeft size={28} />
                </button>
                <img
                  src={`http://localhost:5000/${artist.portfolio[currentImg].image_path}`}
                  alt={`Portfolio ${currentImg + 1}`}
                  className="portfolio-image"
                />
                <button onClick={handleNext} className="carousel-btn next-btn">
                  <CircleArrowRight size={28} />
                </button>
              </div>
            ) : (
              <div className="empty-portfolio">
                <p>No hay imágenes en el portafolio</p>
              </div>
            )}
          </div>
          <div className="sidebar">
            <div className="sidebar-item">
              <strong>Estado:</strong>
              <div className={`status-info ${artist?.availability ? 'available' : 'unavailable'}`}>
                {artist?.availability ? 'Disponible' : 'No disponible'}
                <span className={`status-dot ${artist?.availability ? 'available' : 'unavailable'}`}></span>
              </div>
            </div>

            <div className="sidebar-item">
              <strong>Idioma:</strong>
              <ul className="language-list">
                {(artist?.languages || []).slice(0, 4).map((lang, idx) => (
                  <li key={idx}>{lang}</li>
                ))}
                {(artist?.languages || []).length > 4 && (
                  <li>+{(artist?.languages || []).length - 4} más</li>
                )}
              </ul>
            </div>

            <div className="sidebar-item">
              <strong>Como manejo mis precios:</strong>
              <ul className="price-policy-list">
                {artist?.price_policy
                  ? artist.price_policy.substring(0, 300).split('\n').map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))
                  : <li>Sin información.</li>
                }
                {(artist?.price_policy || '').length > 300 && (
                  <li style={{ color: '#999', fontStyle: 'italic' }}>...</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistPortfolio;