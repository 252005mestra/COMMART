import OrdersSidebar from '../components/OrdersSidebar';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import { useUser } from '../context/UserContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/orders.css';

const ArtistOrders = () => {
  const { profile } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [orderToReject, setOrderToReject] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await axios.get('http://localhost:5000/api/orders/artist', { withCredentials: true });
      setOrders(res.data);
      setLoading(false);
    };
    fetchOrders();
  }, []);

  const handleAccept = async (orderId) => {
    await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, { status: 'in_progress' }, { withCredentials: true });
    setOrders(orders => orders.map(o => o.id === orderId ? { ...o, status: 'in_progress' } : o));
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    await axios.put(`http://localhost:5000/api/orders/${orderToReject}/status`, { status: 'rejected', reason: rejectionReason }, { withCredentials: true });
    setOrders(orders => orders.map(o => o.id === orderToReject ? { ...o, status: 'rejected', rejection_reason: rejectionReason } : o));
    setShowRejectModal(false);
    setRejectionReason('');
    setOrderToReject(null);
  };

  return (
    <>
      <MainNav />
      <div className="orders-layout">
        <OrdersSidebar />
        <main className="orders-main-content">
          <div className="orders-tabs">
            <span className="orders-tab active">Pedidos que me han realizado</span>
          </div>
          <div className="orders-header">
            <h2>Solicitudes Recibidas</h2>
          </div>
          <div className="orders-list">
            {loading ? (
              <div>Cargando...</div>
            ) : orders.length === 0 ? (
              <div>No tienes pedidos recibidos.</div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-card-left">
                    <div className="order-description">{order.description}</div>
                    <div className="order-status-actions">
                      {order.status === 'pending' && (
                        <>
                          <button onClick={() => handleAccept(order.id)}>Aceptar</button>
                          <button onClick={() => { setOrderToReject(order.id); setShowRejectModal(true); }}>Rechazar</button>
                        </>
                      )}
                      {order.status === 'in_progress' && (
                        <span className="order-status accepted">Aceptado</span>
                      )}
                      {order.status === 'rejected' && (
                        <span className="order-status rejected">Rechazado</span>
                      )}
                    </div>
                  </div>
                  <div className="order-card-right">
                    <div className="order-references">
                      <div>Referencias:</div>
                      <div className="order-images">
                        {order.references_image && order.references_image.split(',').map((img, idx) => (
                          <img
                            key={idx}
                            src={`http://localhost:5000/${img}`}
                            alt={`Referencia ${idx + 1}`}
                            className="order-reference-img"
                          />
                        ))}
                      </div>
                    </div>
                    <div>Paquete: {order.package_name || 'Estándar'}</div>
                    <div>Extras: {order.extras || 'Ninguno'}</div>
                    <div className="order-client-row">
                      <span>Pedido realizado por:</span>
                      <span className="order-client">{order.client_username || order.client_id}</span>
                    </div>
                    <div className="order-date-row">
                      Pedido recibido el {order.created_at && new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
      <ConfirmModal
        open={showRejectModal}
        message={
          <div>
            <div style={{ marginBottom: 16 }}>Motivo del rechazo</div>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Explica el motivo del rechazo"
              rows={3}
              style={{ width: '100%' }}
            />
          </div>
        }
        onCancel={() => setShowRejectModal(false)}
        onConfirm={handleReject}
        confirmText="Rechazar"
        cancelText="Cancelar"
        loading={false}
      />
      <Footer />
    </>
  );
};

export default ArtistOrders;