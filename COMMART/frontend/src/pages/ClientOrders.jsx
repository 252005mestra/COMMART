import OrdersSidebar from '../components/OrdersSidebar';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import { useUser } from '../context/UserContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import '../styles/orders.css';
import OrdersTabsSection from '../components/OrdersTabsSection';

const ClientOrders = () => {
  const { profile } = useUser();
  const [orders, setOrders] = useState([]);
  const [allArtists, setAllArtists] = useState([]); // <-- Nuevo estado
  const [allExtras, setAllExtras] = useState([]);   // <-- Nuevo estado
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const highlightOrderId = location.state?.highlightOrderId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, artistsRes, extrasRes] = await Promise.all([
          axios.get('http://localhost:5000/api/orders/client', { withCredentials: true }),
          axios.get('http://localhost:5000/api/auth/artists', { withCredentials: true }),
          axios.get('http://localhost:5000/api/packages/all/extras', { withCredentials: true }), // <-- CAMBIA AQUÍ
        ]);
        setOrders(ordersRes.data);
        setAllArtists(artistsRes.data);
        setAllExtras(extrasRes.data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar pedidos.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div>Cargando pedidos...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <MainNav />
      <div className="orders-layout">
        <OrdersSidebar />
        <main className="orders-main-content">
          <OrdersTabsSection
            orders={orders}
            allArtists={allArtists}
            allExtras={allExtras}
          />
        </main>
      </div>
      <Footer />
    </>
  );
};

export default ClientOrders;