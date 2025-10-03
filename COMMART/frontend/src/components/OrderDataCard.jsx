import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReferenceCarousel from './ReferenceCarousel';
import ConfirmModal from './ConfirmModal';
import '../styles/orderdatacard.css';
import { formatColombianPrice } from '../utils/priceFormatter';

export default function OrderDataCard({
  order,
  clientUser,
  artistUser,
  images = [],
  selectedPackage,
  selectedExtras = [],
  onViewPackage,
  onViewInvoice,
  currentUserId,
  currentUser,
}) {
  const [showCarousel, setShowCarousel] = useState(false);
  const [showPackageDetail, setShowPackageDetail] = useState(false);
  const navigate = useNavigate();

  const extrasArray = Array.isArray(selectedExtras) ? selectedExtras : [];
  const isClientView = currentUserId === order?.client_id;
  const profileUser = isClientView ? clientUser : artistUser;
  const labelText = 'Pedido realizado por:';

  const profileImageUrl = profileUser?.profile_image 
    ? `http://localhost:5000/${profileUser.profile_image}`
    : '/default-profile.jpg';

  const total =
    (Number(selectedPackage?.price) || 0) +
    extrasArray.reduce((sum, e) => sum + (Number(e.price) || 0), 0);

  const handleUserClick = () => {
    if (!profileUser) return;
    
    if (currentUserId && profileUser.id === currentUserId) {
      if (profileUser.is_artist) {
        navigate('/artist-profile');
      } else {
        navigate('/profile');
      }
      return;
    }
    
    if (profileUser.is_artist === true || profileUser.is_artist === 1) {
      navigate(`/artist/${profileUser.id}`);
    } else {
      navigate(`/user/${profileUser.id}`);
    }
  };

  return (
    <>
      <div className="orderdata-card">
        {!showPackageDetail ? (
          <>
            {/* Usuario y fecha */}
            <div className="orderdata-row orderdata-row-top">
              <div className="orderdata-user-section">
                <span className="orderdata-user-label">{labelText}</span>
                {profileUser ? (
                  <div
                    className="orderdata-user"
                    style={{ cursor: 'pointer' }}
                    onClick={handleUserClick}
                    title="Ver perfil"
                  >
                    <img
                      src={profileImageUrl}
                      alt={profileUser?.username || 'Usuario'}
                      className="orderdata-avatar"
                      onError={(e) => {
                        e.target.src = '/default-profile.jpg';
                      }}
                    />
                    <span className="orderdata-username">{profileUser?.username || 'Usuario'}</span>
                  </div>
                ) : (
                  <div className="orderdata-user">
                    <img
                      src="/default-profile.jpg"
                      alt="Usuario"
                      className="orderdata-avatar"
                    />
                    <span className="orderdata-username">Usuario no disponible</span>
                  </div>
                )}
              </div>
              <div className="orderdata-date-section">
                <span className="orderdata-date-label">Pedido realizado el</span>
                <div className="orderdata-date-value">
                  {order?.created_at &&
                    new Date(order.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

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

            {/* Descripción */}
            <div className="orderdata-section">
              <div className="orderdata-label">Descripción:</div>
              <div className="orderdata-description">{order?.description || 'Sin descripción'}</div>
            </div>

            <ReferenceCarousel
              open={showCarousel}
              images={images}
              onClose={() => setShowCarousel(false)}
            />
          </>
        ) : (
          <div style={{ padding: '2rem 1.5rem 2rem 1.5rem' }}>
            <button
              className="order-preview-view-package-btn"
              style={{ marginBottom: 24 }}
              onClick={() => setShowPackageDetail(false)}
            >
              ← Volver
            </button>
            <div className="package-header-artist">
              <span className="package-title-artist">{selectedPackage?.title || selectedPackage?.name}</span>
            </div>
            <div className="package-content-artist">
              <div className="package-price-section">
                <span className="package-price-label">Precio</span>
                <span className="package-price-amount">{formatColombianPrice(selectedPackage?.price)}</span>
              </div>
              <div className="package-delivery-section">
                <span className="package-delivery-label">Tiempo estimado</span>
                <span className="package-delivery-time">
                  {selectedPackage?.delivery_time_days} {selectedPackage?.delivery_time_days === 1 ? 'día' : 'días'}
                </span>
              </div>
              <div className="package-description-section">
                <div className="package-desc-title">Descripción</div>
                <div className="package-desc-text">
                  {selectedPackage?.description ? (
                    <ul className="package-features-list">
                      {selectedPackage.description.split('\n').map((line, idx) =>
                        line.trim() && <li key={idx}>{line.trim()}</li>
                      )}
                    </ul>
                  ) : 'Sin descripción'}
                </div>
              </div>
              <div className="package-samples-section">
                <div className="package-samples-title">Muestra</div>
                {(selectedPackage?.reference_image1 || selectedPackage?.reference_image2) ? (
                  <div className="package-samples-grid">
                    {selectedPackage.reference_image1 && (
                      <img
                        src={`http://localhost:5000/${selectedPackage.reference_image1}`}
                        alt="Muestra 1"
                        className="package-sample-image"
                      />
                    )}
                    {selectedPackage.reference_image2 && (
                      <img
                        src={`http://localhost:5000/${selectedPackage.reference_image2}`}
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
        )}
      </div>

      <div className="odc-summary-price-card">
        <div className="odc-summary-price-breakdown">
          <div className="odc-summary-price-item">
            <span>{selectedPackage?.name || selectedPackage?.title || 'Paquete'}</span>
            <span className="odc-summary-price-badge">{formatColombianPrice(selectedPackage?.price || 0)}</span>
          </div>
          {extrasArray.map((extra) => (
            <div key={extra.id} className="odc-summary-price-item">
              <span>{extra.name}</span>
              <span className="odc-summary-price-badge">{formatColombianPrice(extra.price || 0)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="odc-summary-total-card">
        <div className="odc-summary-total-content">
          <h3 className="odc-summary-total-title">Valor total de la obra:</h3>
          <div className="odc-summary-total-note">Generado automáticamente</div>
        </div>
        <span className="odc-summary-total-badge">{formatColombianPrice(total)}</span>
      </div>
    </>
  );
}