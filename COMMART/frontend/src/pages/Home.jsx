import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import Carousel from '../components/Carousel';
import CategoryFilter from '../components/CategoryFilter';
import '../styles/home.css';

const Home = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [loading, setLoading] = useState(false);

  // Obtener todos los artistas al cargar
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/auth/artists', {
          withCredentials: true
        });
        setUsers(response.data);
        setFilteredUsers(response.data);
      } catch (error) {
        setError('No autorizado o error al obtener artistas');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
  }, []);

  // Manejar selección de estilo
  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
    setSearchTerm(''); // Limpiar búsqueda cuando se selecciona estilo
  };

  // Efecto para manejar búsqueda - NUEVA LÓGICA
  useEffect(() => {
    if (searchTerm && searchTerm.trim() !== '') {
      // Si hay búsqueda, deseleccionar filtro y buscar en todos los usuarios
      setSelectedStyle(null);
      const filtered = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Efecto para manejar filtro por estilo
  useEffect(() => {
    const applyStyleFilter = async () => {
      if (!selectedStyle) {
        // Si no hay estilo seleccionado y no hay búsqueda, mostrar todos
        if (!searchTerm || searchTerm.trim() === '') {
          setFilteredUsers(users);
        }
        return;
      }

      // Si hay estilo seleccionado, hacer petición al backend
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(
          `http://localhost:5000/api/auth/artists/style/${selectedStyle.id}`,
          { withCredentials: true }
        );
        setFilteredUsers(response.data);
      } catch (error) {
        setError('Error al obtener artistas por estilo');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    // Solo ejecutar si tenemos usuarios cargados y no hay búsqueda activa
    if (users.length > 0 && (!searchTerm || searchTerm.trim() === '')) {
      applyStyleFilter();
    }
  }, [selectedStyle, users, searchTerm]);

  // Sugerencias para autocompletado (máximo 6)
  const artistSuggestions = users
    .filter(user =>
      searchTerm &&
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 6);

  // Obtener URL de imagen de portafolio
  const getPortfolioImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-artist.jpg';

  // Obtener URL de imagen de perfil
  const getProfileImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-profile.jpg';

  return (
    <>
      <MainNav
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        artistSuggestions={artistSuggestions}
      />
      
      <main className='main-content'>
        <section className='hero-section'>
          <Carousel />
        </section>

        <div className='home-container'>
          <CategoryFilter 
            onStyleSelect={handleStyleSelect}
            selectedStyle={selectedStyle}
          />
          
          {error && <div className='error-message'>{error}</div>}
          
          <h3>
            {searchTerm 
              ? `Buscando: "${searchTerm}"` 
              : selectedStyle 
                ? `Artistas - ${selectedStyle.name}` 
                : 'Todos los artistas'
            }
          </h3>
          
          {loading ? (
            <div className='loading'>
              <p>Cargando artistas...</p>
            </div>
          ) : (
            <div className='artists-grid'>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <div className='artist-card' key={user.id}>
                    <div className='card-image'>
                      <img
                        src={getPortfolioImageUrl(user.portfolio_image)}
                        alt={`Portfolio de ${user.username}`}
                      />
                    </div>
                    <div className='card-footer'>
                      <div className='artist-info'>
                        <img
                          src={getProfileImageUrl(user.profile_image)}
                          alt={user.username}
                          className='profile-avatar'
                        />
                        <div className='artist-details'>
                          <h4 className='artist-name'>{user.username}</h4>
                          <p className='artist-followers'>{user.followers || 0} Followers</p>
                          {user.styles && user.styles.length > 0 && (
                            <div className='artist-styles'>
                              <span className='style-tag'>Estilos:</span>
                              {user.styles.slice(0, 2).map((style, index) => (
                                <span key={index} className='style-tag'>{style}</span>
                              ))}
                              {user.styles.length > 2 && <span className='style-more'>+{user.styles.length - 2}</span>}
                            </div>
                          )}
                          {user.description && (
                            <p className='artist-description'>
                              Descripción: {user.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className='loading'>
                  <p>
                    {searchTerm 
                      ? `No se encontraron artistas con el nombre "${searchTerm}".`
                      : selectedStyle 
                        ? `No se encontraron artistas con el estilo "${selectedStyle.name}".`
                        : 'No se encontraron artistas.'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Home;