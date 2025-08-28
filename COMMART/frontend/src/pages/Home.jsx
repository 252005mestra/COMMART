import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import Carousel from '../components/Carousel';
import CategoryFilter from '../components/CategoryFilter';
import '../styles/home.css';
import { useUser } from '../context/UserContext';
import InfoCard from '../components/InfoCard';

const Home = () => {
  const { profile } = useUser(); // Obtener el perfil del usuario actual
  const location = useLocation();
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [showCarousel, setShowCarousel] = useState(true);
  const [loading, setLoading] = useState(false);

  // Manejar navegación desde otras páginas con estado
  useEffect(() => {
    if (location.state) {
      const { searchTerm: incomingSearchTerm, selectedStyle: incomingStyle } = location.state;
      
      if (incomingSearchTerm) {
        setSearchTerm(incomingSearchTerm);
        setShowCarousel(false);
      }
      
      if (incomingStyle) {
        setSelectedStyle(incomingStyle);
        setShowCarousel(true);
      }
      
      // Limpiar el estado después de procesarlo
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Usar useCallback para estabilizar las funciones callback
  const handleSearchResults = useCallback((results, errorMsg, term) => {
    // Filtrar el perfil propio de los resultados
    const filteredResults = results.filter(user => profile?.id !== user.id);
    setFilteredUsers(filteredResults);
    setError(errorMsg || '');
    setSearchTerm(term);
  }, [profile?.id]);

  const handleStyleFilter = useCallback((style, showCarouselFlag) => {
    setSelectedStyle(style);
    setShowCarousel(showCarouselFlag);
  }, []);

  const handleCarouselVisibility = useCallback((visible) => {
    setShowCarousel(visible);
  }, []);

  // Obtener URL de imagen de portafolio
  const getPortfolioImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-artist.jpg';

  // Obtener URL de imagen de perfil
  const getProfileImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-profile.jpg';

  return (
    <>
      <MainNav
        onSearchResults={handleSearchResults}
        onStyleFilter={handleStyleFilter}
        onCarouselVisibility={handleCarouselVisibility}
        showCarouselByDefault={true}
      />
      
      <main className='main-content'>
        {showCarousel && (
          <section className='carousel-section'>
            <Carousel />
          </section>
        )}

        <section className='CategoryFilter'>
           <CategoryFilter 
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
                    <InfoCard
                      key={user.id}
                      image={getPortfolioImageUrl(user.portfolio_image)}
                      avatar={getProfileImageUrl(user.profile_image)}
                      title={user.username}
                      subtitle={`${user.followers || 0} Followers`}
                      tags={user.styles || []}
                      description={user.description}
                      link={profile?.id === user.id ? '/profile' : `/artist/${user.id}`}
                      asLink={true}
                    />
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