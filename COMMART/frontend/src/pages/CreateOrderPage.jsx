import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createOrder } from '../services/orderService';
import { getArtistPackages, getArtistExtras } from '../services/packageService'; 
import { useUser } from '../context/UserContext';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import ArtistPackages from '../components/ArtistPackages';
import { Trash2, CirclePlus, X } from 'lucide-react';
import { formatColombianPrice } from '../utils/priceFormatter';
import '../styles/createorder.css';

const CreateOrderPage = () => {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const { profile } = useUser();
  const [artist, setArtist] = useState(null);
  const [packages, setPackages] = useState([]);
  const [extras, setExtras] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef();

  // Límite de caracteres para descripción detallada
  const DESCRIPTION_LIMIT = 800;

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        // Obtener datos del artista
        const artistRes = await axios.get(
          `http://localhost:5000/api/auth/artist/${artistId}`,
          { withCredentials: true }
        );
        setArtist(artistRes.data);

        // Obtener paquetes y extras del artista
        try {
          const [packagesData, extrasData] = await Promise.all([
            getArtistPackages(artistId),
            getArtistExtras(artistId)
          ]);
          
          setPackages(packagesData || []);
          setExtras(extrasData || []);
          
          // Seleccionar el primer paquete por defecto si existe
          if (packagesData && packagesData.length > 0) {
            setSelectedPackage(packagesData[0]);
          }
        } catch (packageError) {
          console.log('No se pudieron cargar los paquetes o extras:', packageError);
          setPackages([]);
          setExtras([]);
        }
        
      } catch (error) {
        console.error('Error al cargar datos del artista:', error);
        setErrors({ general: 'Error al cargar los datos del artista' });
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [artistId]);

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setErrors(prev => ({ ...prev, package: '' }));
  };

  const handleSelectExtra = (extra) => {
    setSelectedExtras(prev => {
      const isSelected = prev.find(e => e.id === extra.id);
      if (isSelected) {
        return prev.filter(e => e.id !== extra.id);
      } else {
        return [...prev, extra];
      }
    });
  };

  const calculateTotalPrice = () => {
    const packagePrice = selectedPackage ? parseFloat(selectedPackage.price) : 0;
    const extrasPrice = selectedExtras.reduce((sum, extra) => sum + parseFloat(extra.price), 0);
    return packagePrice + extrasPrice;
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    if (value.length <= DESCRIPTION_LIMIT) {
      setDescription(value);
    }
  };

  const getCharacterCountClass = () => {
    const remaining = DESCRIPTION_LIMIT - description.length;
    if (remaining < 50) return 'create-order-character-count over-limit';
    if (remaining < 100) return 'create-order-character-count warning';
    return 'create-order-character-count';
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) {
      setErrors(prev => ({ ...prev, images: 'Máximo 3 imágenes de referencia' }));
      return;
    }
    setImages(prev => [...prev, ...files]);
    setErrors(prev => ({ ...prev, images: '' }));
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    if (images.length === 1) {
      setErrors(prev => ({ ...prev, images: 'Al menos una imagen de referencia es requerida' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedPackage) {
      newErrors.package = 'Selecciona un paquete';
    }

    if (!description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    } else if (description.trim().length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres';
    }

    if (images.length === 0) {
      newErrors.images = 'Al menos una imagen de referencia es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShowPreview = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setShowPreview(true);
  };

  const handleConfirmOrder = async () => {
    setSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append('artist_id', artistId);
      formData.append('package_id', selectedPackage.id);
      formData.append('total_price', calculateTotalPrice());
      formData.append('description', description.trim());
      
      if (selectedExtras.length > 0) {
        formData.append('extras', JSON.stringify(selectedExtras.map(e => e.id)));
      }
      
      images.forEach(img => {
        formData.append('reference_images', img);
      });

      await createOrder(formData);
      navigate('/orders', { 
        state: { message: 'Pedido enviado correctamente al artista' }
      });
    } catch (error) {
      setErrors({ 
        general: error.response?.data?.message || 'Error al enviar el pedido' 
      });
      setShowPreview(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <MainNav />
        <main className="main-content">
          <div className="create-order-loading-container">Cargando...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (!artist) {
    return (
      <>
        <MainNav />
        <main className="main-content">
          <div className="create-order-error-container">Artista no encontrado</div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <MainNav />
      <main className="main-content">
        <div className="create-order-page-container">
          {/* Header con nombre y foto del artista */}
          <div className="create-order-header-section">
            <h1 className="create-order-title">
              Realizar pedido a{' '}
              <span className="create-order-artist-name">
                <img
                  src={artist?.profile_image ? `http://localhost:5000/${artist.profile_image}` : '/default-profile.jpg'}
                  alt={artist?.username}
                  className="create-order-artist-avatar"
                />
                {artist?.username}
              </span>
            </h1>
          </div>

          <div className="create-order-main-card">
            <div className="create-order-logo-section">
              <img src="/src/assets/LogoCOMMART.png" alt="COMMART" className="create-order-logo" />
              <h2 className="create-order-subtitle">Solicitud de Pedido</h2>
            </div>

            {/* Mostrar errores generales */}
            {errors.general && (
              <div className="create-order-general-error">{errors.general}</div>
            )}

            {/* Si no hay paquetes, mostrar mensaje y no permitir pedido */}
            {packages.length === 0 ? (
              <div className="create-order-no-packages-message">
                <p>Este artista no tiene paquetes disponibles en este momento.</p>
                <button type="button" className="create-order-back-btn" onClick={() => navigate(-1)}>
                  Volver
                </button>
              </div>
            ) : (
              <form onSubmit={handleShowPreview} className="create-order-form">
                {/* Selección de paquetes */}
                <div className="create-order-form-section">
                  <label className="create-order-section-label">
                    1. Selecciona uno de los paquetes del artista <span className="create-order-required">*</span>
                  </label>
                  <div className="create-order-packages-container">
                    <ArtistPackages
                      isPublicView={true}
                      artistId={artistId}
                      initialPackages={packages}
                      selectionMode={true}
                      selectedPackage={selectedPackage}
                      onPackageSelect={handleSelectPackage}
                      showExtras={false}
                    />
                  </div>
                  {errors.package && <div className="create-order-field-error">{errors.package}</div>}
                </div>

                {/* Descripción */}
                <div className="create-order-form-section">
                  <label className="create-order-section-label">
                    2. Descripción de la ilustración <span className="create-order-required">*</span>
                  </label>
                  <div className="create-order-description-container">
                    <textarea
                      className="create-order-description-textarea"
                      value={description}
                      onChange={handleDescriptionChange}
                      placeholder="Describe detalladamente el dibujo que deseas: estilo, colores, pose, expresión, fondo, elementos específicos, etc."
                      maxLength={DESCRIPTION_LIMIT}
                    />
                    <div className={getCharacterCountClass()}>
                      {description.length}/{DESCRIPTION_LIMIT} caracteres
                    </div>
                  </div>
                  {errors.description && <div className="create-order-field-error">{errors.description}</div>}
                </div>

                {/* Imágenes de referencia */}
                <div className="create-order-form-section">
                  <label className="create-order-section-label">
                    3. Añade imágenes de referencia <span className="create-order-required">*</span>
                  </label>
                  <p className="create-order-field-note">
                    <strong>Importante:</strong> Al menos una imagen de referencia es requerida para procesar tu pedido.
                  </p>
                  <div className="create-order-images-upload-area">
                    {images.map((img, index) => (
                      <div className="create-order-image-preview" key={index}>
                        <img src={URL.createObjectURL(img)} alt="Referencia" />
                        <button 
                          className="create-order-remove-image-btn" 
                          onClick={() => handleRemoveImage(index)}
                          title="Eliminar imagen"
                          type="button"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {images.length < 3 && (
                      <div className="create-order-add-image-area" onClick={() => fileInputRef.current?.click()}>
                        <CirclePlus size={48} className="create-order-add-image-icon" />
                        <span className="create-order-add-image-text">Agregar</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="create-order-file-input-hidden"
                          multiple
                          onChange={handleImageChange}
                        />
                      </div>
                    )}
                  </div>
                  {errors.images && <div className="create-order-field-error">{errors.images}</div>}
                </div>

                {/* Sección de Extras */}
                {extras.length > 0 && (
                  <div className="create-order-form-section">
                    <label className="create-order-section-label">4. Selecciona los extras que se acoplen a tu pedido</label>
                    
                    <div className="create-order-extras-info">
                      <p className="create-order-extras-note">
                        <strong>(IMPORTANTE)</strong> Recuerda que los extras son <strong>OPCIONALES</strong>, pero asegúrate de seleccionar aquellos que se ajusten a tu pedido.
                      </p>
                      
                      <div className="create-order-extras-description">
                        <p>Si tu pedido incluye elementos que no están en el paquete base, selecciona los extras adecuados.</p>
                        <p><strong>Ejemplo:</strong> Si has solicitado algo adicional a lo que ofrece el paquete base como por ejemplo personajes o detalles extra, selecciona los extras correspondientes.</p>
                      </div>
                      
                      <ul className="create-order-extras-rules">
                        <li>Si omites los extras necesarios, el artista podrá ajustar el costo según lo solicitado.</li>
                        <li>Los precios de los extras se sumarán al costo base del paquete, por lo que asegúrate de revisar bien las opciones antes de completar tu pedido.</li>
                      </ul>
                    </div>
                    
                    <div className="create-order-extras-container">
                      <div className="create-order-extras-inner">
                        <div className="create-order-extras-header">
                          <h3 className="create-order-extras-title">Extra</h3>
                        </div>
                        
                        <div className="create-order-extras-grid">
                          {extras.map(extra => (
                            <div 
                              key={extra.id}
                              className={`create-order-extra-item ${selectedExtras.find(e => e.id === extra.id) ? 'selected' : ''}`}
                              onClick={() => handleSelectExtra(extra)}
                            >
                              <div className="create-order-extra-content">
                                <span className="create-order-extra-bullet">•</span>
                                <span className="create-order-extra-name">{extra.name}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span className="create-order-extra-price">{formatColombianPrice(extra.price)}</span>
                                {selectedExtras.find(e => e.id === extra.id) && (
                                  <div className="create-order-extra-selected-indicator">✓</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="create-order-form-actions">
                  <button type="button" className="create-order-cancel-btn" onClick={() => navigate(-1)}>
                    Cancelar
                  </button>
                  <button type="submit" className="create-order-submit-btn">
                    Continuar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Modal de vista previa del pedido - DISEÑO SIMILAR A LA IMAGEN */}
        {showPreview && (
          <div className="order-preview-overlay" onClick={(e) => {
            if (e.target.classList.contains('order-preview-overlay')) {
              setShowPreview(false);
            }
          }}>
            <div className="order-preview-modal" onClick={(e) => e.stopPropagation()}>
              {/* Header con logo igual que el formulario */}
              <div className="order-preview-header">
                <img src="/src/assets/LogoCOMMART.png" alt="COMMART" className="order-preview-logo" />
                <h2 className="order-preview-title">Vista Previa del Pedido</h2>
                <button 
                  className="order-preview-close" 
                  onClick={() => setShowPreview(false)}
                  type="button"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="order-preview-content">
                {/* Sección de Referencias */}
                <div className="order-preview-section">
                  <h3 className="order-preview-section-title">Referencias:</h3>
                  <div className="order-preview-references">
                    {images.map((img, index) => (
                      <div key={index} className="order-preview-reference-item">
                        <img 
                          src={URL.createObjectURL(img)} 
                          alt={`Referencia ${index + 1}`}
                          className="order-preview-reference-image"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sección de Paquete y Extras */}
                <div className="order-preview-details-grid">
                  <div className="order-preview-details-left">
                    <div className="order-preview-detail-section">
                      <h4 className="order-preview-detail-title">Paquete:</h4>
                      <div className="order-preview-package-info">
                        <span className="order-preview-package-name">{selectedPackage?.title}</span>
                        <button className="order-preview-view-package-btn">Ver paquete</button>
                      </div>
                    </div>

                    {selectedExtras.length > 0 && (
                      <div className="order-preview-detail-section">
                        <h4 className="order-preview-detail-title">Extras:</h4>
                        <div className="order-preview-extras-list">
                          {selectedExtras.map(extra => (
                            <div key={extra.id} className="order-preview-extra-item">
                              <span>{extra.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="order-preview-details-right">
                    <div className="order-preview-price-section">
                      <h4 className="order-preview-price-title">Valor de la obra:</h4>
                      <div className="order-preview-price-note">Generado automáticamente</div>
                      <div className="order-preview-price-breakdown">
                        <div className="order-preview-price-item">
                          <span>{selectedPackage?.title}</span>
                          <span className="order-preview-price-badge">{formatColombianPrice(selectedPackage?.price)}</span>
                        </div>
                        {selectedExtras.map(extra => (
                          <div key={extra.id} className="order-preview-price-item">
                            <span>{extra.name}</span>
                            <span className="order-preview-price-badge">{formatColombianPrice(extra.price)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="order-preview-total-price">
                        <span className="order-preview-total-badge">{formatColombianPrice(calculateTotalPrice())}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div className="order-preview-section">
                  <h3 className="order-preview-section-title">Descripción:</h3>
                  <div className="order-preview-description-box">
                    {description}
                  </div>
                </div>

                {/* Mensaje informativo */}
                <div className="order-preview-info-message">
                  Antes de enviar, revisa que toda la información de tu pedido sea correcta.
                </div>

                {/* Botones de acción */}
                <div className="order-preview-actions">
                  <button 
                    className="order-preview-cancel" 
                    onClick={() => setShowPreview(false)}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <button 
                    className="order-preview-confirm" 
                    onClick={handleConfirmOrder}
                    disabled={submitting}
                    type="button"
                  >
                    {submitting ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default CreateOrderPage;