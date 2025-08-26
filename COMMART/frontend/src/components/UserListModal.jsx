import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, Users, Star, CircleUserRound } from 'lucide-react';
import axios from 'axios';
import '../styles/userlistmodal.css';

const UserListModal = ({ isOpen, onClose, artistId, type, title }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && artistId) {
      fetchUsers();
    } else {
      // Limpiar datos cuando se cierra
      setUsers([]);
      setFilteredUsers([]);
      setSearchTerm('');
    }
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
      } else if (type === 'favorites') {
        endpoint = `/api/auth/artists/${artistId}/favorited-by`; // Quién tiene al artista como favorito
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
      case 'favorites':
        return 'Este artista aún no está en favoritos de nadie';
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-list-modal" onClick={e => e.stopPropagation()}>
        {/* Header mejorado con icono */}
        <div className="modal-header">
          <div className="modal-title-section">
            <div className="modal-icon">
              {getModalIcon()}
            </div>
            <h2 className="modal-title">{title}</h2>
            <div className="modal-count">
              ({loading ? '...' : filteredUsers.length})
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Search bar mejorada */}
        <div className="modal-search-section">
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder={`Buscar entre ${users.length} usuario${users.length !== 1 ? 's' : ''}...`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Content con scroll personalizado */}
        <div className="modal-content">
          {loading ? (
            <div className="modal-loading">
              <div className="loading-spinner"></div>
              <p>Cargando usuarios...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="modal-empty">
              <div className="empty-icon">
                {type === 'followers' ? <Users size={48} /> : <Star size={48} />}
              </div>
              <p className="empty-title">{getEmptyText()}</p>
              {searchTerm && (
                <button 
                  className="clear-search-link"
                  onClick={() => setSearchTerm('')}
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="users-list">
              {filteredUsers.map(user => (
                <div 
                  key={user.id}
                  className="user-item"
                  onClick={() => handleUserClick(user.id)}
                >
                  <div className="user-avatar">
                    {user.profile_image ? (
                      <img 
                        src={getProfileImageUrl(user.profile_image)} 
                        alt={user.username}
                      />
                    ) : (
                      <CircleUserRound size={40} className="default-avatar" />
                    )}
                  </div>
                  <div className="user-info">
                    <h4 className="user-name">{user.username}</h4>
                    <span className="user-type">Artista</span>
                  </div>
                  <div className="user-actions">
                    <div className="view-profile-btn">
                      Ver perfil
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con información adicional */}
        {!loading && filteredUsers.length > 0 && (
          <div className="modal-footer">
            <span className="result-count">
              {searchTerm ? `${filteredUsers.length} de ${users.length}` : `${users.length} total`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserListModal;