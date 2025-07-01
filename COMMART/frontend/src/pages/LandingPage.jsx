import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';

// Imagenes
import logo from '../assets/LogoCOMMART.png';
import Lino1 from '../assets/1.1 Lino.png';
import Tiko1 from '../assets/2.1 Tiko.png';
import LinoTiko from '../assets/3. Lino y Tiko.png';

import prueba1 from '../assets/Prueba/prueba1.jpg';
import prueba2 from '../assets/Prueba/prueba2.jpg';
import prueba3 from '../assets/Prueba/prueba3.jpg';
import prueba4 from '../assets/Prueba/prueba4.jpg';
import prueba5 from '../assets/Prueba/prueba5.jpg';
import prueba6 from '../assets/Prueba/prueba6.jpg';

const LandingPage = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const openLoginFromRegister = () => {
    setShowRegisterModal(false);
    setTimeout(() => setShowLoginModal(true), 100);
  };

  const openRegisterFromLogin = () => {
    setShowLoginModal(false);
    setTimeout(() => setShowRegisterModal(true), 100);
  };

  // PRUEBA PARA LAS IMAGENES DE ARTISTAS
  const artistSamples = [
    { id: 1, name: "@Sofía", image: prueba1 },
    { id: 2, name: "@Mateo", image: prueba2 },
    { id: 3, name: "@Valentina", image: prueba3 },
    { id: 4, name: "@Andrés", image: prueba4 },
    { id: 5, name: "@Luisa", image: prueba5 },
    { id: 6, name: "@Camilo", image: prueba6 }
  ];

  const [artistIndex, setArtistIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setArtistIndex((prevIndex) => (prevIndex + 3) % artistSamples.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const visibleArtists = [
    artistSamples[artistIndex],
    artistSamples[(artistIndex + 1) % artistSamples.length],
    artistSamples[(artistIndex + 2) % artistSamples.length]
  ];

  // Para las Cards-Artists (4 artistas visibles)
  const [artistGridIndex, setArtistGridIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setArtistGridIndex((prevIndex) => (prevIndex + 4) % artistSamples.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [artistSamples.length]);

  const visibleGridArtists = [
    artistSamples[artistGridIndex],
    artistSamples[(artistGridIndex + 1) % artistSamples.length],
    artistSamples[(artistGridIndex + 2) % artistSamples.length],
    artistSamples[(artistGridIndex + 3) % artistSamples.length]
  ];

  return (
    <>
      <nav className='Menu-Landing' aria-label='Menú principal'>
        <button onClick={() => window.location.reload()} className='Logo'>
            <img src={logo} alt='Logo COMMART'/>
            <span>COMMART</span>
        </button>
        <ul>
            <li>
              <Link to="">Info</Link>
            </li>
            <li>
              <Link to="">Blog</Link>
            </li>
            <li>
              <button onClick={() => setShowLoginModal(true)}>Iniciar Sesión</button>
            </li>
            <li>
              <button onClick={() => setShowRegisterModal(true)}>Registrarse</button>
            </li>
        </ul>
      </nav>

      <main className='LandingContent'>
        <section className='section Banner' aria-label="Sección principal con eslogan de COMMART">
          <div>
              <div className='Eslogan'>
                  <h1>¡DONDE EL ARTE COBRA VIDA!</h1>
                  <p>COMMART ES TU VENTANA AL MUNDO CREATIVO</p>
                  <p>En COMMART podrás dar a relucir tus dotes artísticos, ganar reconocimiento y apoyar distintos artistas.</p>
                  <button onClick={() => setShowRegisterModal(true)}>¡PRUEBA AHORA!</button>
              </div>
              <div className='Cards-Banner'>
                {visibleArtists.map((artist) => (
                  <div className='Card' key={artist.id}>
                    <img src={artist.image} alt={artist.name} />
                    <p>{artist.name}</p>
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
                    <img src={artist.image} alt={artist.name} />
                    <div className="Card-info">
                      <div className="user-row">
                        <span className="user-icon">
                          {/* Puedes usar un SVG de usuario aquí */}
                          <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="5" fill="currentColor"/><ellipse cx="12" cy="17" rx="7" ry="4" fill="currentColor" opacity="0.3"/></svg>
                        </span>
                        <span className="artist-name">{artist.name}</span>
                      </div>
                      <span className="followers">{artist.followers} Followers</span>
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
            <footer className='Terms-and-Conditions'>
              <ul>
                  <li><Link to="">Términos del servicio</Link></li>
                  <li><Link to="">Política de privacidad</Link></li>
                  <li><Link to="">Ayuda</Link></li>
              </ul>
            </footer>
        </section>
      </main>
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onSwitchToRegister={openRegisterFromLogin} />}
      {showRegisterModal && <RegisterModal onClose={() => setShowRegisterModal(false)} onSwitchToLogin={openLoginFromRegister} />}
    </>
  );
};

export default LandingPage;
