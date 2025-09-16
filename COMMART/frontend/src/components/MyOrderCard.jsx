import React, { useState } from 'react';
import { CircleCheck, CircleX } from 'lucide-react';

// Modal simple para mostrar motivo de rechazo
function MotivoModal({ open, motivo, onClose }) {
  if (!open) return null;
  return (
    <div className="order-modal-overlay">
      <div className="order-modal-content">
        <h3 className="order-modal-title">Motivo de cancelación</h3>
        <div className="order-modal-motivo">{motivo}</div>
        <button className="order-modal-btn" onClick={onClose}>Aceptar</button>
      </div>
    </div>
  );
}

// Carrusel mejorado estilo Google Drive
function ReferenceCarousel({ open, images, onClose }) {
  const [idx, setIdx] = useState(0);
  
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, onClose]);
  
  if (!open) return null;
  
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  return (
    <div className="image-expanded-overlay" onClick={onClose}>
      <div className="image-expanded-container" onClick={(e) => e.stopPropagation()}>
        {/* Botón cerrar */}
        <button className="image-expanded-close" onClick={onClose}>
          ×
        </button>
        
        {/* Flechas de navegación */}
        {images.length > 1 && (
          <>
            <button className="image-expanded-arrow left" onClick={prev}>
              ‹
            </button>
            <button className="image-expanded-arrow right" onClick={next}>
              ›
            </button>
          </>
        )}
        
        {/* Imagen */}
        <img 
          src={images[idx]} 
          alt={`Referencia ${idx + 1}`} 
          className="image-expanded" 
        />
        
        {/* Contador */}
        {images.length > 1 && (
          <div className="image-expanded-counter">
            {idx + 1} de {images.length}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyOrderCard({
  order,
  onGoToOrder, // función para ir al tab "en proceso"
  showProcessView = false, // Nueva prop para indicar si estamos en la vista de proceso
}) {
  const [showMotivo, setShowMotivo] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);

  // Estado visual
  const statusBox = (() => {
    if (order.status === 'pending') {
      return (
        <div className="myorder-status-box waiting">
          <span>ESPERANDO RESPUESTA</span>
        </div>
      );
    }
    if (order.status === 'accepted' || order.status === 'in_progress') {
      // Si estamos en la vista de proceso, mostrar el botón "VER PROCESO"
      if (showProcessView) {
        return (
          <div className="myorder-status-box accepted" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <button 
              className="myorder-btn" 
              onClick={() => window.location.href = `/orders/${order.id}`}
            >
              VER PROCESO
            </button>
          </div>
        );
      }
      // Vista normal (tab "realizados")
      return (
        <div className="myorder-status-box accepted">
          <div className="status-accepted-content">
            <div className="status-check-icon">
              <CircleCheck size={32} />
            </div>
            <span className="status-accepted-text">Aceptado</span>
          </div>
          <button className="myorder-btn" onClick={() => onGoToOrder(order.id)}>IR</button>
        </div>
      );
    }
    if (order.status === 'rejected') {
      return (
        <div className="myorder-status-box rejected">
          <div className="status-rejected-content">
            <div className="status-rejected-icon">
              <CircleX size={32} />
            </div>
            <span className="status-rejected-text">Rechazado</span>
          </div>
          <button className="myorder-btn" onClick={() => setShowMotivo(true)}>MOTIVO</button>
        </div>
      );
    }
    return null;
  })();

  return (
    <div className="myorder-card">
      {/* Izquierda: descripción y estado */}
      <div className="myorder-left">
        <div className="myorder-description">
          {order.description}
        </div>
        {/* Divider SOLO para el estado */}
        <div className="myorder-status-divider" />
        <div className="myorder-status-container">
          {statusBox}
        </div>
      </div>

      {/* Derecha: información principal */}
      <div className="myorder-right">
        <div className="myorder-info-grid">
          {/* Columna 1, Fila 1: Referencias */}
          <div className="myorder-info-col myorder-info-references">
            <div className="myorder-info-title">Referencias:</div>
            <div className="myorder-references-stack" onClick={() => setShowCarousel(true)}>
              {order.references.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Referencia ${i + 1}`}
                  className="myorder-reference-img xlarge"
                  style={{
                    left: `${i * 10}px`,
                    zIndex: order.references.length - i,
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Columna 2, Fila 1: Paquete y Extras */}
          <div className="myorder-info-col myorder-info-details">
            <div>
              <span className="myorder-info-title">Paquete: </span>
              <span className="myorder-info-value myorder-package-name">{order.packageName}</span>
            </div>
            <div className="myorder-details-divider" />
            <div>
              <span className="myorder-info-title">Extras: </span>
              {order.extras?.length ? (
                <ul className="myorder-extras-list brown-bullets">
                  {order.extras.map((extra, idx) => (
                    <li key={idx}>{extra}</li>
                  ))}
                </ul>
              ) : (
                <span className="myorder-info-value">Ninguno</span>
              )}
            </div>
          </div>
          
          {/* Columna 1, Fila 2: Artista */}
          <div className="myorder-info-col myorder-info-artist">
            <span className="myorder-info-label">Pedido realizado a:</span>
            <div className="myorder-artist-row" style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/artist/${order.artistId}`}>
              <img src={order.artistAvatar} alt="Artista" className="myorder-artist-avatar" />
              <span className="myorder-artist-name goldman-font">{order.artistName}</span>
            </div>
          </div>
          
          {/* Columna 2, Fila 2: Fecha */}
          <div className="myorder-info-col myorder-info-date">
            <span className="myorder-info-label">Pedido realizado el</span>
            <div className="myorder-date-value goldman-font">
              {order.createdAt && new Date(order.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modales */}
      <MotivoModal
        open={showMotivo}
        motivo={order.rejectionReason}
        onClose={() => setShowMotivo(false)}
      />
      <ReferenceCarousel
        open={showCarousel}
        images={order.references}
        onClose={() => setShowCarousel(false)}
      />
    </div>
  );
}