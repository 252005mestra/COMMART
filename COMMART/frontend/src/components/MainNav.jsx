import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../context/UserContext'; // <-- Asegurar que esté importado

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
  // Callbacks para comunicación con páginas específicas
  onSearchResults,      // Para Home: envía resultados de búsqueda
  onStyleFilter,        // Para Home: controla carrusel y filtro de categorías
  onCarouselVisibility, // Para Home: controla visibilidad del carrusel
  // Props de configuración
  showCarouselByDefault = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useUser(); // <-- Agregar logout aquí
  
  // Estados del componente
  const [openMenu, setOpenMenu] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(null);
  
  // Estados para datos
  const [users, setUsers] = useState([]);
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  const menuRef = useRef();
  const iconsRef = useRef();

  // Verificar si estamos en Home
  const isHomePage = location.pathname === '/home';

  // Cargar datos iniciales (solo una vez)
  useEffect(() => {
    if (initialLoadDone) return;
    
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [usersRes, stylesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/auth/artists', { withCredentials: true }),
          axios.get('http://localhost:5000/api/auth/styles')
        ]);
        
        setUsers(usersRes.data);
        setStyles(stylesRes.data);
        setInitialLoadDone(true);
        
        // Solo enviar datos iniciales si estamos en Home
        if (isHomePage && onSearchResults) {
          onSearchResults(usersRes.data, null, '');
        }
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        if (isHomePage && onSearchResults) {
          onSearchResults([], 'Error al cargar artistas', '');
        }
        setInitialLoadDone(true);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [initialLoadDone, isHomePage, onSearchResults]);

  // Debounce para la búsqueda
  const debounceSearchRef = useRef();
  
  const performSearch = useCallback((term, usersList, stylesList) => {
    if (!isHomePage || !onSearchResults) return;
    
    if (!term || term.trim() === '') {
      // Filtrar el usuario actual de los resultados iniciales
      const filteredUsers = usersList.filter(user => profile?.id !== user.id);
      onSearchResults(filteredUsers, null, '');
      if (onCarouselVisibility) {
        onCarouselVisibility(showCarouselByDefault);
      }
      return;
    }

    // Buscar por artista - EXCLUIR PERFIL PROPIO
    const filteredByArtist = usersList.filter(user =>
      user.username.toLowerCase().includes(term.toLowerCase()) &&
      profile?.id !== user.id // <-- Excluir perfil propio
    );

    // Buscar por estilo - EXCLUIR PERFIL PROPIO
    const searchTermLower = term.toLowerCase();
    const matchingStyles = stylesList.filter(style => 
      style.name.toLowerCase().includes(searchTermLower)
    );

    let filteredByStyle = [];
    if (matchingStyles.length > 0) {
      filteredByStyle = usersList.filter(user => 
        user.styles && user.styles.some(userStyle => 
          matchingStyles.some(matchingStyle => 
            userStyle.toLowerCase().includes(matchingStyle.name.toLowerCase())
          )
        ) &&
        profile?.id !== user.id // <-- Excluir perfil propio
      );
    }

    // Combinar resultados y eliminar duplicados
    const combinedResults = [...filteredByArtist];
    filteredByStyle.forEach(styleUser => {
      if (!combinedResults.find(user => user.id === styleUser.id)) {
        combinedResults.push(styleUser);
      }
    });

    onSearchResults(combinedResults, null, term);
    
    // Ocultar carrusel durante búsqueda
    if (onCarouselVisibility) {
      onCarouselVisibility(false);
    }
  }, [isHomePage, onSearchResults, onCarouselVisibility, showCarouselByDefault, profile?.id]); // <-- Agregar profile?.id a las dependencias

  // Lógica de búsqueda con debounce
  useEffect(() => {
    if (!initialLoadDone || !users.length || !styles.length) return;
    
    // Limpiar timeout anterior
    if (debounceSearchRef.current) {
      clearTimeout(debounceSearchRef.current);
    }
    
    // Ejecutar búsqueda con delay
    debounceSearchRef.current = setTimeout(() => {
      setSelectedStyle(null);
      performSearch(searchTerm, users, styles);
    }, 300);

    return () => {
      if (debounceSearchRef.current) {
        clearTimeout(debounceSearchRef.current);
      }
    };
  }, [searchTerm, users, styles, initialLoadDone, performSearch]);

  // Lógica de filtro por estilo
  useEffect(() => {
    if (!isHomePage || !onSearchResults || !initialLoadDone || !users.length) return;
    if (searchTerm && searchTerm.trim() !== '') return; // No aplicar filtro si hay búsqueda activa
    
    const applyStyleFilter = async () => {
      if (!selectedStyle) {
        onSearchResults(users, null, '');
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/auth/artists/style/${selectedStyle.id}`,
          { withCredentials: true }
        );
        
        onSearchResults(response.data, null, '');
        
        if (onStyleFilter) {
          onStyleFilter(selectedStyle, showCarouselByDefault);
        }
      } catch (error) {
        console.error('Error al obtener artistas por estilo:', error);
        onSearchResults([], 'Error al obtener artistas por estilo', '');
      } finally {
        setLoading(false);
      }
    };

    applyStyleFilter();
  }, [selectedStyle, users, searchTerm, isHomePage, onSearchResults, onStyleFilter, showCarouselByDefault, initialLoadDone]);

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

  // Función pública para que CategoryFilter pueda filtrar por estilo
  const handleStyleSelect = useCallback((style) => {
    setSelectedStyle(style);
    setSearchTerm('');
  }, []);

  // Exponer función para uso externo (CategoryFilter)
  useEffect(() => {
    window.mainNavStyleSelect = handleStyleSelect;
    return () => {
      delete window.mainNavStyleSelect;
    };
  }, [handleStyleSelect]);

  // Sugerencias dinámicas - EXCLUIR PERFIL PROPIO
  const artistSuggestions = users
    .filter(user =>
      searchTerm &&
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
      profile?.id !== user.id // <-- Excluir perfil propio
    )
    .slice(0, 4);

  const styleSuggestions = styles
    .filter(style =>
      searchTerm &&
      style.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 4);

  // Función para alternar menús
  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  // Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Maneja selección de sugerencia de artista
  const handleArtistSuggestionClick = (username) => {
    const artist = artistSuggestions.find(u => u.username === username);
    if (artist) {
      navigate(`/artist/${artist.id}`);
      setSearchTerm('');
      setShowSuggestions(false);
    }
  };

  // Maneja selección de sugerencia de estilo
  const handleStyleSuggestionClick = (style) => {
    if (isHomePage) {
      setSelectedStyle(style);
      setSearchTerm('');
      setShowSuggestions(false);
    } else {
      navigate('/home', { state: { selectedStyle: style } });
    }
  };

  // Maneja el cambio en el input de búsqueda
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
  };

  // Maneja el submit de búsqueda (Enter)
  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      if (!isHomePage) {
        navigate('/home', { state: { searchTerm: searchTerm.trim() } });
      }
      setShowSuggestions(false);
    }
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

  // Función para obtener URL de imagen de perfil
  const getProfileImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-profile.jpg';

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
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
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
                    src={getProfileImageUrl(user.profile_image)} 
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
              <li onClick={() => navigate('/home')} style={{ cursor: 'pointer' }}>
                <House className='thick-icon' size={22} /> Inicio
              </li>
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
