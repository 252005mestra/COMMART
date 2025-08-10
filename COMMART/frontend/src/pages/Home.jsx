import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import Carousel from '../components/Carousel';
import CategoryFilter from '../components/CategoryFilter';
import '../styles/home.css';

const Home = () => {
  const [users, setUsers] = useState([]);
  const [styles, setStyles] = useState([]);
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

  // Obtener estilos
  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/styles');
        setStyles(response.data);
      } catch (error) {
        console.error('Error al obtener estilos:', error);
      }
    };
    fetchStyles();
  }, []);

  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
    setSearchTerm(''); 
  };

  useEffect(() => {
    if (searchTerm && searchTerm.trim() !== '') {
      setSelectedStyle(null);
      
      // Buscar por artista
      const filteredByArtist = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Buscar por estilo
      const searchTermLower = searchTerm.toLowerCase();
      const matchingStyles = styles.filter(style => 
        style.name.toLowerCase().includes(searchTermLower)
      );

      let filteredByStyle = [];
      if (matchingStyles.length > 0) {
        filteredByStyle = users.filter(user => 
          user.styles && user.styles.some(userStyle => 
            matchingStyles.some(matchingStyle => 
              userStyle.toLowerCase().includes(matchingStyle.name.toLowerCase())
            )
          )
        );
      }

      // Combinar resultados y eliminar duplicados
      const combinedResults = [...filteredByArtist];
      filteredByStyle.forEach(styleUser => {
        if (!combinedResults.find(user => user.id === styleUser.id)) {
          combinedResults.push(styleUser);
        }
      });

      setFilteredUsers(combinedResults);
    }
  }, [searchTerm, users, styles]);

  // Efecto para manejar filtro por estilo
  useEffect(() => {
    const applyStyleFilter = async () => {
      if (!selectedStyle) {
        if (!searchTerm || searchTerm.trim() === '') {
          setFilteredUsers(users);
        }
        return;
      }

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

    if (users.length > 0 && (!searchTerm || searchTerm.trim() === '')) {
      applyStyleFilter();
    }
  }, [selectedStyle, users, searchTerm]);

  // Sugerencias de artistas
  const artistSuggestions = users
    .filter(user =>
      searchTerm &&
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 4); // Reducido para hacer espacio a los estilos

  // Sugerencias de estilos
  const styleSuggestions = styles
    .filter(style =>
      searchTerm &&
      style.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 4); // Máximo 4 estilos

  // Obtener URL de imagen de portafolio
  const getPortfolioImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-artist.jpg';

  // Obtener URL de imagen de perfil
  const getProfileImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-profile.jpg';

  // Determinar si mostrar el carrusel (solo cuando no hay búsqueda activa)
  const showCarousel = !searchTerm || searchTerm.trim() === '';

  return (
    <>
      <MainNav
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        artistSuggestions={artistSuggestions}
        styleSuggestions={styleSuggestions}
        getProfileImageUrl={getProfileImageUrl}
        onStyleSelect={handleStyleSelect}
      />
      
      <main className='main-content'>
        {showCarousel && (
          <section className='carousel-section'>
            <Carousel />
          </section>
        )}

        <section className='CategoryFilter'>
           <CategoryFilter 
            onStyleSelect={handleStyleSelect}
            selectedStyle={selectedStyle}
          />
          
          {error && <div className='error-message'>{error}</div>}
        </section>
        <hr className='divider' />
        <section className='home-container'>
          <h3>
            {searchTerm 
              ? `Buscando: "${searchTerm}"` 
              : selectedStyle 
                ? `Artistas - ${selectedStyle.name}` 
                : 'Todos los artistas'
            }
          </h3>
          
          <div className='artists-profiles'>
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
                                  <span key={index} className='style-tag-types'>{style}</span>
                                ))}
                                {user.styles.length > 2 && <span className='style-more'>+{user.styles.length - 2}</span>}
                              </div>
                            )}
                            {user.description && (
                              <p className='artist-description'>
                                {user.description}
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
        </section>
      </main>
      <Footer />
    </>
  );
};

export default Home;