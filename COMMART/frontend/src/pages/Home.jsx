import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import Carousel from '../components/Carousel';
import '../styles/home.css';

const Home = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/artists', {
          withCredentials: true
        });
        setUsers(response.data);
      } catch (error) {
        setError('No autorizado o error al obtener artistas');
        console.error('Error:', error);
      }
    };

    fetchArtists();
  }, []);

  // Sugerencias para autocompletado (máximo 6)
  const artistSuggestions = users
    .filter(user =>
      searchTerm &&
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 6);

  // Filtrar artistas por nombre de usuario
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <section className="hero-section">
          <Carousel />
        </section>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        <h3>Artistas registrados:</h3>
        <div className="artists-grid">
          {filteredUsers.map((user) => (
            <div className="artist-card" key={user.id}>
              <div className="card-image">
                <img
                  src={getPortfolioImageUrl(user.portfolio_image)}
                  alt={`Portfolio de ${user.username}`}
                />
              </div>
              <div className="card-footer">
                <div className="artist-info">
                  <img
                    src={getProfileImageUrl(user.profile_image)}
                    alt={user.username}
                    className="profile-avatar"
                  />
                  <div className="artist-details">
                    <h4 className="artist-name">{user.username}</h4>
                    <p className="artist-followers">{user.followers || 0} seguidores</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && !error && (
            <div className="loading">
              <p>No se encontraron artistas.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Home;