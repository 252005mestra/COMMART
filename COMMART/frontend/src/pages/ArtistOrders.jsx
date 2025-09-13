import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import { useUser } from '../context/UserContext';
import AlertModal from '../components/AlertModal';

const ArtistOrders = () => {
  const { profile } = useUser();
  const [activeTab, setActiveTab] = useState('received');
  const [receivedOrders, setReceivedOrders] = useState([]);
  const [madeOrders, setMadeOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [orderToReject, setOrderToReject] = useState(null);

  // Estado para alertas
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });

  const location = useLocation();
  const navigate = useNavigate();
  const highlightOrderId = location.state?.highlightOrderId;

  useEffect(() => {
    // Si NO es artista, redirigir a /orders
    if (profile && !profile.is_artist) {
      navigate('/orders', { replace: true });
      return;
    }
    const fetchOrders = async () => {
      try {
        const [receivedRes, madeRes] = await Promise.all([
          axios.get('http://localhost:5000/api/orders/artist', { withCredentials: true }),
          axios.get('http://localhost:5000/api/orders/client', { withCredentials: true })
        ]);
        setReceivedOrders(receivedRes.data);
        setMadeOrders(madeRes.data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar pedidos.');
        setLoading(false);
      }
    };
    fetchOrders();
  }, [profile, navigate]);

  const updateOrderStatus = async (orderId, status, reason = '') => {
    await axios.put(
      `http://localhost:5000/api/orders/${orderId}/status`,
      { status, rejection_reason: reason },
      { withCredentials: true }
    );
  };

  const handleStatusChange = async (orderId, status) => {
    let reason = '';
    if (status === 'rejected') {
      reason = prompt('Motivo de rechazo:');
      if (!reason) return;
    }
    setActionLoading(orderId + status);
    try {
      await updateOrderStatus(orderId, status, reason);
      setReceivedOrders(orders =>
        orders.map(order =>
          order.id === orderId ? { ...order, status, rejection_reason: reason } : order
        )
      );
    } catch {
      setAlert({ open: true, type: 'error', message: 'Error al actualizar el estado.' });
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (orderId) => {
    setOrderToReject(orderId);
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    try {
      await updateOrderStatus(orderToReject, 'rejected', rejectionReason);
      setReceivedOrders(orders =>
        orders.map(order =>
          order.id === orderToReject ? { ...order, status: 'rejected', rejection_reason: rejectionReason } : order
        )
      );
      setShowRejectModal(false);
      setRejectionReason('');
      setOrderToReject(null);
    } catch {
      setAlert({ open: true, type: 'error', message: 'Error al rechazar el pedido' });
    }
  };

  if (loading) return <div>Cargando pedidos...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <MainNav />
      <main className="main-content">
        <div className="orders-tabs" style={{ marginBottom: 16 }}>
          <button
            className={activeTab === 'received' ? 'active' : ''}
            onClick={() => setActiveTab('received')}
          >
            Pedidos recibidos
          </button>
          <button
            className={activeTab === 'made' ? 'active' : ''}
            onClick={() => setActiveTab('made')}
            style={{ marginLeft: 8 }}
          >
            Pedidos hechos
          </button>
        </div>
        {activeTab === 'received' ? (
          <div>
            {receivedOrders.length === 0 ? (
              <p>No tienes pedidos recibidos.</p>
            ) : (
              receivedOrders.map(order => (
                <div
                  key={order.id}
                  className={`order-card${order.id === highlightOrderId ? ' highlighted' : ''}`}
                >
                  <div>
                    <b>Cliente:</b> {order.client_username || order.client_id}
                  </div>
                  <div>
                    <b>Descripción:</b> {order.description}
                  </div>
                  <div>
                    <b>Estado:</b> {order.status}
                    {order.status === 'rejected' && order.rejection_reason && (
                      <div>
                        <b>Motivo de rechazo:</b> {order.rejection_reason}
                      </div>
                    )}
                  </div>
                  <div>
                    <b>Imágenes de referencia:</b>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {order.references_image && order.references_image.split(',').map((img, idx) => (
                        <img
                          key={idx}
                          src={`http://localhost:5000/${img}`}
                          alt={`Referencia ${idx + 1}`}
                          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                        />
                      ))}
                    </div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    {order.status === 'pending' && (
                      <>
                        <button
                          disabled={actionLoading === order.id + 'in_progress'}
                          onClick={() => handleStatusChange(order.id, 'in_progress')}
                        >
                          Aceptar pedido
                        </button>
                        <button
                          disabled={actionLoading === order.id + 'rejected'}
                          onClick={() => openRejectModal(order.id)}
                        >
                          Rechazar pedido
                        </button>
                      </>
                    )}
                    {order.status === 'in_progress' && (
                      <button
                        disabled={actionLoading === order.id + 'completed'}
                        onClick={() => handleStatusChange(order.id, 'completed')}
                      >
                        Marcar como completado
                      </button>
                    )}
                  </div>
                  <div>
                    <Link to={`/orders/${order.id}`}>Ver proceso</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div>
            {madeOrders.length === 0 ? (
              <p>No has hecho pedidos.</p>
            ) : (
              madeOrders.map(order => (
                <div key={order.id} className="order-card">
                  <div>
                    <b>Artista:</b> {order.artist_username || order.artist_id}
                  </div>
                  <div>
                    <b>Descripción:</b> {order.description}
                  </div>
                  <div>
                    <b>Estado:</b> {order.status}
                    {order.status === 'rejected' && order.rejection_reason && (
                      <div>
                        <b>Motivo de rechazo:</b> {order.rejection_reason}
                      </div>
                    )}
                  </div>
                  <div>
                    <b>Imágenes de referencia:</b>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {order.references_image && order.references_image.split(',').map((img, idx) => (
                        <img
                          key={idx}
                          src={`http://localhost:5000/${img}`}
                          alt={`Referencia ${idx + 1}`}
                          style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Link to={`/orders/${order.id}`}>Ver proceso</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
      <Footer />

      {/* Modal para motivo de rechazo */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Motivo del rechazo</h3>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Explica el motivo del rechazo"
              rows={3}
              style={{ width: '100%' }}
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowRejectModal(false)}
                style={{ background: '#ccc' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                style={{ background: '#d9534f', color: '#fff' }}
                disabled={!rejectionReason.trim()}
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AlertModal para mostrar errores */}
      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert(a => ({ ...a, open: false }))}
      />
    </>
  );
};

export default ArtistOrders;