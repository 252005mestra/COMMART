import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import '../styles/home.css';

// Fondos
import lightOrangeBg from '../assets/FondoNaranjaClaro.png';
import darkOrangeBg from '../assets/FondoNaranjaOscuro.png';
import lightGreenBg from '../assets/FondoVerdeClaro.png';
import darkGreenBg from '../assets/FondoVerdeOscuro.png';

// Ratones
import Lino2 from '../assets/1.2 Lino.png';
import Lino3 from '../assets/1.3 Lino.png';
import Tiko2 from '../assets/2.2 Tiko.png';
import Tiko3 from '../assets/2.3 Tiko.png';

const slides = [
  {
    bg: darkOrangeBg,
    character: Tiko2,
    title: '¿Deseas encargar una ilustración con temática +18?',
    desc: 'Activa esta opción y conecta artistas que ofrecen este contenido.',
    button: 'ACTÍVALO AQUÍ',
    alt: '+18'
  },
  {
    bg: darkGreenBg,
    character: Lino3,
    title: '¿Prefieres una navegación libre de anuncios?',
    desc: 'Adquiere nuestra membresía premium y elimina la publicidad de la página para siempre. ¡Disfruta de una sesión sin interrupciones!',
    button: 'COMPRA AQUÍ',
    alt: 'Sin anuncios'
  },
  {
    bg: lightOrangeBg,
    character: Tiko3,
    title: '¿Tienes sugerencias o ideas para mejorar?',
    desc: '¡Nos encanta saber tu opinión! Deja tus comentarios en nuestro buzón de sugerencias y ayúdanos a mejorar tu experiencia.',
    button: 'IR AL BUZÓN',
    alt: 'Sugerencias'
  },
  {
    bg: lightGreenBg,
    character: Lino2,
    title: '¿Eres artista y estás listo para recibir comisiones?',
    desc: 'Activa tu cliente artista y empieza a recibir tu primer encargo. ¡Es el momento de mostrar tu talento al mundo!',
    button: 'ACTÍVALO AQUÍ',
    alt: 'Comisiones'
  }
];

const Home = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [current, setCurrent] = useState(0);
  const autoPlayRef = useRef();
  const touchStartX = useRef(null);

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

  // Carrusel automático
  useEffect(() => {
    autoPlayRef.current = nextSlide;
  });

  useEffect(() => {
    const play = () => {
      autoPlayRef.current();
    };
    const interval = setInterval(play, 4000);
    return () => clearInterval(interval);
  }, []);

  // Touch/swipe support
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    else if (diff < -50) prevSlide();
    touchStartX.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const goTo = (idx) => setCurrent(idx);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);

  // Floating particles
  const [particles, setParticles] = useState([]);
  useEffect(() => {
    const arr = [];
    for (let i = 0; i < 18; i++) {
      arr.push({
        left: Math.random() * 100,
        delay: Math.random() * 6,
        duration: Math.random() * 3 + 3,
      });
    }
    setParticles(arr);
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
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        artistSuggestions={artistSuggestions}
      />
      <main className='main-content'>
        <section className='carousel-home'>
          <div
            className="carousel-container"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            tabIndex={0}
          >
            {/* Floating particles */}
            <div className="floating-particles">
              {particles.map((p, i) => (
                <div
                  key={i}
                  className="particle"
                  style={{
                    left: `${p.left}%`,
                    animationDelay: `${p.delay}s`,
                    animationDuration: `${p.duration}s`
                  }}
                />
              ))}
            </div>

            {/* Slides */}
            <div
              className="carousel-track"
              style={{
                width: `${slides.length * 100}%`,
                transform: `translateX(-${current * 100}%)`
              }}
            >
              {slides.map((slide, idx) => (
                <div
                  className="slide"
                  key={idx}
                  style={{
                    backgroundImage: `url(${slide.bg})`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  <div className="slide-content">
                    <div className="slide-img-col">
                      <img src={slide.character} alt={slide.alt} className="slide-character" />
                    </div>
                    <div className="slide-text-col">
                      <h2>{slide.title}</h2>
                      <p>{slide.desc}</p>
                      <button className="slide-btn">{slide.button}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Flechas */}
            <button className="arrow arrow-left" onClick={prevSlide} aria-label="Anterior">‹</button>
            <button className="arrow arrow-right" onClick={nextSlide} aria-label="Siguiente">›</button>

            {/* Dots */}
            <div className="navigation">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`nav-dot${current === idx ? ' active' : ''}`}
                  onClick={() => goTo(idx)}
                />
              ))}
            </div>

            {/* Barra de progreso */}
            <div
              className="progress-bar"
              style={{
                width: `${100 / slides.length}%`,
                left: `${current * (100 / slides.length)}%`
              }}
            />
          </div>
        </section>
        <h2>Bienvenido al Home</h2>
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