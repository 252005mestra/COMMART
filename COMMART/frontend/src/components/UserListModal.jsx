import React, { useState, useEffect } from 'react';
import { X, Search, Users, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/userlistmodal.css';

const UserListModal = ({ isOpen, onClose, artistId, type, title }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    } else {
      // Limpiar datos cuando se cierra
      setUsers([]);
      setFilteredUsers([]);
      setSearchTerm('');
    }
    // eslint-disable-next-line
  }, [isOpen, artistId, type]);

  // Filtrar usuarios cuando cambie el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Actualizar la función fetchUsers
  const fetchUsers = async () => {
    try {
      setLoading(true);
      let endpoint;
      
      if (type === 'followers') {
        endpoint = `/api/auth/artists/${artistId}/followers`;
      } else if (type === 'my-favorites') {
        endpoint = '/api/auth/user/favorite-artists'; // Mis artistas favoritos
      } else if (type === 'my-following') {
        endpoint = '/api/auth/user/followed-artists'; // Artistas que sigo
      }

      const response = await axios.get(`http://localhost:5000${endpoint}`, {
        withCredentials: true
      });
      
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId) => {
    onClose();
    navigate(`/artist/${userId}`);
  };

  const getProfileImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-profile.jpg';

  // Determinar el icono según el tipo
  const getModalIcon = () => {
    return type === 'followers' ? <Users size={24} /> : <Star size={24} />;
  };

  // Actualizar el texto vacío
  const getEmptyText = () => {
    if (searchTerm) return 'No se encontraron usuarios';
    
    switch(type) {
      case 'followers':
        return 'Este artista aún no tiene seguidores';
      case 'my-favorites':
        return 'Aún no tienes artistas favoritos';
      case 'my-following':
        return 'Aún no sigues a ningún artista';
      default:
        return 'No hay datos';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="artistlist-modal-overlay" onClick={onClose}>
      <div className="artistlist-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="artistlist-modal-header">
          <div className="artistlist-modal-title-section">
            <div className="artistlist-modal-icon">
              {getModalIcon()}
            </div>
            <h2 className="artistlist-modal-title">{title}</h2>
            <div className="artistlist-modal-count">
              ({loading ? '...' : filteredUsers.length})
            </div>
          </div>
          <button className="artistlist-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Search bar */}
        <div className="artistlist-modal-search-section">
          <div className="artistlist-modal-search-container">
            <Search size={18} className="artistlist-modal-search-icon" />
            <input
              type="text"
              placeholder={`Buscar entre ${users.length} usuario${users.length !== 1 ? 's' : ''}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="artistlist-modal-search-input"
            />
            {searchTerm && (
              <button
                className="artistlist-modal-clear-search-btn"
                onClick={() => setSearchTerm('')}
                tabIndex={-1}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Lista de usuarios */}
        {loading ? (
          <div className="artistlist-modal-loading">
            <div className="artistlist-modal-loading-spinner" />
            <span>Cargando...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="artistlist-modal-empty">
            <div className="artistlist-modal-empty-icon">
              <Users size={36} />
            </div>
            <div className="artistlist-modal-empty-title">{getEmptyText()}</div>
          </div>
        ) : (
          <ul className="artistlist-modal-users-list">
            {filteredUsers.map(user => (
              <li
                key={user.id}
                className="artistlist-modal-user-item"
                onClick={() => handleUserClick(user.id)}
              >
                <div className="artistlist-modal-user-avatar">
                  <img src={getProfileImageUrl(user.profile_image)} alt={user.username} />
                </div>
                <div className="artistlist-modal-user-info">
                  <span className="artistlist-modal-user-name">{user.username}</span>
                  {user.type && (
                    <span className="artistlist-modal-user-type">{user.type}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UserListModal;

