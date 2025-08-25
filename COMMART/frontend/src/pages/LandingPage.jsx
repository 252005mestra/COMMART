import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/landing.css';
import Footer from '../components/Footer';
import LandingNav from '../components/LandingNav';
import RegisterModal from '../components/RegisterModal';
import LoginModal from '../components/LoginModal';

// Imágenes
import Lino1 from '../assets/1.1 Lino.png';
import Tiko1 from '../assets/2.1 Tiko.png';
import LinoTiko from '../assets/3. Lino y Tiko.png';

const LandingPage = () => {
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [artistList, setArtistList] = useState([]);
  const [bannerArtistIndex, setBannerArtistIndex] = useState(0);
  const [gridArtistIndex, setGridArtistIndex] = useState(0);

  // Obtener artistas públicos desde el backend
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/public-artists');
        setArtistList(response.data);
      } catch (error) {
        console.error('Error al obtener artistas:', error);
      }
    };
    fetchArtists();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerArtistIndex((prevIndex) => artistList.length > 0 ? (prevIndex + 3) % artistList.length : 0);
    }, 5000);
    return () => clearInterval(interval);
  }, [artistList]);

  const visibleBannerArtists = artistList.slice(bannerArtistIndex, bannerArtistIndex + 3).length === 3
    ? artistList.slice(bannerArtistIndex, bannerArtistIndex + 3)
    : [
        ...artistList.slice(bannerArtistIndex),
        ...artistList.slice(0, 3 - (artistList.length - bannerArtistIndex))
      ];

  useEffect(() => {
    const interval = setInterval(() => {
      // En móvil cambia solo 1 artista, en desktop 4
      const increment = window.innerWidth <= 768 ? 1 : 4;
      setGridArtistIndex((prevIndex) => artistList.length > 0 ? (prevIndex + increment) % artistList.length : 0);
    }, 5000);
    return () => clearInterval(interval);
  }, [artistList]);

  const getArtistsToShow = () => {
    const isMobile = window.innerWidth <= 768;
    const count = isMobile ? 1 : 4;
    
    return artistList.slice(gridArtistIndex, gridArtistIndex + count).length === count
      ? artistList.slice(gridArtistIndex, gridArtistIndex + count)
      : [
          ...artistList.slice(gridArtistIndex),
          ...artistList.slice(0, count - (artistList.length - gridArtistIndex))
        ];
  };

  const visibleGridArtists = getArtistsToShow();

  const getPortfolioImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-artist.jpg';

  const getProfileImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-profile.jpg';

  const handleTryNow = () => setIsRegisterModalOpen(true);

  // Funciones para el switch entre modales
  const openLoginFromRegister = () => {
    setIsRegisterModalOpen(false);
    setTimeout(() => setIsLoginModalOpen(true), 100);
  };

  const openRegisterFromLogin = () => {
    setIsLoginModalOpen(false);
    setTimeout(() => setIsRegisterModalOpen(true), 100);
  };

  return (
    <>
      <LandingNav />

      <main className='landing-content'>
        <section className='section banner' aria-label='Sección principal con eslogan de COMMART'>
          <div>
              <div className='slogan'>
                  <h1>¡DONDE EL ARTE COBRA VIDA!</h1>
                  <p>COMMART ES TU VENTANA AL MUNDO CREATIVO</p>
                  <p>En COMMART podrás dar a relucir tus dotes artísticos, ganar reconocimiento y apoyar distintos artistas.</p>
                  <button onClick={handleTryNow}>¡PRUEBA AHORA!</button>
              </div>
              <div className='banner-cards'>
                {visibleBannerArtists.map((artist) => (
                  <div className='card' key={artist.id}>
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

        {/* Separador con imagen de Lino - solo móvil */}
        <div className='section-separator-lino'>
          <img src={Lino1} alt='Lino' />
        </div>

        <section className='section info-section' aria-label='Información sobre monetización artística'>
          <div>
            <div className='info-img'>
              <img src={LinoTiko} alt='Lino y Tiko, personajes de COMMART'/>
            </div>
            <div className='info-text'>
                <h2>Monetiza tu<br /> creatividad</h2>
                <p>Acepta comisiones y<br />  lleva tu arte al siguiente<br />  nivel.</p>
                <Link to=''>CONOCE MÁS</Link>
            </div>
          </div>
        </section>

        {/* Separador con imagen de Tiko - solo móvil */}
        <div className='section-separator-tiko'>
          <img src={Tiko1} alt='Tiko' />
        </div>

        <section className='section find-artists' aria-label='Invitación a encontrar artistas'>
            <div>
              <h2>¿Tienes una idea en mente?</h2>
              <p>Hazla realidad con un artista único.</p>
              
              {/* Grid de artistas responsive */}
              <div className='artist-cards'>
                {visibleGridArtists.map((artist) => (
                  <div className='card' key={artist.id}>
                    <img
                      src={getPortfolioImageUrl(artist.portfolio_image)}
                      alt={artist.username}
                    />
                    <div className='card-info'>
                      <div className='user-row'>
                        <span className='user-icon'>
                          <img
                            src={getProfileImageUrl(artist.profile_image)}
                            alt={artist.username}
                            className='profile-img'
                          />
                        </span>
                        <span className='artist-name'>{artist.username}</span>
                        <span className='followers'>{artist.followers} Followers</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <h3>Conoce a todos nuestros artistas</h3>
            </div>
        </section>

        {/* Separador con imagen de Lino final - solo móvil */}
        <div className='section-separator-lino-final'>
          <img src={Lino1} alt='Lino' />
        </div>

        <section className='section suggestion-box' aria-label='Buzón de sugerencias y Términos y Condiciones'>
            <div>
              <div className='suggestion-images'>
                <img src={Lino1} alt='Lino' />
              </div>
              <div className='suggestion-text'>
                <h2>Tu opinión cuenta</h2>
                <p>Ayúdanos a hacer crecer nuestra plataforma. Deja tus sugerencias en el buzón y contribuye a nuestra mejora continua.</p>
                <Link to=''>IR A BUZÓN</Link>
              </div>
              <div className='suggestion-images'>
                <img src={Tiko1} alt='Tiko' />
              </div>
            </div>
            <Footer />
        </section>

        {/* Separador con imagen de Tiko final - solo móvil */}
        <div className='section-separator-tiko-final'>
          <img src={Tiko1} alt='Tiko' />
        </div>
      </main>

      {isRegisterModalOpen && (
        <RegisterModal
          onClose={() => setIsRegisterModalOpen(false)}
          onSwitchToLogin={openLoginFromRegister}
        />
      )}
      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onSwitchToRegister={openRegisterFromLogin}
        />
      )}
    </>
  );
};

export default LandingPage;
