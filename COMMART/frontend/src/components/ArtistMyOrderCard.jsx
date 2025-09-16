import React, { useState } from 'react';
import { CircleCheck, CircleX } from 'lucide-react';
import ConfirmModal from './ConfirmModal'; // ⭐ AÑADIR ESTE IMPORT

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
        <button className="image-expanded-close" onClick={onClose}>×</button>
        
        {images.length > 1 && (
          <>
            <button className="image-expanded-arrow left" onClick={prev}>‹</button>
            <button className="image-expanded-arrow right" onClick={next}>›</button>
          </>
        )}
        
        <img 
          src={images[idx]} 
          alt={`Referencia ${idx + 1}`} 
          className="image-expanded" 
        />
        
        {images.length > 1 && (
          <div className="image-expanded-counter">
            {idx + 1} de {images.length}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ArtistMyOrderCard({
  order,
  onGoToOrder,
  showProcessView = false,
  onAccept,
  onReject
}) {
  const [showMotivo, setShowMotivo] = useState(false);
  const [showCarousel, setShowCarousel] = useState(false);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false); // ⭐ AÑADIR ESTE ESTADO

  // Estado visual para artistas
  const statusBox = (() => {
    if (order.status === 'pending') {
      return (
        <div className="myorder-status-box waiting" style={{ 
          flexDirection: 'row', 
          gap: '1.5rem', 
          height: 'auto',
          justifyContent: 'space-around',
          alignItems: 'center'
        }}>
          {/* Botón Aceptar - ícono arriba, texto abajo */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            padding: '1rem',
            borderRadius: '8px',
            transition: 'background-color 0.2s',
            minWidth: '80px'
          }}
          onClick={() => setShowAcceptConfirm(true)} // ⭐ CAMBIAR ESTA LÍNEA
          onMouseEnter={e => e.target.style.backgroundColor = 'rgba(16, 185, 129, 0.1)'}
          onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}>
            <div className="status-check-icon">
              <CircleCheck size={36} />
            </div>
            <span className="status-accepted-text" style={{ 
              fontSize: '0.85rem',
              fontWeight: '600'
            }}>
              Aceptar
            </span>
          </div>

          {/* Botón Rechazar - ícono arriba, texto abajo */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            padding: '1rem',
            borderRadius: '8px',
            transition: 'background-color 0.2s',
            minWidth: '80px'
          }}
          onClick={() => onReject && onReject(order.id)}
          onMouseEnter={e => e.target.style.backgroundColor = 'rgba(231, 76, 60, 0.1)'}
          onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}>
            <div className="status-rejected-icon">
              <CircleX size={36} />
            </div>
            <span className="status-rejected-text" style={{ 
              fontSize: '0.85rem',
              fontWeight: '600'
            }}>
              Rechazar
            </span>
          </div>
        </div>
      );
    }
    if (order.status === 'accepted' || order.status === 'in_progress') {
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
      return (
        <div className="myorder-status-box accepted">
          <div className="status-accepted-content">
            <div className="status-check-icon">
              <CircleCheck size={32} />
            </div>
            <span className="status-accepted-text">En Proceso</span>
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

  // ⭐ AÑADIR ESTAS FUNCIONES
  const handleAcceptConfirm = () => {
    setShowAcceptConfirm(false);
    onAccept && onAccept(order.id);
  };

  const handleAcceptCancel = () => {
    setShowAcceptConfirm(false);
  };

  return (
    <div className="myorder-card">
      {/* Izquierda: descripción y estado */}
      <div className="myorder-left">
        <div className="myorder-description">
          {order.description}
        </div>
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
          
          {/* Columna 1, Fila 2: Cliente (CAMBIADO) */}
          <div className="myorder-info-col myorder-info-artist">
            <span className="myorder-info-label">Pedido realizado por:</span>
            <div className="myorder-artist-row" style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/user/${order.clientId}`}>
              <img src={order.clientAvatar} alt="Cliente" className="myorder-artist-avatar" />
              <span className="myorder-artist-name goldman-font">{order.clientName}</span>
            </div>
          </div>
          
          {/* Columna 2, Fila 2: Fecha */}
          <div className="myorder-info-col myorder-info-date">
            <span className="myorder-info-label">Pedido recibido el</span>
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
      
      {/* ⭐ AÑADIR ESTE MODAL DE CONFIRMACIÓN */}
      <ConfirmModal
        open={showAcceptConfirm}
        message="¿Estás seguro que quieres aceptar este pedido?"
        onCancel={handleAcceptCancel}
        onConfirm={handleAcceptConfirm}
        confirmText="Aceptar"
        cancelText="Cancelar"
      />
    </div>
  );
}