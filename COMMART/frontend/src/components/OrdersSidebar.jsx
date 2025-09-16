import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { FilePenLine, PencilRuler } from 'lucide-react';

const OrdersSidebar = () => {
  const { profile } = useUser();
  const location = useLocation();

  if (!profile) return null;

  // Construir las opciones del menú dinámicamente
  const links = [];
  if (profile.is_artist) {
    links.push(
      <Link
        key="artist-orders"
        to="/artist/orders"
        className={location.pathname === '/artist/orders' ? 'active' : ''}
      >
        <PencilRuler size={24} style={{ marginRight: 8 }} /> Pedidos que me han realizado
      </Link>
    );
  }
  links.push(
    <Link
      key="client-orders"
      to="/orders"
      className={location.pathname === '/orders' ? 'active' : ''}
    >
      <FilePenLine size={24} style={{ marginRight: 8 }} /> Pedidos que he realizado
    </Link>
  );

  return (
    <aside className="orders-sidebar">
      <h3>Pedidos</h3>
      <nav>
        {links}
      </nav>
    </aside>
  );
};

export default OrdersSidebar;