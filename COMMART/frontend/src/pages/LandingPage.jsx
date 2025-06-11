import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';

// Imagenes
import logo from '../assets/LogoCOMMART.png';
import Lino1 from '../assets/1.1 Lino.png';
import Tiko1 from '../assets/2.1 Tiko.png';
import LinoTiko from '../assets/3. Lino y Tiko.png';

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

  return (
    <>
      <nav className='Menu-Landing' aria-label='Menú principal'>
        <button onClick={() => window.location.reload()} className='Logo'>
            <img src={logo} alt='Logo COMMART'/>
            <span>COMMART</span>
        </button>
        <ul>
            <li><Link to="">Info</Link></li>
            <li><Link to="">Blog</Link></li>
            <li>
              <Link><button onClick={() => setShowLoginModal(true)}>Iniciar Sesión</button></Link>
            </li>
            <li>
              <Link><button onClick={() => setShowRegisterModal(true)}>Registrarse</button></Link>
            </li>
        </ul>
      </nav>

      <main className='LandingContent'>
        <section className='Banner' aria-label="Sección principal con eslogan de COMMART">
            <div>
                <div className='Eslogan'>
                    <p>¡DONDE EL ARTE COBRA VIDA!</p>
                    <h1>COMMART ES TU VENTANA AL MUNDO CREATIVO</h1>
                    <p>En COMMART podrás dar a relucir tus dotes artísticos, ganar reconocimiento y apoyar distintos artistas.</p>
                    <Link to="">¡PRUEBA AHORA!</Link>
                </div>
                <div className='Cards-Banner'>
                  {/* Aqui van los perfiles de los artistas */}
                </div>
            </div>
        </section>

        <section className='Info' aria-label="Información sobre monetización artística">
            <img src={LinoTiko} alt='Lino y Tiko, personajes de COMMART'/>
            <div>
                <h2>Monetiza tu creatividad</h2>
                <p>Acepta comisiones y<br /> lleva tu arte al siguiente<br /> nivel.</p>
                <Link to="">CONOCE MÁS</Link>
            </div>
        </section>

        <section className='Find-Artists' aria-label="Invitación a encontrar artistas">
            <div>
              <h2>¿Tienes una idea en mente?</h2>
              <p>Hazla realidad con un artista único.</p>
              <div className='Cards-Artists'>
                {/* Aqui van los perfiles de los artistas */}
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
              <h3>Conoce a todos nuestros artistas</h3>
            </div>
        </section>

        <section className='Suggestion-Box' aria-label="Buzón de sugerencias y opinión del usuario">
            <div className="Suggestion-Images">
              <img src={Lino1} alt='Lino' />
              <img src={Tiko1} alt='Tiko' />
            </div>
            <div className='Suggestion-Text'>
              <h2>Tu opinión cuenta</h2>
              <p>Ayúdanos a hacer crecer nuestra plataforma.<br /> Deja tus sugerencias en el buzón y contribuye<br /> a nuestra mejora continua.</p>
              <Link to="">IR A BUZÓN</Link>
            </div>
        </section>
      </main>
      <footer>
        <ul>
            <li><Link to="">Términos del servicio</Link></li>
            <li><Link to="">Política de privacidad</Link></li>
            <li><Link to="">Ayuda</Link></li>
        </ul>
      </footer>
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onSwitchToRegister={openRegisterFromLogin} />}
      {showRegisterModal && <RegisterModal onClose={() => setShowRegisterModal(false)} onSwitchToLogin={openLoginFromRegister} />}
    </>
  );
};

export default LandingPage;
