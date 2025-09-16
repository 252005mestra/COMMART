import React, { useRef, useState } from 'react';
import ArtistMyOrderCard from './ArtistMyOrderCard'; // ⭐ AÑADIR ESTE IMPORT

const TABS = [
  { key: 'recibidos', label: 'Pedidos Recibidos' },
  { key: 'proceso', label: 'Pedidos en Proceso' },
  { key: 'finalizados', label: 'Pedidos Finalizados' },
];

const ArtistOrdersTabsSection = ({ orders, allClients = [], allExtras = [], onAccept, onReject }) => {
  const [activeTab, setActiveTab] = useState('recibidos');
  const cardsRef = useRef({});

  // Filtra los pedidos según el tab activo
  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'recibidos':
        return orders.filter(o => o.status === 'pending');
      case 'proceso':
        return orders.filter(o => o.status === 'in_progress' || o.status === 'accepted');
      case 'finalizados':
        return orders.filter(o => o.status === 'completed' || o.status === 'finalized');
      default:
        return orders;
    }
  };

  // Adaptar datos del pedido para MyOrderCard (vista artista)
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
    
    let extras = [];
    if (allExtras && allExtras.length > 0) {
      extras = extrasIds
        .map(id => {
          const found = allExtras.find(e => String(e.id) === String(id));
          return found ? found.name : null;
        })
        .filter(Boolean);
    }

    if ((!extras || extras.length === 0) && extrasIds.length > 0) {
      extras = extrasIds;
    }

    // Cliente: buscar por ID en allClients
    let client = allClients.find(c => String(c.id) === String(order.client_id));
    let clientAvatar = client?.profile_image
      ? `http://localhost:5000/${client.profile_image}`
      : '/default-profile.jpg';
    let clientName = client?.username || order.client_username || order.client_id;

    return {
      id: order.id,
      description: order.description,
      status: order.status === 'pending' || order.status === 'rejected' || order.status === 'accepted'
        ? (order.status === 'accepted' ? 'accepted' : order.status)
        : order.status,
      references,
      packageName: order.package_name || 'Estándar',
      extras,
      clientAvatar, // Cambiado de artistAvatar a clientAvatar
      clientName,   // Cambiado de artistName a clientName
      clientId: client?.id || order.client_id, // Cambiado de artistId a clientId
      createdAt: order.created_at,
      rejectionReason: order.rejection_reason || 'Sin motivo especificado.',
    };
  };

  // Scroll al pedido en proceso
  const handleGoToOrder = (orderId) => {
    setActiveTab('proceso');
    setTimeout(() => {
      if (cardsRef.current[orderId]) {
        cardsRef.current[orderId].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const filteredOrders = getFilteredOrders();

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
          {activeTab === 'recibidos' && 'Solicitudes Recibidas'}
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
                  <ArtistMyOrderCard
                    order={cardData}
                    onGoToOrder={handleGoToOrder}
                    showProcessView={activeTab === 'proceso'}
                    onAccept={onAccept}
                    onReject={onReject}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistOrdersTabsSection;