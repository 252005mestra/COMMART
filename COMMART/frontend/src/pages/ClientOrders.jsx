import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import { useUser } from '../context/UserContext';

const ClientOrders = () => {
  const { profile } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const highlightOrderId = location.state?.highlightOrderId;

  useEffect(() => {
    // Si es artista, redirigir a /artist/orders
    if (profile?.is_artist) {
      navigate('/artist/orders', { replace: true });
      return;
    }
    const fetchOrders = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/orders/client', { withCredentials: true });
        setOrders(res.data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar pedidos.');
        setLoading(false);
      }
    };
    fetchOrders();
  }, [profile, navigate]);

  if (loading) return <div>Cargando pedidos...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <MainNav />
      <main className="main-content">
        <h2>Pedidos que has hecho</h2>
        {orders.length === 0 ? (
          <p>No has hecho pedidos.</p>
        ) : (
          orders.map(order => (
            <div
              key={order.id}
              className={`order-card${order.id === highlightOrderId ? ' highlighted' : ''}`}
            >
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
      </main>
      <Footer />
    </>
  );
};

export default ClientOrders;