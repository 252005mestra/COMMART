import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createOrder } from '../services/orderService';
import { getArtistPackages } from '../services/packageService'; 
import { useUser } from '../context/UserContext';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import ArtistPackages from '../components/ArtistPackages';
import { Trash2, CirclePlus } from 'lucide-react';
import '../styles/createorder.css';

const CreateOrderPage = () => {
  const { artistId } = useParams();
  const navigate = useNavigate();
  const { profile } = useUser();
  const [artist, setArtist] = useState(null);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef();

  // Límite de caracteres para descripción detallada
  const DESCRIPTION_LIMIT = 800; // Suficiente para descripción muy detallada

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

            {/* Si no hay paquetes, mostrar mensaje y no permitir pedido */}
            {packages.length === 0 ? (
              <div className="create-order-no-packages-message">
                <p>Este artista no tiene paquetes disponibles en este momento.</p>
                <button type="button" className="create-order-back-btn" onClick={() => navigate(-1)}>
                  Volver
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="create-order-form">
                {/* Selección de paquetes */}
                <div className="create-order-form-section">
                  <label className="create-order-section-label">1. Selecciona uno de los paquetes del artista</label>
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
                  <label className="create-order-section-label">2. Descripción de la ilustración</label>
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
                  <label className="create-order-section-label">3. Añade imágenes de referencia</label>
                  <div className="create-order-images-upload-area">
                    {images.map((img, index) => (
                      <div className="create-order-image-preview" key={index}>
                        <img src={URL.createObjectURL(img)} alt="Referencia" />
                        <button 
                          className="create-order-remove-image-btn" 
                          onClick={() => handleRemoveImage(index)}
                          title="Eliminar imagen"
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

                <div className="create-order-form-actions">
                  <button type="button" className="create-order-cancel-btn" onClick={() => navigate(-1)}>
                    Cancelar
                  </button>
                  <button type="submit" className="create-order-submit-btn" disabled={submitting}>
                    {submitting ? 'Enviando...' : 'Continuar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default CreateOrderPage;