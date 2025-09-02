import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Tag,
  Package, 
  RefreshCw, 
  CheckCircle, 
  DollarSign, 
  MessageCircle, 
  Palette
} from 'lucide-react';

import '../styles/navbar.css';

const MainNav = ({
  onSearchResults,
  onStyleFilter,
  onCarouselVisibility,
  showCarouselByDefault = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, logout } = useUser();

  const [openMenu, setOpenMenu] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(null);

  const [users, setUsers] = useState([]);
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const menuRef = useRef();
  const iconsRef = useRef();

  const isHomePage = location.pathname === '/home';

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
        if (isHomePage && onSearchResults) {
          onSearchResults(usersRes.data, null, '');
        }
      } catch (error) {
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

  const debounceSearchRef = useRef();

  const performSearch = useCallback((term, usersList, stylesList) => {
    if (!isHomePage || !onSearchResults) return;
    if (!term || term.trim() === '') {
      const filteredUsers = usersList.filter(user => profile?.id !== user.id);
      onSearchResults(filteredUsers, null, '');
      if (onCarouselVisibility) onCarouselVisibility(showCarouselByDefault);
      return;
    }
    const filteredByArtist = usersList.filter(user =>
      user.username.toLowerCase().includes(term.toLowerCase()) &&
      profile?.id !== user.id
    );
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
        profile?.id !== user.id
      );
    }
    const combinedResults = [...filteredByArtist];
    filteredByStyle.forEach(styleUser => {
      if (!combinedResults.find(user => user.id === styleUser.id)) {
        combinedResults.push(styleUser);
      }
    });
    onSearchResults(combinedResults, null, term);
    if (onCarouselVisibility) onCarouselVisibility(false);
  }, [isHomePage, onSearchResults, onCarouselVisibility, showCarouselByDefault, profile?.id]);

  useEffect(() => {
    if (!initialLoadDone || !users.length || !styles.length) return;
    if (debounceSearchRef.current) clearTimeout(debounceSearchRef.current);
    debounceSearchRef.current = setTimeout(() => {
      setSelectedStyle(null);
      performSearch(searchTerm, users, styles);
    }, 300);
    return () => {
      if (debounceSearchRef.current) clearTimeout(debounceSearchRef.current);
    };
  }, [searchTerm, users, styles, initialLoadDone, performSearch]);

  useEffect(() => {
    if (!isHomePage || !onSearchResults || !initialLoadDone || !users.length) return;
    if (searchTerm && searchTerm.trim() !== '') return;
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
        if (onStyleFilter) onStyleFilter(selectedStyle, showCarouselByDefault);
      } catch (error) {
        onSearchResults([], 'Error al obtener artistas por estilo', '');
      } finally {
        setLoading(false);
      }
    };
    applyStyleFilter();
  }, [selectedStyle, users, searchTerm, isHomePage, onSearchResults, onStyleFilter, showCarouselByDefault, initialLoadDone]);

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

  const handleStyleSelect = useCallback((style) => {
    setSelectedStyle(style);
    setSearchTerm('');
  }, []);

  useEffect(() => {
    window.mainNavStyleSelect = handleStyleSelect;
    return () => {
      delete window.mainNavStyleSelect;
    };
  }, [handleStyleSelect]);

  const artistSuggestions = users
    .filter(user =>
      searchTerm &&
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
      profile?.id !== user.id
    )
    .slice(0, 4);

  const styleSuggestions = styles
    .filter(style =>
      searchTerm &&
      style.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 4);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {}
  };

  const handleArtistSuggestionClick = (username) => {
    const artist = artistSuggestions.find(u => u.username === username);
    if (artist) {
      navigate(`/artist/${artist.id}`);
      setSearchTerm('');
      setShowSuggestions(false);
    }
  };

  const handleStyleSuggestionClick = (style) => {
    if (isHomePage) {
      setSelectedStyle(style);
      setSearchTerm('');
      setShowSuggestions(false);
    } else {
      navigate('/home', { state: { selectedStyle: style } });
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      if (!isHomePage) {
        navigate('/home', { state: { searchTerm: searchTerm.trim() } });
      }
      setShowSuggestions(false);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 100);
  };

  const hasSuggestions = ((artistSuggestions?.length ?? 0) > 0 || (styleSuggestions?.length ?? 0) > 0) && searchTerm;

  const handleProfileClick = () => {
    if (profile?.is_artist) {
      navigate('/artist-profile');
    } else {
      navigate('/profile');
    }
    setOpenMenu(null);
  };

  const getProfileImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-profile.jpg';

  const handleArtistClick = (artistId) => {
    if (profile && String(profile.id) === String(artistId)) {
      if (profile.is_artist) {
        navigate('/artist-profile');
      } else {
        navigate('/profile');
      }
    } else {
      const foundUser = users.find(user => user.id === artistId);
      if (foundUser && foundUser.is_artist) {
        navigate(`/artist/${artistId}`);
      } else {
        navigate(`/user/${artistId}`);
      }
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/notifications', { withCredentials: true });
        setNotifications(res.data);
      } catch (err) {
        setNotifications([]);
      }
    };
    fetchNotifications();
  }, []);

  // NOTIFICACIONES: Redirección completa y funcional
  const handleNotificationClick = (notification) => {
    setOpenMenu(null);

    if (!notification.is_read) {
      markNotificationAsRead(notification.id);
    }

    // Redirigir según tipo y existencia de order_id
    if (
      notification.type === 'order_phase_updated' ||
      notification.type === 'order_completed' ||
      notification.type === 'order_paid' ||
      notification.type === 'new_message' ||
      notification.type === 'new_sample' ||
      notification.type === 'sample_uploaded' ||
      notification.type === 'new_order' ||
      notification.type === 'order_created'
    ) {
      if (notification.order_id) {
        // Agrega un query param único para forzar el montaje
        const uniqueKey = Date.now();
        navigate(`/orders/${notification.order_id}?notif=${uniqueKey}`, {
          state: {
            phase: notification.phase || undefined,
            messageId: notification.message_id || undefined
          }
        });
        return;
      }
      if (notification.related_order_id) {
        navigate(`/orders/${notification.related_order_id}`);
        return;
      }
      // Si es artista y no hay order_id, ir a pedidos de artista
      if (profile?.is_artist) {
        navigate('/artist/orders');
        return;
      }
      // Si es cliente y no hay order_id, ir a pedidos de cliente
      navigate('/orders');
      return;
    }

    // Por defecto, ir a home
    navigate('/home');
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {},
        { withCredentials: true }
      );
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
    } catch (error) {}
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order':
      case 'order_created':
        return <Package size={18} />;
      case 'order_phase_updated':
        return <RefreshCw size={18} />;
      case 'order_completed':
        return <CheckCircle size={18} />;
      case 'order_paid':
        return <DollarSign size={18} />;
      case 'new_message':
        return <MessageCircle size={18} />;
      case 'new_sample':
      case 'sample_uploaded':
        return <Palette size={18} />;
      default:
        return <Bell size={18} />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
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
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
            onFocus={() => setShowSuggestions(true)}
            onBlur={handleBlur}
            autoComplete='off'
          />
          {showSuggestions && hasSuggestions && (
            <ul className='suggestions-list'>
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
              <li
                onClick={() => {
                  if (profile?.is_artist) {
                    navigate('/artist/orders');
                  } else {
                    navigate('/orders');
                  }
                  setOpenMenu(null);
                }}
              >
                <ClipboardPenLine size={22} />
                <span>Pedidos</span>
              </li>
              <li onClick={handleLogout} style={{ cursor: 'pointer' }}>
                <LogOut className='thick-icon' size={22} /> Cerrar sesión
              </li>
            </ul>
          </div>
        )}

        {openMenu === 'notifications' && (
          <div className='notifications-dropdown modern-dropdown'>
            <div className='menu-header'>
              Notificaciones
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="unread-count">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </div>
            
            <div className='notifications-list'>
              {notifications.length === 0 ? (
                <div className='no-notifications'>
                  Sin notificaciones
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="notification-content">
                      <div className="notification-title">
                        {notification.title || 'Notificación'}
                      </div>
                      <div className="notification-message">
                        {notification.message}
                      </div>
                      <div className="notification-time">
                        {formatTimeAgo(notification.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MainNav;
