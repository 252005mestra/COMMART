import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

import '../styles/navbar.css';

const MainNav = ({ searchTerm, setSearchTerm, artistSuggestions = [] }) => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null); 
  const [showSuggestions, setShowSuggestions] = useState(false);
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

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
      navigate('/');
      window.location.reload(); // Opcional: fuerza recarga para limpiar estado
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Maneja selección de sugerencia
  const handleSuggestionClick = (username) => {
    setSearchTerm(username);
    setShowSuggestions(false);
  };

  // Oculta sugerencias al perder foco
  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 100);
  };

  return (
    <>
      <nav className='navbar' aria-label='Navegación principal'>
        <button onClick={() => navigate('/home')} className='logo'>
            <img src={logo} alt='Logo COMMART'/>
            <span>COMMART</span>
        </button>
        <div className='navbar-search' style={{ position: 'relative' }}>
          <Search className='search-icon' size={24} />
          <input
            type='text'
            placeholder='Buscar artista'
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={handleBlur}
            autoComplete='off'
          />
          {showSuggestions && artistSuggestions.length > 0 && (
            <ul className="suggestions-list">
              {artistSuggestions.map(user => (
                <li
                  key={user.id}
                  className="suggestion-item"
                  onMouseDown={() => handleSuggestionClick(user.username)}
                >
                  {user.username}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className='navbar-actions'>
          <Bell
            className='thick-icon notifications'
            onClick={() => toggleMenu('notifications')}
            aria-label='Notificaciones'
            size={28}
          />
          <CircleUserRound
            className='thick-icon profile'
            onClick={() => toggleMenu('profile')}
            aria-label='Perfil'
            size={28}
          />
          <Menu
            className='thick-icon menu'
            onClick={() => toggleMenu('menu')}
            aria-label='Menú'
            size={28}
          />
        </div>
      </nav>

      <div ref={menuRef}>
        {openMenu === 'menu' && (
          <div className='menu-dropdown modern-dropdown'>
            <div className='menu-header'>Menú</div>
            <ul>
              <li><House className='thick-icon' size={22} /> Inicio</li>
              <li><Crown className='thick-icon' size={22} style={{ color: '#FFCD29' }} /> Premium</li>
              <li><Mail className='thick-icon' size={22} /> Buzón de sugerencias</li>
              <li><MessageSquareText className='thick-icon' size={22} /> Blog</li>
            </ul>
          </div>
        )}

        {openMenu === 'profile' && (
          <div className='profile-dropdown modern-dropdown'>
            <div className='menu-header'>Perfil</div>
            <ul>
              <li><CircleUserRound className='thick-icon' size={22} /> Perfil</li>
              <li><SquarePen className='thick-icon' size={22} /> Editar cuenta</li>
              <li><ClipboardPenLine className='thick-icon' size={22} /> Pedidos</li>
              <li onClick={handleLogout} style={{ cursor: 'pointer' }}>
                <LogOut className='thick-icon' size={22} /> Cerrar sesión
              </li>
            </ul>
          </div>
        )}

        {openMenu === 'notifications' && (
          <div className='notifications-dropdown modern-dropdown'>
            <div className='menu-header'>Notificaciones</div>
            <div className='notifications-tabs'>
              <button>Leídos</button>
              <button>No leídos</button>
            </div>
            <div className='notifications-list'>
              <div className='notification-card'>
                  {/* Aqui va el mapeo de notificaciones */}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MainNav;
