import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Edit, Trash2, X } from 'lucide-react';
import { formatColombianPrice, formatPriceInput, parsePrice, parsePriceForDB, isValidPrice } from '../utils/priceFormatter';
import '../styles/artistpackages.css';

const MAX_PACKAGES = 3;
const MAX_EXTRAS = 6;

const ArtistPackages = ({ isPublicView = false }) => {
  const [packages, setPackages] = useState([]);
  const [extras, setExtras] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editingExtra, setEditingExtra] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar paquetes y extras
  useEffect(() => {
    fetchPackages();
    if (!isPublicView) {
      fetchExtras();
    }
  }, [isPublicView]);

  const fetchPackages = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/packages/my', { 
        withCredentials: true 
      });
      setPackages(res.data || []);
    } catch (error) {
      console.error('Error al cargar paquetes:', error);
      setPackages([]);
    } finally {
      setLoading(false);
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
      const formData = new FormData();
      
      // Convertir precio a número antes de enviar
      const finalPrice = parsePriceForDB(pkg.price.toString());
      
      // Agregar campos del formulario
      Object.entries(pkg).forEach(([key, value]) => {
        if (value !== null && value !== undefined && key !== 'reference_image1' && key !== 'reference_image2') {
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
          <div className="artist-package-card" key={pkg.id}>
            <div className="package-header-artist">
              <span className="package-title-artist">{pkg.title}</span>
              {!isPublicView && (
                <button 
                  className="package-edit-icon" 
                  onClick={() => setEditing(pkg)}
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
              <div className="add-package-icon">+</div>
              <div className="add-package-text">Agregar</div>
            </div>
          </div>
        )}
      </div>

      {/* Sección de Extras - Solo en vista privada */}
      {!isPublicView && (
        <div className="extras-section-artist">
          <div className="extras-header-artist">
            <span className="extras-title-artist">Extra</span>
            <button 
              className="extras-edit-btn" 
              onClick={() => setShowAddExtra(true)}
              title="Agregar extra"
            >
              <Edit size={16} />
            </button>
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
                  <div className="extra-item-actions">
                    <button 
                      className="extra-action-btn" 
                      onClick={() => setEditingExtra(extra)}
                      title="Editar extra"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="extra-action-btn delete" 
                      onClick={() => handleDeleteExtra(extra.id)}
                      title="Eliminar extra"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Mostrar placeholder si no hay extras */}
            {extras.length === 0 && (
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

      {/* Formulario inline para extras */}
      {(editingExtra || showAddExtra) && (
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
    reference_image1: null,
    reference_image2: null
  });

  const [preview1, setPreview1] = useState(
    pkg?.reference_image1 ? `http://localhost:5000/${pkg.reference_image1}` : null
  );
  const [preview2, setPreview2] = useState(
    pkg?.reference_image2 ? `http://localhost:5000/${pkg.reference_image2}` : null
  );

  const handleChange = e => {
    const { name, value, files } = e.target;
    
    if (files && files[0]) {
      const file = files[0];
      setForm(f => ({ ...f, [name]: file }));
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (name === 'reference_image1') {
          setPreview1(ev.target.result);
        } else if (name === 'reference_image2') {
          setPreview2(ev.target.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      if (name === 'price') {
        // Solo formatear para visualización, mantener el valor original
        const formatted = formatPriceInput(value);
        setForm(f => ({ ...f, [name]: formatted }));
      } else {
        setForm(f => ({ ...f, [name]: value }));
      }
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.price) {
      alert('El título y el precio son obligatorios');
      return;
    }
    
    const numericPrice = parsePrice(form.price);
    const decimalPrice = parsePriceForDB(form.price);
    
    // 🔍 LOGS DETALLADOS PARA DEBUGGEAR
    console.log('=== DEBUGGING COMPLETO ===');
    console.log('1. Valor RAW del input:', form.price);
    console.log('2. Tipo del valor RAW:', typeof form.price);
    console.log('3. parsePrice(form.price):', numericPrice);
    console.log('4. parsePriceForDB(form.price):', decimalPrice);
    console.log('5. formatColombianPrice(numericPrice):', formatColombianPrice(numericPrice));
    console.log('6. formatColombianPrice(decimalPrice):', formatColombianPrice(decimalPrice));
     
    if (!isValidPrice(numericPrice)) {
      alert('El precio debe estar entre $1.000 y $100.000.000 COP');
      return;
    }

    const finalForm = { ...form, price: numericPrice }; // Usar numericPrice en lugar de decimalPrice
    if (pkg?.id) finalForm.id = pkg.id;
    
    onSave(finalForm);
  };

  return (
    <div className="package-form-overlay">
      <div className="package-form-modal">
        <div className="package-form-header">
          <h3 className="package-form-title">
            {pkg ? 'Editar Paquete' : 'Nuevo Paquete'}
          </h3>
          <button className="package-form-close" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="package-form">
          <div className="form-field-artist">
            <label>Nombre del paquete</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Básico"
              maxLength={100}
              required
            />
          </div>
          
          <div className="form-field-artist">
            <label>Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Boceto + lineart&#10;Sin coloreado o coloreado simple"
              rows={4}
            />
            <div className="form-field-help">
              Cada línea será mostrada como un punto en la lista
            </div>
          </div>
          
          <div className="form-field-artist">
            <label>Precio (Pesos Colombianos)</label>
            <input
              name="price"
              type="text"
              value={form.price}
              onChange={handleChange}
              placeholder="50.000"
              required
            />
            <div className="form-field-help">
              Se mostrará como: <strong>{formatColombianPrice(parsePrice(form.price) || 0)}</strong>
            </div>
          </div>
          
          <div className="form-field-artist">
            <label>Tiempo de entrega (días)</label>
            <input
              name="delivery_time_days"
              type="number"
              value={form.delivery_time_days}
              onChange={handleChange}
              placeholder="7"
              min="1"
              max="365"
            />
          </div>
          
          <div className="form-field-artist">
            <label>Imagen de muestra 1</label>
            <input
              name="reference_image1"
              type="file"
              accept="image/*"
              onChange={handleChange}
            />
            {preview1 && (
              <div className="image-preview">
                <img src={preview1} alt="Preview 1" />
              </div>
            )}
          </div>
          
          <div className="form-field-artist">
            <label>Imagen de muestra 2</label>
            <input
              name="reference_image2"
              type="file"
              accept="image/*"
              onChange={handleChange}
            />
            {preview2 && (
              <div className="image-preview">
                <img src={preview2} alt="Preview 2" />
              </div>
            )}
          </div>
          
          <div className="form-actions-artist">
            <button type="button" className="form-btn-cancel" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="form-btn-save">
              {pkg ? 'Actualizar' : 'Crear'} Paquete
            </button>
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
    if (name === 'price') {
      const formatted = formatPriceInput(value);
      setForm(f => ({ ...f, [name]: formatted }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
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
    <div className="extra-form-modal">
      <div className="extra-form-content">
        <div className="extra-form-header">
          <h3 className="extra-form-title">
            {extra ? 'Editar Extra' : 'Nuevo Extra'}
          </h3>
          <button className="extra-form-close" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="extra-form">
          <div className="form-field-artist">
            <label>Nombre del extra</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Dos personajes"
              maxLength={100}
              required
            />
          </div>
          
          <div className="form-field-artist">
            <label>Precio (Pesos Colombianos)</label>
            <input
              name="price"
              type="text"
              value={form.price}
              onChange={handleChange}
              placeholder="10.000"
              required
            />
            <div className="form-field-help">
              Se mostrará como: <strong>{formatColombianPrice(parsePrice(form.price) || 0)}</strong>
            </div>
          </div>
          
          <div className="form-actions-artist">
            <button type="button" className="form-btn-cancel" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="form-btn-save">
              {extra ? 'Actualizar' : 'Crear'} Extra
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ArtistPackages;