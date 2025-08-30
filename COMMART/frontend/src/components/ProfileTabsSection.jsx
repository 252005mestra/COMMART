import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import InfoCard from './InfoCard';
import '../styles/profiletabs.css';
import { useUser } from '../context/UserContext';

const PAGE_SIZE = 6;

const ProfileTabsSection = ({ data, isArtist, isPublicView = false, onFavoriteToggle }) => {
  const [favoriteLoading, setFavoriteLoading] = useState({});
  
  // Estado para navegación de tabs
  const [tabStartIndex, setTabStartIndex] = useState(0);
  
  // ⭐ Estado interno para manejar la eliminación EN TIEMPO REAL
  const [removedFavoriteIds, setRemovedFavoriteIds] = useState(new Set());
  
  // ⭐ Función para obtener favoritos filtrados
  const getFilteredFavorites = useCallback(() => {
    const originalFavorites = data.favorites || [];
    return originalFavorites.filter(favorite => !removedFavoriteIds.has(favorite.id));
  }, [data.favorites, removedFavoriteIds]);

  // Definir tabs según el tipo de usuario y vista
  const getTabs = () => {
    if (isArtist) {
      if (isPublicView) {
        return [
          { key: 'packages', label: 'Paquetes' },
          { key: 'favorites', label: 'Favoritos' },
          { key: 'reviews', label: 'Reseñas' },
        ];
      } else {
        return [
          { key: 'packages', label: 'Paquetes' },
          { key: 'sales', label: 'Tus Ventas' },
          { key: 'purchases', label: 'Tus Compras' },
          { key: 'favorites', label: 'Tus Favoritos' },
          { key: 'reviews', label: 'Tus Reseñas' },
        ];
      }
    } else {
      const baseTabs = [
        { key: 'favorites', label: 'Favoritos' },
        { key: 'reviews', label: 'Tus Reseñas' },
      ];

      if (!isPublicView) {
        baseTabs.unshift({ key: 'purchases', label: 'Tus Compras' });
      }

      return baseTabs;
    }
  };

  const TABS = getTabs();
  const [activeTab, setActiveTab] = useState(TABS[0]?.key || 'favorites');
  const [page, setPage] = useState(1);

  // Configuración de navegación: mostrar máximo 3 tabs
  const MAX_VISIBLE_TABS = 3;
  const visibleTabs = TABS.slice(tabStartIndex, tabStartIndex + MAX_VISIBLE_TABS);
  const canGoLeft = tabStartIndex > 0;
  const canGoRight = tabStartIndex + MAX_VISIBLE_TABS < TABS.length;

  // Navegación de tabs
  const handleTabNavigation = (direction) => {
    if (direction === 'left' && canGoLeft) {
      setTabStartIndex(0);
    } else if (direction === 'right' && canGoRight) {
      const remainingTabs = TABS.length - MAX_VISIBLE_TABS;
      setTabStartIndex(remainingTabs);
    }
  };

  // Cambiar tab
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  // Datos a mostrar según tab con favoritos filtrados
  const getTabData = useCallback((tabKey) => {
    switch (tabKey) {
      case 'packages':
        return data.packages || [];
      case 'sales':
        return data.sales || [];
      case 'purchases':
        return data.purchases || [];
      case 'favorites':
        return getFilteredFavorites(); // ⭐ USAR FAVORITOS FILTRADOS
      case 'reviews':
        return data.reviews || [];
      default:
        return [];
    }
  }, [data, getFilteredFavorites]);

  const currentData = getTabData(activeTab);
  const totalItems = currentData.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const paginatedItems = currentData.slice(startIndex, startIndex + PAGE_SIZE);

  // Ajustar página si queda vacía
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  // Reset cuando cambian los datos externos
  useEffect(() => {
    setRemovedFavoriteIds(new Set());
  }, [data]);

  // Renderizar paginación
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const buttons = [];
    const maxVisibleButtons = 5;
    const startPage = Math.max(1, page - Math.floor(maxVisibleButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    if (page > 1) {
      buttons.push(
        <button key="prev" onClick={() => setPage(page - 1)}>‹</button>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={i === page ? 'active' : ''}
          onClick={() => setPage(i)}
        >
          {i}
        </button>
      );
    }

    if (page < totalPages) {
      buttons.push(
        <button key="next" onClick={() => setPage(page + 1)}>›</button>
      );
    }

    return <div className="profile-pagination">{buttons}</div>;
  };

  // Obtener texto del header
  const getHeaderText = () => {
    const tab = TABS.find(t => t.key === activeTab);
    return tab ? tab.label : 'Datos';
  };

  // Función para renderizar contenido de cards
  const renderCardContent = (activeTab, item) => {
    switch (activeTab) {
      case 'packages':
        return (
          <>
            <img src={item.image || '/default-package.jpg'} alt={item.title} />
            <div className="profile-tabs-card-info">
              <span className="profile-tabs-card-title">{item.title}</span>
              <span className="profile-tabs-card-price">{item.price}</span>
              <span className="profile-tabs-card-date">Creado {item.createdDate}</span>
            </div>
          </>
        );
      case 'purchases':
        return (
          <>
            <img src={item.image} alt={item.title} />
            <div className="profile-tabs-card-info">
              <span className="profile-tabs-card-title">{item.artistName}</span>
              <span className="profile-tabs-card-date">Pedido {item.orderDate}</span>
              <span className="profile-tabs-card-date">Entregado {item.deliveryDate}</span>
              <span className="profile-tabs-card-price">{item.price}</span>
            </div>
          </>
        );
      case 'sales':
        return (
          <>
            <img src={item.image} alt={item.title} />
            <div className="profile-tabs-card-info">
              <span className="profile-tabs-card-title">{item.clientName}</span>
              <span className="profile-tabs-card-date">Vendido {item.saleDate}</span>
              <span className="profile-tabs-card-price">{item.price}</span>
            </div>
          </>
        );
      case 'reviews':
        return (
          <>
            <div className="profile-tabs-card-info">
              <span className="profile-tabs-card-title">{item.artistName}</span>
              <span className="profile-tabs-card-rating">★★★★☆ ({item.rating})</span>
              <span className="profile-tabs-card-review">{item.comment}</span>
            </div>
          </>
        );
      default:
        return <div>Contenido no disponible</div>;
    }
  };

  // URLs de imágenes
  const getPortfolioImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-artist.jpg';

  const getProfileImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-profile.jpg';

  // Click en artista
  const handleArtistClick = (artist) => {
    window.location.href = `/artist/${artist.id}`;
  };

  // ⭐ FUNCIÓN DIRECTA: Quitar de favoritos SIN MODAL
  const handleFavoriteToggle = async (artist) => {
    if (favoriteLoading[artist.id]) return;
    // Actualización optimista: quitar de favoritos localmente
    setFavoriteLoading(prev => ({ ...prev, [artist.id]: true }));
    setRemovedFavoriteIds(prev => new Set([...prev, artist.id]));

    try {
      if (onFavoriteToggle) {
        await onFavoriteToggle(artist); // Llama a removeFavoriteArtist y fetchProfile
      }
    } catch (error) {
      // Revertir si falla
      setRemovedFavoriteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(artist.id);
        return newSet;
      });
      alert('Error al quitar de favoritos. Inténtalo de nuevo.');
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [artist.id]: false }));
    }
  };

  const headerText = getHeaderText();

  return (
    <div className="profile-tabs-section-bg">
      <div className="profile-tabs-header">
        {canGoLeft && (
          <button 
            className="profile-tab-nav-arrow profile-tab-nav-left"
            onClick={() => handleTabNavigation('left')}
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <div className="profile-tabs-visible-container">
          {visibleTabs.map(tab => (
            <span
              key={tab.key}
              className={`profile-tab-title${activeTab === tab.key ? ' active' : ''}`}
              onClick={() => handleTabClick(tab.key)}
            >
              {tab.label}
            </span>
          ))}
        </div>

        {canGoRight && (
          <button 
            className="profile-tab-nav-arrow profile-tab-nav-right"
            onClick={() => handleTabNavigation('right')}
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      <div className="profile-tabs-green-header">
        <h2>{headerText}</h2>
      </div>

      <div className="profile-tabs-content">
        {paginatedItems.length === 0 ? (
          <div className="profile-tabs-empty">
            {activeTab === 'favorites' && currentData.length === 0 ? 
              'No tienes artistas favoritos' : 
              'No hay datos para mostrar.'
            }
          </div>
        ) : (
          <div className={activeTab === 'favorites' ? 'profile-tabs-favorites-grid' : 'profile-tabs-grid'}>
            {activeTab === 'favorites' ? (
              paginatedItems.map((artist, index) => (
                <InfoCard
                  key={`favorite-${artist.id}-${index}`}
                  image={getPortfolioImageUrl(artist.portfolio_image)}
                  avatar={getProfileImageUrl(artist.profile_image)}
                  title={artist.username}
                  subtitle={`${artist.followers || 0} Followers`}
                  tags={artist.styles || []}
                  description={artist.description}
                  onClick={() => handleArtistClick(artist)}
                  asLink={false}
                  // Props para el botón de favoritos (solo en vista privada)
                  showFavoriteButton={!isPublicView}
                  isFavorite={true}
                  onFavoriteClick={() => handleFavoriteToggle(artist)} // ⭐ DIRECTO SIN MODAL
                  favoriteLoading={favoriteLoading[artist.id] || false}
                />
              ))
            ) : (
              paginatedItems.map((item, idx) => (
                <div className="profile-tabs-card" key={`${activeTab}-${item.id || idx}`}>
                  {renderCardContent(activeTab, item)}
                </div>
              ))
            )}
          </div>
        )}
        
        {renderPagination()}
      </div>
    </div>
  );
};

export default ProfileTabsSection;

