import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Iconos
import logo from '../assets/LogoCOMMART.png';
import {
  Bell,
  CircleUserRound,
  SquarePen,
  ClipboardPenLine,
  LogOut,
  House,
  Crown,
  Mail,
  MessageSquareText,
  Search,
  Menu
} from 'lucide-react';

import '../styles/navbar.css'

const NavBar = () => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null); 
  const menuRef = useRef();

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Función para alternar menús y cerrar otros
  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <>
      <nav className='Navbar' aria-label='Navegación principal'>
        <button onClick={() => navigate('/home')} className='Logo'>
            <img src={logo} alt='Logo COMMART'/>
            <span>COMMART</span>
        </button>
        <div className="Navbar-search">
          <Search className="search-icon" size={24} />
          <input type="text" placeholder="Buscar" />
        </div>
        <div className="Navbar-actions">
          <Bell
            className="thick-icon notifications"
            onClick={() => toggleMenu('notifications')}
            aria-label="Notificaciones"
            size={28}
          />
          <CircleUserRound
            className="thick-icon profile"
            onClick={() => toggleMenu('profile')}
            aria-label="Perfil"
            size={28}
          />
          <Menu
            className="thick-icon menu"
            onClick={() => toggleMenu('menu')}
            aria-label="Menú"
            size={28}
          />
        </div>
      </nav>

      <div ref={menuRef}>
        {openMenu === 'menu' && (
          <div className="Menu-Dropdown Modern-Dropdown">
            <div className="Menu-Header">Menú</div>
            <ul>
              <li><House className="thick-icon" size={22} /> Inicio</li>
              <li><Crown className="thick-icon" size={22} style={{ color: '#FFCD29' }} /> Premium</li>
              <li><Mail className="thick-icon" size={22} /> Buzón de sugerencias</li>
              <li><MessageSquareText className="thick-icon" size={22} /> Blog</li>
            </ul>
          </div>
        )}

        {openMenu === 'profile' && (
          <div className="Profile-Dropdown Modern-Dropdown">
            <div className="Menu-Header">Perfil</div>
            <ul>
              <li><CircleUserRound className="thick-icon" size={22} /> Perfil</li>
              <li><SquarePen className="thick-icon" size={22} /> Editar cuenta</li>
              <li><ClipboardPenLine className="thick-icon" size={22} /> Pedidos</li>
              <li><LogOut className="thick-icon" size={22} /> Cerrar sesión</li>
            </ul>
          </div>
        )}

        {openMenu === 'notifications' && (
          <div className="Notifications-Dropdown Modern-Dropdown">
            <div className="Menu-Header">Notificaciones</div>
            <div className="Notifications-Tabs">
              <button>Leídos</button>
              <button>No leídos</button>
            </div>
            <div className="Notifications-List">
              <div className="Notification-Card">
                  {/* Aqui va el mapeo de notificaciones */}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NavBar;
