import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createOrder } from '../services/orderService';
import { getArtistPackages } from '../services/packageService'; 
import { useUser } from '../context/UserContext';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import '../styles/createorderpage.css';

const CreateOrderPage = () => {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const { profile } = useUser();
  const [artist, setArtist] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [description, setDescription] = useState('');
  const [referenceImages, setReferenceImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef();

  useEffect(() => {
    const fetchArtistData = async () => {
      try {
        // Obtener datos del artista
        const artistRes = await axios.get(
          `http://localhost:5000/api/auth/artist/${artistId}`,
          { withCredentials: true }
        );
        setArtist(artistRes.data);

        // Obtener paquetes del artista
        try {
          const packagesData = await getArtistPackages(artistId);
          setPackages(packagesData || []);
          
          // Seleccionar el primer paquete por defecto si existe
          if (packagesData && packagesData.length > 0) {
            setSelectedPackage(packagesData[0]);
          }
        } catch (packageError) {
          console.log('No se pudieron cargar los paquetes:', packageError);
          setPackages([]); // Sin paquetes disponibles
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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (referenceImages.length + files.length > 3) {
      setErrors(prev => ({ ...prev, images: 'Máximo 3 imágenes de referencia' }));
      return;
    }
    setReferenceImages(prev => [...prev, ...files]);
    setErrors(prev => ({ ...prev, images: '' }));
    e.target.value = '';
  };

  const handleRemoveImage = (idx) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== idx));
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const formData = new FormData();
      formData.append('artist_id', artistId);
      formData.append('package_id', selectedPackage.id);
      formData.append('total_price', selectedPackage.price);
      formData.append('description', description.trim());
      
      referenceImages.forEach(img => {
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
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <MainNav />
        <main className="main-content">
          <div className="loading-container">Cargando...</div>
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
          <div className="error-container">Artista no encontrado</div>
        </main>
        <Footer />
      </>
    );
  }

  // Si no hay paquetes, mostrar mensaje y no permitir pedido
  if (packages.length === 0) {
    return (
      <>
        <MainNav />
        <main className="main-content">
          <div className="create-order-container">
            <div className="order-header-section">
              <h1 className="order-title">
                Realizar pedido a <span className="artist-name">@{artist.username}</span>
              </h1>
            </div>
            
            <div className="order-card">
              <div className="order-logo-section">
                <img src="/src/assets/LogoCOMMART.png" alt="COMMART" className="order-logo" />
                <h2 className="order-subtitle">Solicitud de Pedido</h2>
              </div>
              
              <div className="no-packages-message">
                <p>Este artista no tiene paquetes disponibles en este momento.</p>
                <button 
                  type="button" 
                  className="back-btn"
                  onClick={() => navigate(-1)}
                >
                  Volver
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <MainNav />
      <main className="main-content">
        <div className="create-order-container">
          <div className="order-header-section">
            <h1 className="order-title">
              Realizar pedido a <span className="artist-name">@{artist.username}</span>
            </h1>
          </div>
          
          <div className="order-card">
            <div className="order-logo-section">
              <img src="/src/assets/LogoCOMMART.png" alt="COMMART" className="order-logo" />
              <h2 className="order-subtitle">Solicitud de Pedido</h2>
            </div>

            {errors.general && (
              <div className="field-error">{errors.general}</div>
            )}

            <form onSubmit={handleSubmit} className="order-form">
              {/* Selección de paquetes */}
              <div className="form-section">
                <label className="section-label">1. Selecciona uno de los paquetes del artista</label>
                
                <div className="packages-grid">
                  {packages.map(pkg => (
                    <div
                      key={pkg.id}
                      className={`package-card ${selectedPackage?.id === pkg.id ? 'selected' : ''}`}
                      onClick={() => handleSelectPackage(pkg)}
                    >
                      <div className="package-header">
                        <span className="package-name">{pkg.name}</span>
                        <span className="package-badge">Online</span>
                      </div>
                      
                      <div className="package-content">
                        <div className="package-price">Precio<br/>${pkg.price}</div>
                        
                        <div className="package-features">
                          {pkg.features && pkg.features.map((feature, idx) => (
                            <div key={idx} className="feature-item">• {feature}</div>
                          ))}
                        </div>
                        
                        <div className="package-samples">
                          <span className="samples-label">Muestra</span>
                          {pkg.sample_images && pkg.sample_images.length > 0 ? (
                            <div className="samples-grid">
                              {pkg.sample_images.slice(0, 2).map((img, idx) => (
                                <img 
                                  key={idx}
                                  src={`http://localhost:5000/${img}`} 
                                  alt={`Muestra ${idx + 1}`}
                                  className="sample-image"
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="no-samples">Sin muestras</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {errors.package && (
                  <div className="field-error">{errors.package}</div>
                )}
              </div>

              {/* Descripción */}
              <div className="form-section">
                <label className="section-label">2. Descripción de la ilustración</label>
                <textarea
                  className={`description-textarea ${errors.description ? 'error' : ''}`}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (errors.description) {
                      setErrors(prev => ({ ...prev, description: '' }));
                    }
                  }}
                  placeholder="Quiero un dibujo de mi personaje animado..."
                />
                {errors.description && (
                  <div className="field-error">{errors.description}</div>
                )}
              </div>

              {/* Imágenes de referencia */}
              <div className="form-section">
                <label className="section-label">3. Añade imágenes de referencia</label>
                <div className="images-upload-area">
                  {referenceImages.map((img, idx) => (
                    <div className="image-preview" key={idx}>
                      <img src={URL.createObjectURL(img)} alt="Referencia" />
                      <button 
                        type="button" 
                        className="remove-image-btn" 
                        onClick={() => handleRemoveImage(idx)}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                  
                  {referenceImages.length < 3 && (
                    <div className="add-image-area" onClick={() => fileInputRef.current?.click()}>
                      <div className="add-image-icon">+</div>
                      <span>Agregar</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        ref={fileInputRef}
                        onChange={handleImageChange}
                      />
                    </div>
                  )}
                </div>
                
                {errors.images && (
                  <div className="field-error">{errors.images}</div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="continue-button"
                  disabled={submitting}
                >
                  {submitting ? 'Enviando...' : 'Continuar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default CreateOrderPage;