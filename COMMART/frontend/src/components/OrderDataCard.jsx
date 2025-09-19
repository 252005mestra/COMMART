import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReferenceCarousel from './ReferenceCarousel';
import '../styles/orderdatacard.css';

export default function OrderDataCard({
  order,
  clientUser,
  artistUser,
  images = [],
  selectedPackage,
  selectedExtras = [],
  onViewPackage,
  currentUserId,
}) {
  const [showCarousel, setShowCarousel] = useState(false);
  const [showPackageDetail, setShowPackageDetail] = useState(false);
  const navigate = useNavigate();

  // Siempre trabajar con array
  const extrasArray = Array.isArray(selectedExtras) ? selectedExtras : [];

  // Formateo de precio
  const formatCOP = (num) =>
    num ? `${parseInt(num).toLocaleString('es-CO')}mil COP$` : '0 COP$';

  // Suma total
  const total =
    (selectedPackage?.price || 0) +
    extrasArray.reduce((sum, e) => sum + (e.price || 0), 0);

  // Mostrar siempre el cliente que hizo el pedido
  const displayUser = clientUser;
  const labelText = 'Pedido realizado por:';

  // Navegación al perfil
  const handleUserClick = () => {
    if (!displayUser) return;
    // Forzar navegación a perfil de artista si tiene is_artist true
    if (displayUser.is_artist === true || displayUser.is_artist === 1) {
      navigate(`/artist/${displayUser.id}`);
    } else {
      navigate(`/user/${displayUser.id}`);
    }
  };

  // Utilidad para obtener la URL de la foto de perfil
  const getProfileImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-profile.jpg';

  return (
    <>
      {/* Card principal de datos del pedido */}
      <div className="orderdata-card">
        {/* Usuario y fecha - Estilo igual que MyOrderCard */}
        <div className="orderdata-row orderdata-row-top">
          <div className="orderdata-user-section">
            <span className="orderdata-user-label">{labelText}</span>
            <div
              className="orderdata-user"
              style={{ cursor: 'pointer' }}
              onClick={handleUserClick}
              title="Ver perfil"
            >
              <img
                src={getProfileImageUrl(displayUser?.profile_image)}
                alt={displayUser?.username}
                className="orderdata-avatar"
              />
              <span className="orderdata-username">{displayUser?.username}</span>
            </div>
          </div>
          
          <div className="orderdata-date-section">
            <span className="orderdata-date-label">Pedido realizado el</span>
            <div className="orderdata-date-value">
              {order?.created_at &&
                new Date(order.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Divisor uniforme */}
        <div className="orderdata-section-divider" />

        {/* Referencias */}
        <div className="orderdata-section">
          <div className="orderdata-label">Referencias:</div>
          <div
            className="orderdata-references-stack"
            onClick={() => setShowCarousel(true)}
          >
            {images.map((img, i) => (
              <img
                key={i}
                src={
                  img.startsWith('http')
                    ? img
                    : `http://localhost:5000/${img}`
                }
                alt={`Referencia ${i + 1}`}
                className="orderdata-reference-img"
                style={{
                  left: `${i * 35}px`,
                  zIndex: images.length - i,
                }}
              />
            ))}
          </div>
        </div>

        {/* Paquete y extras */}
        <div className="orderdata-section">
          <div className="orderdata-preview-details-grid">
            <div className="orderdata-preview-details-left">
              <h4 className="orderdata-preview-detail-title">Paquete:</h4>
              <div className="orderdata-preview-package-info">
                <span className="orderdata-preview-package-name">
                  {selectedPackage?.name || selectedPackage?.title || 'Sin paquete'}
                </span>
                <button
                  className="orderdata-preview-view-package-btn"
                  onClick={() => setShowPackageDetail(true)}
                >
                  Ver paquete
                </button>
              </div>
            </div>
            {extrasArray.length > 0 && (
              <div className="orderdata-preview-details-right">
                <h4 className="orderdata-preview-detail-title">Extras:</h4>
                <div className="orderdata-preview-extras-list">
                  {extrasArray.map((extra) => (
                    <div key={extra.id} className="orderdata-preview-extra-item">
                      <span>{extra.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de detalle de paquete */}
        {showPackageDetail && (
          <div className="orderdata-package-detail-modal">
            <div className="orderdata-package-detail-header">
              <button
                className="orderdata-back-btn"
                onClick={() => setShowPackageDetail(false)}
              >
                <ChevronLeft size={20} /> Volver
              </button>
              <span className="orderdata-package-detail-title">{selectedPackage?.title || selectedPackage?.name}</span>
            </div>
            <div className="orderdata-package-detail-content">
              <div className="orderdata-package-detail-row">
                <span className="orderdata-package-detail-label">Precio:</span>
                <span className="orderdata-package-detail-value">{formatCOP(selectedPackage?.price)}</span>
              </div>
              <div className="orderdata-package-detail-row">
                <span className="orderdata-package-detail-label">Tiempo estimado:</span>
                <span className="orderdata-package-detail-value">
                  {selectedPackage?.delivery_time_days} {selectedPackage?.delivery_time_days === 1 ? 'día' : 'días'}
                </span>
              </div>
              <div className="orderdata-package-detail-row">
                <span className="orderdata-package-detail-label">Descripción:</span>
                <span className="orderdata-package-detail-value">{selectedPackage?.description || 'Sin descripción'}</span>
              </div>
              {(selectedPackage?.reference_image1 || selectedPackage?.reference_image2) && (
                <div className="orderdata-package-detail-samples">
                  <span className="orderdata-package-detail-label">Muestras:</span>
                  <div className="orderdata-package-detail-samples-grid">
                    {selectedPackage.reference_image1 && (
                      <img
                        src={`http://localhost:5000/${selectedPackage.reference_image1}`}
                        alt="Muestra 1"
                        className="orderdata-package-detail-sample-image"
                      />
                    )}
                    {selectedPackage.reference_image2 && (
                      <img
                        src={`http://localhost:5000/${selectedPackage.reference_image2}`}
                        alt="Muestra 2"
                        className="orderdata-package-detail-sample-image"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Descripción */}
        <div className="orderdata-section">
          <div className="orderdata-label">Descripción:</div>
          <div className="orderdata-description">{order?.description || 'Sin descripción'}</div>
        </div>

        {/* Modal de referencias ampliadas */}
        <ReferenceCarousel
          open={showCarousel}
          images={images}
          onClose={() => setShowCarousel(false)}
        />
      </div>

      {/* Card de precios SEPARADA, fuera de la card principal */}
      <div className="orderdata-summary-price-card">
        <div className="orderdata-summary-price-breakdown">
          <div className="orderdata-summary-price-item">
            <span>{selectedPackage?.name || selectedPackage?.title || 'Paquete'}</span>
            <span className="orderdata-summary-price-badge">{formatCOP(selectedPackage?.price)}</span>
          </div>
          {extrasArray.map((extra) => (
            <div key={extra.id} className="orderdata-summary-price-item">
              <span>{extra.name}</span>
              <span className="orderdata-summary-price-badge">{formatCOP(extra.price)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="orderdata-summary-total-card">
        <div className="orderdata-summary-total-content">
          <h3 className="orderdata-summary-total-title">Valor de la obra:</h3>
          <div className="orderdata-summary-total-note">Generado automáticamente</div>
        </div>
        <span className="orderdata-summary-total-badge">{formatCOP(total)}</span>
      </div>
    </>
  );
}