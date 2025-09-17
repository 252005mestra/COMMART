import { useState } from 'react';
import ReferenceCarousel from './ReferenceCarousel';
import '../styles/orderdatacard.css';

export default function OrderDataCard({
  order,
  clientUser,
  images = [],
  selectedPackage,
  selectedExtras = [],
  onViewPackage,
}) {
  const [showCarousel, setShowCarousel] = useState(false);

  // Siempre trabajar con array
  const extrasArray = Array.isArray(selectedExtras) ? selectedExtras : [];

  // Formateo de precio
  const formatCOP = (num) =>
    num ? `${parseInt(num).toLocaleString('es-CO')}mil COP$` : '0 COP$';

  // Suma total
  const total =
    (selectedPackage?.price || 0) +
    extrasArray.reduce((sum, e) => sum + (e.price || 0), 0);

  return (
    <>
      {/* Card blanca */}
      <div className="orderdata-card">
        {/* Usuario y fecha */}
        <div className="orderdata-row orderdata-row-top">
          <div className="orderdata-user">
            <img
              src={
                clientUser?.profile_image
                  ? `http://localhost:5000/${clientUser.profile_image}`
                  : '/default-profile.jpg'
              }
              alt={clientUser?.username}
              className="orderdata-avatar"
            />
            <span className="orderdata-username">{clientUser?.username}</span>
          </div>
          <div className="orderdata-date">
            Pedido realizado el{' '}
            <b>
              {order?.created_at &&
                new Date(order.created_at).toLocaleDateString()}
            </b>
          </div>
        </div>
        {/* Referencias */}
        <div className="orderdata-section">
          <div className="orderdata-label">Referencias:</div>
          <div
            className="orderdata-references-stack"
            style={{ position: 'relative', height: 70, cursor: 'pointer' }}
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
                  position: 'absolute',
                  left: `${i * 35}px`,
                  width: 60,
                  height: 60,
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '2px solid #fff',
                  boxShadow: '0 2px 8px #0002',
                  zIndex: images.length - i,
                  background: '#eee',
                }}
              />
            ))}
          </div>
        </div>
        {/* Paquete y extras */}
        <div className="orderdata-details-grid">
          <div>
            <span className="orderdata-label">Paquete:</span>{' '}
            <span className="orderdata-package-name">
              {selectedPackage?.name || selectedPackage?.title}
            </span>
            <button
              className="orderdata-viewpackage-btn"
              onClick={onViewPackage}
            >
              Ver paquete
            </button>
          </div>
          <div>
            <span className="orderdata-label">Extras:</span>{' '}
            {extrasArray.length > 0
              ? extrasArray.map((e) => e.name).join(', ')
              : 'Ninguno'}
          </div>
        </div>
        {/* Descripción */}
        <div className="orderdata-section">
          <div className="orderdata-label">Descripción:</div>
          <div className="orderdata-description">{order?.description}</div>
        </div>
        {/* Card de precios */}
        <div className="orderdata-price-card">
          <div className="orderdata-price-breakdown">
            <div className="orderdata-price-item">
              <span>
                Paquete{' '}
                {selectedPackage?.name || selectedPackage?.title || ''}
              </span>
              <span className="orderdata-price-badge">
                {formatCOP(selectedPackage?.price)}
              </span>
            </div>
            {extrasArray.map((extra) => (
              <div key={extra.id} className="orderdata-price-item">
                <span>{extra.name}</span>
                <span className="orderdata-price-badge">
                  {formatCOP(extra.price)}
                </span>
              </div>
            ))}
          </div>
          <div className="orderdata-total-card">
            <span className="orderdata-total-title">Valor de la obra:</span>
            <span className="orderdata-total-badge">{formatCOP(total)}</span>
            <div className="orderdata-total-note">
              Generado automáticamente
            </div>
          </div>
        </div>
      </div>
      {/* Modal de referencias ampliadas */}
      <ReferenceCarousel
        open={showCarousel}
        images={images}
        onClose={() => setShowCarousel(false)}
      />
    </>
  );
}