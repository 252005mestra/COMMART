import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/landing.css';
import Footer from '../components/Footer';
import NavLanding from '../components/NavLanding';
import RegisterModal from '../components/RegisterModal';
import LoginModal from '../components/LoginModal';

// Imagenes
import Lino1 from '../assets/1.1 Lino.png';
import Tiko1 from '../assets/2.1 Tiko.png';
import LinoTiko from '../assets/3. Lino y Tiko.png';

const LandingPage = () => {
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [artists, setArtists] = useState([]);
  const [artistIndex, setArtistIndex] = useState(0);
  const [artistGridIndex, setArtistGridIndex] = useState(0);

  // Obtener artistas públicos desde el backend
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/public-artists');
        setArtists(response.data);
      } catch (error) {
        console.error('Error al obtener artistas:', error);
      }
    };
    fetchArtists();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setArtistIndex((prevIndex) => artists.length > 0 ? (prevIndex + 3) % artists.length : 0);
    }, 5000);
    return () => clearInterval(interval);
  }, [artists]);

  const visibleArtists = artists.slice(artistIndex, artistIndex + 3).length === 3
    ? artists.slice(artistIndex, artistIndex + 3)
    : [
        ...artists.slice(artistIndex),
        ...artists.slice(0, 3 - (artists.length - artistIndex))
      ];

  useEffect(() => {
    const interval = setInterval(() => {
      setArtistGridIndex((prevIndex) => artists.length > 0 ? (prevIndex + 4) % artists.length : 0);
    }, 5000);
    return () => clearInterval(interval);
  }, [artists]);

  const visibleGridArtists = artists.slice(artistGridIndex, artistGridIndex + 4).length === 4
    ? artists.slice(artistGridIndex, artistGridIndex + 4)
    : [
        ...artists.slice(artistGridIndex),
        ...artists.slice(0, 4 - (artists.length - artistGridIndex))
      ];

  const getPortfolioImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-artist.jpg';

  const getProfileImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-profile.jpg';

  const handleTryNow = () => setShowRegisterModal(true);

  // Funciones para el switch entre modales
  const openLoginFromRegister = () => {
    setShowRegisterModal(false);
    setTimeout(() => setShowLoginModal(true), 100);
  };

  const openRegisterFromLogin = () => {
    setShowLoginModal(false);
    setTimeout(() => setShowRegisterModal(true), 100);
  };

  return (
    <>
      <NavLanding />

      <main className='LandingContent'>
        <section className='section Banner' aria-label="Sección principal con eslogan de COMMART">
          <div>
              <div className='Eslogan'>
                  <h1>¡DONDE EL ARTE COBRA VIDA!</h1>
                  <p>COMMART ES TU VENTANA AL MUNDO CREATIVO</p>
                  <p>En COMMART podrás dar a relucir tus dotes artísticos, ganar reconocimiento y apoyar distintos artistas.</p>
                  <button onClick={handleTryNow}>¡PRUEBA AHORA!</button>
              </div>
              <div className='Cards-Banner'>
                {visibleArtists.map((artist) => (
                  <div className='Card' key={artist.id}>
                    <img
                      src={getPortfolioImageUrl(artist.portfolio_image)}
                      alt={artist.username}
                    />
                    <p>{artist.username}</p>
                  </div>
                ))}
              </div>
          </div>
        </section>

        <section className='section Info' aria-label="Información sobre monetización artística">
          <div>
            <div className='Info-Img'>
              <img src={LinoTiko} alt='Lino y Tiko, personajes de COMMART'/>
            </div>
            <div className='Info-Text'>
                <h2>Monetiza tu<br /> creatividad</h2>
                <p>Acepta comisiones y<br />  lleva tu arte al siguiente<br />  nivel.</p>
                <Link to="">CONOCE MÁS</Link>
            </div>
          </div>
        </section>

        <section className='section Find-Artists' aria-label="Invitación a encontrar artistas">
            <div>
              <h2>¿Tienes una idea en mente?</h2>
              <p>Hazla realidad con un artista único.</p>
              <div className='Cards-Artists'>
                {visibleGridArtists.map((artist) => (
                  <div className='Card' key={artist.id}>
                    <img
                      src={getPortfolioImageUrl(artist.portfolio_image)}
                      alt={artist.username}
                    />
                    <div className="Card-info">
                      <div className="user-row">
                        <span className="user-icon">
                          <img
                            src={getProfileImageUrl(artist.profile_image)}
                            alt={artist.username}
                            className="profile-img"
                          />
                        </span>
                        <span className="artist-name">{artist.username}</span>
                        <span className="followers">{artist.followers} Followers</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <h3>Conoce a todos nuestros artistas</h3>
            </div>
        </section>

        <section className='section Suggestion-Box' aria-label="Buzón de sugerencias y Términos y Condiciones">
            <div>
              <div className="Suggestion-Images">
                <img src={Lino1} alt='Lino' />
              </div>
              <div className='Suggestion-Text'>
                <h2>Tu opinión cuenta</h2>
                <p>Ayúdanos a hacer crecer nuestra plataforma. Deja tus sugerencias en el buzón y contribuye a nuestra mejora continua.</p>
                <Link to="">IR A BUZÓN</Link>
              </div>
              <div className="Suggestion-Images">
                <img src={Tiko1} alt='Tiko' />
              </div>
            </div>
            <Footer />
        </section>
      </main>

      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={openLoginFromRegister}
        />
      )}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={openRegisterFromLogin}
        />
      )}
    </>
  );
};

export default LandingPage;
