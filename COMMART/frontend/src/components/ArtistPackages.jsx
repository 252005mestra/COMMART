import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Edit, Trash2, X, CirclePlus } from 'lucide-react';
import { formatColombianPrice, formatPriceInput, parsePrice, parsePriceForDB, isValidPrice } from '../utils/priceFormatter';
import '../styles/artistpackages.css';

const MAX_PACKAGES = 3;
const MAX_EXTRAS = 6;

const ArtistPackages = ({ 
  isPublicView = false, 
  artistId = null, 
  initialPackages = [],
  selectionMode = false,
  selectedPackage = null,
  onPackageSelect = null,
  showExtras = true // NUEVA PROP PARA CONTROLAR LA VISIBILIDAD DE EXTRAS
}) => {
  const [packages, setPackages] = useState([]);
  const [extras, setExtras] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para edición
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editingExtra, setEditingExtra] = useState(null);
  const [showAddExtra, setShowAddExtra] = useState(false);

  // Cargar paquetes y extras solo una vez según la vista
  useEffect(() => {
    if (isPublicView) {
      // Vista pública: usar initialPackages solo al montar
      setPackages(initialPackages || []);
      if (showExtras) {
        fetchExtrasPublic(); // Solo cargar extras si showExtras es true
      }
      setLoading(false);
    } else {
      // Vista privada: cargar desde el backend
      const fetchAll = async () => {
        setLoading(true);
        await fetchPackages();
        if (showExtras) {
          await fetchExtras(); // Solo cargar extras si showExtras es true
        }
        setLoading(false);
      };
      fetchAll();
    }
    // eslint-disable-next-line
  }, [isPublicView, artistId, showExtras]); // Agregar showExtras a las dependencias

  // Vista privada (propia)
  const fetchPackages = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/packages/my', { withCredentials: true });
      setPackages(res.data || []);
    } catch (error) {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  // Vista pública (de otro artista)
  const fetchPackagesPublic = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/packages/artist/${artistId}`);
      setPackages(res.data || []);
    } catch (error) {
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para cargar extras en vista pública
  const fetchExtrasPublic = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/packages/artist/${artistId}/extras`);
      setExtras(res.data || []);
    } catch (error) {
      console.error('Error al cargar extras públicos:', error);
      setExtras([]);
    }
  };

  const fetchExtras = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/packages/my/extras', { 
        withCredentials: true 
      });
      setExtras(res.data || []);
    } catch (error) {
      console.error('Error al cargar extras:', error);
      setExtras([]);
    }
  };

  // Crear o editar paquete
  const handleSavePackage = async (pkg) => {
    try {
      // Si es una eliminación, usar función específica
      if (pkg.delete) {
        await handleDeletePackage(pkg.id);
        return;
      }
      
      const formData = new FormData();
      
      // Convertir precio a número antes de enviar
      const finalPrice = parsePriceForDB(pkg.price.toString());
      
      // Agregar campos del formulario (SIN incluir 'delete')
      Object.entries(pkg).forEach(([key, value]) => {
        if (value !== null && value !== undefined && 
            key !== 'reference_image1' && 
            key !== 'reference_image2' && 
            key !== 'delete') { // EXCLUIR delete
          if (key === 'price') {
            formData.append(key, finalPrice);
          } else {
            formData.append(key, value);
          }
        }
      });
      
      // Agregar archivos
      if (pkg.reference_image1 instanceof File) {
        formData.append('reference_image1', pkg.reference_image1);
      }
      if (pkg.reference_image2 instanceof File) {
        formData.append('reference_image2', pkg.reference_image2);
      }
      
      if (pkg.id) {
        await axios.put(`http://localhost:5000/api/packages/my/${pkg.id}`, formData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('http://localhost:5000/api/packages/my', formData, {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      setEditing(null);
      setShowAdd(false);
      await fetchPackages();
    } catch (error) {
      console.error('Error al guardar paquete:', error);
      alert('Error al guardar el paquete');
    }
  };

  // Eliminar paquete
  const handleDeletePackage = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este paquete?')) {
      try {
        await axios.delete(`http://localhost:5000/api/packages/my/${id}`, { 
          withCredentials: true 
        });
        await fetchPackages();
      } catch (error) {
        console.error('Error al eliminar paquete:', error);
        alert('Error al eliminar el paquete');
      }
    }
  };

  // Crear o editar extra
  const handleSaveExtra = async (extra) => {
    try {
      // Convertir precio a número
      const finalPrice = parsePriceForDB(extra.price.toString());
      const finalExtra = { ...extra, price: finalPrice };
      
      if (extra.id) {
        await axios.put(`http://localhost:5000/api/packages/my/extras/${extra.id}`, finalExtra, { 
          withCredentials: true 
        });
      } else {
        // Asignar al primer paquete si no se especifica
        if (!finalExtra.package_id && packages.length > 0) {
          finalExtra.package_id = packages[0].id;
        }
        
        await axios.post('http://localhost:5000/api/packages/my/extras', finalExtra, { 
          withCredentials: true 
        });
      }
      
      setEditingExtra(null);
      setShowAddExtra(false);
      await fetchExtras();
    } catch (error) {
      console.error('Error al guardar extra:', error);
      alert('Error al guardar el extra');
    }
  };

  // Eliminar extra
  const handleDeleteExtra = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este extra?')) {
      try {
        await axios.delete(`http://localhost:5000/api/packages/my/extras/${id}`, { 
          withCredentials: true 
        });
        await fetchExtras();
      } catch (error) {
        console.error('Error al eliminar extra:', error);
        alert('Error al eliminar el extra');
      }
    }
  };

  if (loading) {
    return <div className="packages-loading">Cargando paquetes...</div>;
  }

  return (
    <div className="artist-packages-section">
      {/* Grid de paquetes */}
      <div className="packages-row">
        {packages.map(pkg => (
          <div 
            className={`artist-package-card ${selectionMode ? 'selectable' : ''} ${selectionMode && selectedPackage?.id === pkg.id ? 'selected' : ''}`}
            key={pkg.id}
            onClick={selectionMode ? () => onPackageSelect(pkg) : undefined}
            style={selectionMode ? { cursor: 'pointer' } : {}}
          >
            <div className="package-header-artist">
              <span className="package-title-artist">{pkg.title}</span>
              {!isPublicView && (
                <button 
                  className="package-edit-icon" 
                  onClick={(e) => {
                    e.stopPropagation(); // Evitar selección cuando se edita
                    setEditing(pkg);
                  }}
                  title="Editar paquete"
                >
                  <Edit size={25} />
                </button>
              )}
            </div>
            
            <div className="package-content-artist">
              <div className="package-price-section">
                <span className="package-price-label">Precio</span>
                <span className="package-price-amount">
                  {formatColombianPrice(pkg.price)}
                </span>
              </div>
              
              <div className="package-delivery-section">
                <span className="package-delivery-label">Tiempo estimado</span>
                <span className="package-delivery-time">
                  {pkg.delivery_time_days} {pkg.delivery_time_days === 1 ? 'día' : 'días'}
                </span>
              </div>
              
              <div className="package-description-section">
                <div className="package-desc-title">Descripción</div>
                <div className="package-desc-text">
                  {pkg.description ? (
                    <ul className="package-features-list">
                      {pkg.description.split('\n').map((line, idx) => (
                        line.trim() && <li key={idx}>{line.trim()}</li>
                      ))}
                    </ul>
                  ) : (
                    'Sin descripción'
                  )}
                </div>
              </div>
              
              <div className="package-samples-section">
                <div className="package-samples-title">Muestra</div>
                {(pkg.reference_image1 || pkg.reference_image2) ? (
                  <div className="package-samples-grid">
                    {pkg.reference_image1 && (
                      <img 
                        src={`http://localhost:5000/${pkg.reference_image1}`} 
                        alt="Muestra 1" 
                        className="package-sample-image"
                      />
                    )}
                    {pkg.reference_image2 && (
                      <img 
                        src={`http://localhost:5000/${pkg.reference_image2}`} 
                        alt="Muestra 2" 
                        className="package-sample-image"
                      />
                    )}
                  </div>
                ) : (
                  <div className="package-no-samples">Sin muestras</div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Card para agregar paquete */}
        {!isPublicView && packages.length < MAX_PACKAGES && (
          <div className="add-package-card" onClick={() => setShowAdd(true)}>
            <div className="add-package-content">
              <div className="add-package-icon">
                <CirclePlus size={75} />
              </div>
              <span className="add-package-text">Agregar</span>
            </div>
          </div>
        )}
      </div>

      {/* Sección de Extras - SOLO MOSTRAR SI showExtras ES TRUE */}
      {showExtras && (extras.length > 0 || !isPublicView) && (
        <div className="extras-section-artist">
          <div className="extras-header-artist">
            <span className="extras-title-artist">Extra</span>
            {!isPublicView && (
              <button 
                className="extras-edit-btn" 
                onClick={() => setShowAddExtra(true)}
                title="Agregar extra"
              >
                <CirclePlus size={28} />
              </button>
            )}
          </div>
          
          <div className="extras-list-artist">
            {extras.map(extra => (
              <div className="extra-item-artist" key={extra.id}>
                <div className="extra-item-left">
                  <span className="extra-item-bullet">•</span>
                  <span className="extra-item-name">{extra.name}</span>
                </div>
                <div className="extra-item-right">
                  <span className="extra-item-price">{formatColombianPrice(extra.price)}</span>
                  {!isPublicView && (
                    <div className="extra-item-actions">
                      <button 
                        className="extra-action-btn" 
                        onClick={() => setEditingExtra(extra)}
                        title="Editar extra"
                      >
                        <Edit size={20} />
                      </button>
                      <button 
                        className="extra-action-btn delete" 
                        onClick={() => handleDeleteExtra(extra.id)}
                        title="Eliminar extra"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Mostrar placeholder solo en vista privada sin extras */}
            {extras.length === 0 && !isPublicView && (
              <div className="no-extras-message">
                No tienes extras agregados. Haz clic en el botón de editar para agregar extras.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para crear/editar paquete */}
      {(editing || showAdd) && (
        <PackageModal
          pkg={editing}
          onSave={handleSavePackage}
          onCancel={() => { setEditing(null); setShowAdd(false); }}
        />
      )}

      {/* Formulario inline para extras - SOLO SI showExtras ES TRUE */}
      {showExtras && (editingExtra || showAddExtra) && (
        <div className="extra-form-overlay">
          <ExtraForm
            extra={editingExtra}
            onSave={handleSaveExtra}
            onCancel={() => { setEditingExtra(null); setShowAddExtra(false); }}
            maxExtras={MAX_EXTRAS}
            currentExtras={extras.length}
          />
        </div>
      )}
    </div>
  );
};

// Modal para crear/editar paquete
function PackageModal({ pkg, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: pkg?.title || '',
    description: pkg?.description || '',
    price: pkg
      ? Number(pkg.price).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      : '',
    delivery_time_days: pkg?.delivery_time_days || 7,
    reference_image1: pkg?.reference_image1 || null,
    reference_image2: pkg?.reference_image2 || null
  });

  const [preview1, setPreview1] = useState(
    pkg?.reference_image1 ? `http://localhost:5000/${pkg.reference_image1}` : null
  );
  const [preview2, setPreview2] = useState(
    pkg?.reference_image2 ? `http://localhost:5000/${pkg.reference_image2}` : null
  );

  const fileInputRef1 = React.useRef();
  const fileInputRef2 = React.useRef();

  const handleRemoveImage = async (idx) => {
    if (idx === 1) {
      // Si es una imagen existente, eliminarla del servidor
      if (pkg?.reference_image1 && typeof pkg.reference_image1 === 'string') {
        try {
          await axios.delete(`http://localhost:5000/api/packages/my/${pkg.id}/image/1`, {
            withCredentials: true
          });
        } catch (error) {
          console.error('Error al eliminar imagen:', error);
          // No hacer alert para errores del servidor, solo en el estado local
        }
      }
      setForm(f => ({ ...f, reference_image1: null }));
      setPreview1(null);
    } else {
      // Si es una imagen existente, eliminarla del servidor
      if (pkg?.reference_image2 && typeof pkg.reference_image2 === 'string') {
        try {
          await axios.delete(`http://localhost:5000/api/packages/my/${pkg.id}/image/2`, {
            withCredentials: true
          });
        } catch (error) {
          console.error('Error al eliminar imagen:', error);
          // No hacer alert para errores del servidor, solo en el estado local
        }
      }
      setForm(f => ({ ...f, reference_image2: null }));
      setPreview2(null);
    }
  };

  // Manejar cambio de imagen
  const handleImageChange = (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    if (idx === 1) {
      setForm(f => ({ ...f, reference_image1: file }));
      const reader = new FileReader();
      reader.onload = (ev) => setPreview1(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setForm(f => ({ ...f, reference_image2: file }));
      const reader = new FileReader();
      reader.onload = (ev) => setPreview2(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Manejar cambios de campos generales
  const handleChange = e => {
    const { name, value } = e.target;
    
    // Limitar descripción a 200 caracteres (reducido de 300)
    if (name === 'description' && value.length > 100) {
      return;
    }
    
    setForm(f => ({ ...f, [name]: value }));
  };

  // Guardar
  const handleSubmit = e => {
    e.preventDefault();
    if (!form.title.trim() || !form.price) {
      alert('El título y el precio son obligatorios');
      return;
    }
    const numericPrice = parsePrice(form.price);
    if (!isValidPrice(numericPrice)) {
      alert('El precio debe estar entre $1.000 y $100.000.000 COP');
      return;
    }
    const finalForm = { ...form, price: numericPrice };
    if (pkg?.id) finalForm.id = pkg.id;
    onSave(finalForm);
  };

  // Eliminar paquete
  const handleDelete = async () => {
    if (window.confirm('¿Estás seguro de eliminar este paquete? Esta acción no se puede deshacer.')) {
      try {
        await axios.delete(`http://localhost:5000/api/packages/my/${pkg.id}`, { 
          withCredentials: true 
        });
        onCancel(); // Cerrar modal
        // Recargar paquetes (necesitas pasar esta función desde el componente padre)
        window.location.reload(); // Temporal - mejor pasar función de recarga
      } catch (error) {
        console.error('Error al eliminar paquete:', error);
        alert('Error al eliminar el paquete');
      }
    }
  };

  return (
    <div className="package-form-overlay">
      <div className="package-form-modal custom-modal-horizontal">
        <div className="modal-toolbar">
          <span className="modal-title">Editar Paquete</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="modal-toolbar-btn delete" onClick={handleDelete} title="Eliminar paquete">
              <Trash2 size={28} />
            </button>
            <button className="modal-toolbar-btn save" onClick={handleSubmit} title="Guardar cambios">
              <svg width="28" height="28" viewBox="0 0 24 24">
                <path fill="currentColor" d="M20.285 6.709a1 1 0 0 0-1.414-1.418l-9.192 9.193-4.243-4.243a1 1 0 1 0-1.415 1.415l4.95 4.95a1 1 0 0 0 1.414 0l9.9-9.897z"/>
              </svg>
            </button>
            <button className="modal-toolbar-btn close" onClick={onCancel} title="Cancelar">
              <X size={28} />
            </button>
          </div>
        </div>
        <form className="package-modal-form" onSubmit={handleSubmit} autoComplete="off">
          <div className="modal-fields-row">
            <div className="modal-fields-col">
              <label className="package-desc-title" htmlFor="title">Nombre del paquete</label>
              <input
                name="title"
                id="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Título del paquete"
                className="modal-input"
                maxLength={100}
                required
              />

              <div className="modal-price-row">
                <span className="package-price-label">Precio</span>
                <span className="package-price-amount">{formatColombianPrice(parsePrice(form.price) || 0)}</span>
              </div>
              <input
                name="price"
                type="text"
                value={form.price}
                onChange={handleChange}
                placeholder="50.000"
                className="modal-input"
                required
              />

              <div className="modal-delivery-row">
                <span className="package-delivery-label">Tiempo estimado</span>
                <input
                  name="delivery_time_days"
                  type="number"
                  value={form.delivery_time_days}
                  onChange={handleChange}
                  placeholder="7"
                  min="1"
                  max="365"
                  className="modal-input"
                  required
                />
                <span className="package-delivery-time">días</span>
              </div>
            </div>
            
            <div className="modal-fields-col">
              <div className="modal-desc-row">
                <span className="package-desc-title">Descripción</span>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe lo que incluye este paquete"
                  rows={3}
                  className="modal-textarea"
                  style={{ resize: 'none' }}
                  maxLength={100}
                  required
                />
                <div className={`character-count ${form.description.length > 100 ? 'warning' : ''}`}>
                  {form.description.length}/100 caracteres
                </div>
              </div>

              <span className="package-samples-title">Muestra</span>
              <div className="modal-samples-row">
                {/* Imagen 1 */}
                <div className="modal-sample-img-container">
                  {preview1 ? (
                    <div className="modal-sample-img-preview">
                      <img src={preview1} alt="Muestra 1" />
                      <button type="button" className="remove-image-btn" onClick={() => handleRemoveImage(1)} title="Eliminar imagen">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="modal-sample-add"
                      onClick={() => fileInputRef1.current.click()}
                      tabIndex={0}
                      role="button"
                      title="Agregar imagen"
                    >
                      <span>Agregar</span>
                      <CirclePlus size={48} className="modal-sample-add-icon" />
                      <input
                        ref={fileInputRef1}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleImageChange(e, 1)}
                      />
                    </div>
                  )}
                </div>
                {/* Imagen 2 */}
                <div className="modal-sample-img-container">
                  {preview2 ? (
                    <div className="modal-sample-img-preview">
                      <img src={preview2} alt="Muestra 2" />
                      <button type="button" className="remove-image-btn" onClick={() => handleRemoveImage(2)} title="Eliminar imagen">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="modal-sample-add"
                      onClick={() => fileInputRef2.current.click()}
                      tabIndex={0}
                      role="button"
                      title="Agregar imagen"
                    >
                      <span>Agregar</span>
                      <CirclePlus size={48} className="modal-sample-add-icon" />
                      <input
                        ref={fileInputRef2}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleImageChange(e, 2)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Formulario para crear/editar extra
function ExtraForm({ extra, onSave, onCancel, maxExtras, currentExtras }) {
  const [form, setForm] = useState({
    name: extra?.name || '',
    price: extra
      ? Number(extra.price).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      : ''
  });

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    
    if (!form.name.trim() || !form.price) {
      alert('El nombre y el precio son obligatorios');
      return;
    }

    const numericPrice = parsePrice(form.price);
    if (!isValidPrice(numericPrice)) {
      alert('El precio debe estar entre $1.000 y $100.000.000 COP');
      return;
    }

    if (!extra && currentExtras >= maxExtras) {
      alert(`Máximo ${maxExtras} extras permitidos`);
      return;
    }

    const finalForm = { ...form, price: numericPrice };
    if (extra?.id) finalForm.id = extra.id;
    
    onSave(finalForm);
  };

  return (
    <div className="extra-form-overlay">
      <div className="extra-form-content">
        <div className="extra-form-header">
          <h3 className="extra-form-title">
            {extra ? 'Editar Extra' : 'Nuevo Extra'}
          </h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="modal-toolbar-btn save" onClick={handleSubmit} title="Guardar extra">
              <svg width="28" height="28" viewBox="0 0 24 24">
                <path fill="currentColor" d="M20.285 6.709a1 1 0 0 0-1.414-1.418l-9.192 9.193-4.243-4.243a1 1 0 1 0-1.415 1.415l4.95 4.95a1 1 0 0 0 1.414 0l9.9-9.897z"/>
              </svg>
            </button>
            <button className="modal-toolbar-btn close" onClick={onCancel} title="Cancelar">
              <X size={28} />
            </button>
          </div>
        </div>
        
        <form className="extra-form" autoComplete="off">
          <div className="form-field-artist">
            <label htmlFor="extra-name">Nombre del extra</label>
            <input
              id="extra-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Nombre del extra"
              className="modal-input"
              maxLength={50}
              required
            />
          </div>

          <div className="form-field-artist">
            <div className="modal-price-row">
              <span className="package-price-label">Precio</span>
              <span className="package-price-amount">{formatColombianPrice(parsePrice(form.price) || 0)}</span>
            </div>
            <input
              name="price"
              type="text"
              value={form.price}
              onChange={handleChange}
              placeholder="15.000"
              className="modal-input"
              required
            />
            <div className="form-field-help">
              Precio en <strong>pesos colombianos (COP)</strong>. Mínimo $1.000 - Máximo $100.000.000
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ArtistPackages;