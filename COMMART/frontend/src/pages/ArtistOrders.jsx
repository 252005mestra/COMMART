import OrdersSidebar from '../components/OrdersSidebar';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import ArtistOrdersTabsSection from '../components/ArtistOrdersTabsSection';
import { useUser } from '../context/UserContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import '../styles/orders.css';

const ArtistOrders = () => {
  const { profile } = useUser();
  const [orders, setOrders] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [allExtras, setAllExtras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [orderToReject, setOrderToReject] = useState(null);
  const [alert, setAlert] = useState({ open: false, type: 'success', message: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, clientsRes, extrasRes] = await Promise.all([
          axios.get('http://localhost:5000/api/orders/artist', { withCredentials: true }),
          axios.get('http://localhost:5000/api/auth/users', { withCredentials: true }), // Obtener todos los usuarios/clientes
          axios.get('http://localhost:5000/api/packages/all/extras', { withCredentials: true }),
        ]);
        setOrders(ordersRes.data);
        setAllClients(clientsRes.data);
        setAllExtras(extrasRes.data);
        setLoading(false);
      } catch (err) {
        setAlert({ open: true, type: 'error', message: 'Error al cargar pedidos.' });
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAccept = async (orderId) => {
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderId}/status`, { status: 'in_progress' }, { withCredentials: true });
      setOrders(orders => orders.map(o => o.id === orderId ? { ...o, status: 'in_progress' } : o));
      setAlert({ open: true, type: 'success', message: 'Pedido aceptado correctamente.' });
    } catch (err) {
      setAlert({ open: true, type: 'error', message: 'Error al aceptar el pedido.' });
    }
  };

  const handleRejectClick = (orderId) => {
    setOrderToReject(orderId);
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setAlert({ open: true, type: 'error', message: 'Debes proporcionar un motivo para el rechazo.' });
      return;
    }
    try {
      await axios.put(`http://localhost:5000/api/orders/${orderToReject}/status`, { 
        status: 'rejected', 
        reason: rejectionReason 
      }, { withCredentials: true });
      
      setOrders(orders => orders.map(o => 
        o.id === orderToReject 
          ? { ...o, status: 'rejected', rejection_reason: rejectionReason } 
          : o
      ));
      
      setShowRejectModal(false);
      setRejectionReason('');
      setOrderToReject(null);
      setAlert({ open: true, type: 'success', message: 'Pedido rechazado.' });
    } catch (err) {
      setAlert({ open: true, type: 'error', message: 'Error al rechazar el pedido.' });
    }
  };

  if (loading) return (
    <>
      <MainNav />
      <div className="orders-layout">
        <OrdersSidebar />
        <main className="orders-main-content">
          <div>Cargando pedidos...</div>
        </main>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <MainNav />
      <div className="orders-layout">
        <OrdersSidebar />
        <main className="orders-main-content">
          <ArtistOrdersTabsSection
            orders={orders}
            allClients={allClients}
            allExtras={allExtras}
            onAccept={handleAccept}
            onReject={handleRejectClick}
          />
        </main>
      </div>
      
      <ConfirmModal
        open={showRejectModal}
        message={
          <div>
            <div style={{ marginBottom: 16, fontWeight: 700, fontFamily: "'Nunito Sans', sans-serif" }}>
              Motivo del rechazo
            </div>
            <textarea
              className="confirm-modal-textarea"
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Explica el motivo del rechazo"
            />
          </div>
        }
        onCancel={() => {
          setShowRejectModal(false);
          setRejectionReason('');
          setOrderToReject(null);
        }}
        onConfirm={handleReject}
        confirmText="Rechazar"
        cancelText="Cancelar"
      />

      <AlertModal
        open={alert.open}
        type={alert.type}
        message={alert.message}
        onClose={() => setAlert(a => ({ ...a, open: false }))}
      />
      
      <Footer />
    </>
  );
};

export default ArtistOrders;