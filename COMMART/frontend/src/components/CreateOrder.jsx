import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createOrder } from '../services/orderService';
import axios from 'axios';
import '../styles/createorder.css';

const DUMMY_PACKAGES = [
  {
    id: 1,
    name: 'Básico',
    price: 10,
    features: ['1 personaje', 'Ilustración sencilla', '1 corrección incluida', 'Formato JPG/PNG'],
  },
  {
    id: 2,
    name: 'Estándar',
    price: 20,
    features: ['2 personajes', 'Ilustración media', '3 correcciones incluidas', 'Formato JPG/PNG'],
  },
  {
    id: 3,
    name: 'Premium',
    price: 30,
    features: ['3+ personajes', 'Ilustración detallada', '5 correcciones incluidas', 'Formato alta calidad'],
  },
];

const CreateOrder = ({ artistId, onClose, onOrderCreated }) => {
  const navigate = useNavigate();
  const [artist, setArtist] = useState(null);
  const [packages] = useState(DUMMY_PACKAGES);
  const [selectedPackage, setSelectedPackage] = useState(DUMMY_PACKAGES[0]);
  const [description, setDescription] = useState('');
  const [referenceImages, setReferenceImages] = useState([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  // Obtener datos del artista
  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/auth/artist/${artistId}`);
        setArtist(res.data);
      } catch (err) {
        console.error('Error al cargar artista:', err);
      }
    };
    fetchArtist();
  }, [artistId]);

  const handleSelectPackage = (pkg) => setSelectedPackage(pkg);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setReferenceImages(prev => [...prev, ...files].slice(0, 3));
    e.target.value = '';
  };

  const handleRemoveImage = (idx) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPackage) {
      setError('Selecciona un paquete.');
      return;
    }
    if (!description.trim()) {
      setError('Agrega una descripción.');
      return;
    }
    setError('');
    const formData = new FormData();
    formData.append('artist_id', artistId);
    formData.append('package_id', selectedPackage.id);
    formData.append('total_price', selectedPackage.price);
    formData.append('description', description);
    referenceImages.forEach(img => formData.append('reference_images', img));
    try {
      await createOrder(formData);
      setSuccess('Pedido enviado correctamente');
      setDescription('');
      setReferenceImages([]);
      setTimeout(() => navigate('/orders'), 1500);
    } catch {
      setError('Error al crear el pedido');
    }
  };

  if (!artist) return <div className="loading-order">Cargando...</div>;

  return (
    <div className="order-page-container">
      {/* Header con info del artista */}
      <div className="order-header">
        <div className="order-header-content">
          <span className="order-header-text">Realizar pedido a</span>
          <div className="artist-info-header">
            <img 
              src={artist.profile_image ? `http://localhost:5000/${artist.profile_image}` : '/default-profile.jpg'} 
              alt={artist.username}
              className="artist-avatar-header"
            />
            <span className="artist-name-header">{artist.username}</span>
          </div>
        </div>
      </div>

      {/* Formulario principal */}
      <div className="order-form-container">
        <div className="order-form-card">
          <div className="order-logo">
            <img src="/src/assets/LogoCOMMART.png" alt="COMMART" />
          </div>
          <h2 className="order-form-title">Solicitud de Pedido</h2>

          <form onSubmit={handleSubmit}>
            {/* Selección de paquetes simulados */}
            <div className="order-section">
              <label className="section-label">1. Selecciona uno de los paquetes del artista</label>
              <div className="packages-grid">
                {packages.map(pkg => (
                  <div
                    key={pkg.id}
                    className={`package-card ${selectedPackage?.id === pkg.id ? 'selected' : ''}`}
                    onClick={() => handleSelectPackage(pkg)}
                  >
                    <div className="package-header">
                      <h3 className="package-name">{pkg.name}</h3>
                      <div className="package-price">${pkg.price} USD</div>
                    </div>
                    <div className="package-content">
                      <ul className="package-features">
                        {pkg.features.map((feature, idx) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <div className="order-section">
              <label className="section-label">2. Descripción de la ilustración</label>
              <textarea
                className="description-textarea"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Quiero un dibujo de mi personaje animado..."
                required
              />
            </div>

            {/* Imágenes de referencia */}
            <div className="order-section">
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
                  <div className="add-image-area" onClick={() => fileInputRef.current.click()}>
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
            </div>

            {/* Botones de acción */}
            <div className="form-actions">
              <button type="button" className="cancel-button" onClick={() => navigate(-1)}>
                Cancelar
              </button>
              <button type="submit" className="continue-button">
                Continuar
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOrder;