import React, { useRef, useState, useEffect } from 'react';
import MyOrderCard from './MyOrderCard';

const TABS = [
  { key: 'realizados', label: 'Pedidos Realizados' },
  { key: 'proceso', label: 'Pedidos en Proceso' },
  { key: 'finalizados', label: 'Pedidos Finalizados' },
];

const OrdersTabsSection = ({ orders, allExtras = [], allArtists = [] }) => {
  const [activeTab, setActiveTab] = useState('realizados');
  const cardsRef = useRef({});
  const [showMotivoModal, setShowMotivoModal] = useState(false);
  const [motivoText, setMotivoText] = useState('');

  // Detectar si hay highlightOrderId en el state de navegación
  useEffect(() => {
    const state = window.history.state && window.history.state.usr;
    const highlightOrderId = state && state.highlightOrderId;
    const highlightType = state && state.highlightType;

    if (highlightOrderId && orders.length > 0) {
      const order = orders.find(o => String(o.id) === String(highlightOrderId));
      if (!order) return;

      // Si es aceptado, ir a proceso y hacer scroll
      if (highlightType === 'accepted' && (order.status === 'accepted' || order.status === 'in_progress')) {
        setActiveTab('proceso');
        setTimeout(() => {
          if (cardsRef.current[highlightOrderId]) {
            cardsRef.current[highlightOrderId].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
      // Si es rechazado, ir a realizados y mostrar modal de motivo
      if (highlightType === 'rejected' && order.status === 'rejected') {
        setActiveTab('realizados');
        setTimeout(() => {
          setMotivoText(order.rejection_reason || 'Sin motivo especificado.');
          setShowMotivoModal(true);
        }, 300);
      }
    }
  }, [orders]);

  // Filtra los pedidos según el tab activo
  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'realizados':
        return orders.filter(
          o =>
            o.status === 'pending' ||
            o.status === 'rejected' ||
            o.status === 'accepted' ||
            o.status === 'in_progress'
        );
      case 'proceso':
        return orders.filter(o => o.status === 'in_progress' || o.status === 'accepted');
      case 'finalizados':
        return orders.filter(o => o.status === 'completed' || o.status === 'finalized');
      default:
        return orders;
    }
  };

  // Adaptar datos del pedido para MyOrderCard
  const mapOrderToCard = (order) => {
    // Referencias
    let references = [];
    if (order.references_image) {
      references = order.references_image.split(',').map(img => `http://localhost:5000/${img.trim()}`);
    }

    // Extras: mostrar nombres, no IDs
    let extrasIds = [];
    if (Array.isArray(order.extras)) {
      extrasIds = order.extras;
    } else if (typeof order.extras === 'string' && order.extras.trim()) {
      extrasIds = order.extras.split(',').map(e => e.trim());
    }
    // Mapear a nombres usando allExtras
    let extras = [];
    if (allExtras && allExtras.length > 0) {
      extras = extrasIds
        .map(id => {
          const found = allExtras.find(e => String(e.id) === String(id));
          return found ? found.name : null;
        })
        .filter(Boolean);
    }

    // Si no hay extras pero el campo extrasIds tiene valores, mostrar los IDs como fallback
    if ((!extras || extras.length === 0) && extrasIds.length > 0) {
      extras = extrasIds;
    }

    // Artista: buscar por ID en allArtists
    let artist = allArtists.find(a => String(a.id) === String(order.artist_id));
    let artistAvatar = artist?.profile_image
      ? `http://localhost:5000/${artist.profile_image}`
      : '/default-artist.jpg';
    let artistName = artist?.username || order.artist_username || order.artist_id;

    return {
      id: order.id,
      description: order.description,
      status: order.status === 'pending' || order.status === 'rejected' || order.status === 'accepted'
        ? (order.status === 'accepted' ? 'accepted' : order.status)
        : order.status,
      references,
      packageName: order.package_name || 'Estándar',
      extras,
      artistAvatar,
      artistName,
      artistId: artist?.id || order.artist_id,
      createdAt: order.created_at,
      rejectionReason: order.rejection_reason || 'Sin motivo especificado.',
    };
  };

  // Scroll al pedido en proceso (usado por botón IR)
  const handleGoToOrder = (orderId) => {
    setActiveTab('proceso');
    setTimeout(() => {
      if (cardsRef.current[orderId]) {
        cardsRef.current[orderId].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const filteredOrders = getFilteredOrders();

  // Modal para mostrar motivo de rechazo
  const MotivoModal = ({ open, motivo, onClose }) => {
    if (!open) return null;
    return (
      <div className="motivo-modal-overlay" onClick={onClose}>
        <div className="motivo-modal-content" onClick={e => e.stopPropagation()}>
          <h2 className="motivo-modal-title">Motivo de cancelación</h2>
          <div className="motivo-modal-content-section">
            <p className="motivo-modal-text">{motivo || 'Sin motivo especificado'}</p>
          </div>
          <button className="motivo-modal-button" onClick={onClose}>
            Aceptar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="profile-tabs-section-bg">
      <div className="profile-tabs-header">
        {TABS.map(tab => (
          <span
            key={tab.key}
            className={`profile-tab-title${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </span>
        ))}
      </div>

      <div className="profile-tabs-green-header">
        <h2>
          {activeTab === 'realizados' && 'Solicitudes Enviadas'}
          {activeTab === 'proceso' && 'Pedidos en Proceso'}
          {activeTab === 'finalizados' && 'Pedidos Finalizados'}
        </h2>
      </div>

      <div className="profile-tabs-content">
        {filteredOrders.length === 0 ? (
          <div className="profile-tabs-empty">
            No hay pedidos para mostrar.
          </div>
        ) : (
          <div className="profile-tabs-grid" style={{ gap: '2.5rem', alignItems: 'center' }}>
            {filteredOrders.map(order => {
              const cardData = mapOrderToCard(order);
              return (
                <div
                  key={order.id}
                  ref={el => { cardsRef.current[order.id] = el; }}
                  style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                >
                  <MyOrderCard
                    order={cardData}
                    onGoToOrder={handleGoToOrder}
                    showProcessView={activeTab === 'proceso'}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
      <MotivoModal open={showMotivoModal} motivo={motivoText} onClose={() => setShowMotivoModal(false)} />
    </div>
  );
};

export default OrdersTabsSection;