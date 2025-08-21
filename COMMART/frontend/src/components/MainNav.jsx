import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../context/UserContext';

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
  Menu,
  Tag
} from 'lucide-react';

import '../styles/navbar.css';

const MainNav = ({ 
  searchTerm, 
  setSearchTerm, 
  artistSuggestions,
  styleSuggestions = [],
  getProfileImageUrl,
  onStyleSelect 
}) => {
  const navigate = useNavigate();
  const { profile, logout } = useUser();
  const [openMenu, setOpenMenu] = useState(null); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  const menuRef = useRef();
  const iconsRef = useRef();

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target) &&
        iconsRef.current && !iconsRef.current.contains(event.target)
      ) {
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
      await logout();
      window.location.href = '/'; // Redirige al landing y limpia el estado
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Maneja selección de sugerencia de artista
  const handleArtistSuggestionClick = (username) => {
    const artist = artistSuggestions.find(u => u.username === username);
    if (artist) {
      navigate(`/artist/${artist.id}`);
    } else {
      setSearchTerm(username);
      setShowSuggestions(false);
    }
  };

  // Maneja selección de sugerencia de estilo
  const handleStyleSuggestionClick = (style) => {
    setSearchTerm('');
    setShowSuggestions(false);
    onStyleSelect(style);
  };

  // Oculta sugerencias al perder foco
  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 100);
  };

  // Verificar si hay sugerencias para mostrar
  const hasSuggestions = ((artistSuggestions?.length ?? 0) > 0 || (styleSuggestions?.length ?? 0) > 0) && searchTerm;

  // Maneja el click en el perfil
  const handleProfileClick = () => {
    navigate('/profile');
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
            placeholder='Buscar'
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={handleBlur}
            autoComplete='off'
          />
          {showSuggestions && hasSuggestions && (
            <ul className='suggestions-list'>
              {/* Sugerencias de artistas */}
              {artistSuggestions.map(user => (
                <li
                  key={`artist-${user.id}`}
                  className='suggestion-item'
                  onMouseDown={() => handleArtistSuggestionClick(user.username)}
                >
                  <img 
                    src={getProfileImageUrl ? getProfileImageUrl(user.profile_image) : '/default-profile.jpg'} 
                    alt={user.username}
                    className='suggestion-avatar'
                  />
                  <div className='suggestion-content'>
                    <span className='suggestion-username'>{user.username}</span>
                    <span className='suggestion-type'>Artista</span>
                  </div>
                </li>
              ))}
              
              {/* Sugerencias de estilos */}
              {styleSuggestions.map(style => (
                <li
                  key={`style-${style.id}`}
                  className='suggestion-item style-suggestion'
                  onMouseDown={() => handleStyleSuggestionClick(style)}
                >
                  <div className='suggestion-style-icon'>
                    <Tag size={20} />
                  </div>
                  <div className='suggestion-content'>
                    <span className='suggestion-username'>{style.name}</span>
                    <span className='suggestion-type'>Estilo</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className='navbar-actions' ref={iconsRef}>
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
              <li onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
                <CircleUserRound className='thick-icon' size={22} /> Perfil
              </li>
              <li onClick={() => navigate('/edit-profile')} style={{ cursor: 'pointer' }}>
                <SquarePen className='thick-icon' size={22} /> Editar cuenta
              </li>
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
