import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/LogoCOMMART.png';
import LoginModal from '../components/LoginModal';
import RegisterModal from '../components/RegisterModal';
import '../styles/navlanding.css'

const NavLanding = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const navigate = useNavigate();

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
        <button onClick={() => navigate('/')} className='Logo'>
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
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={openRegisterFromLogin}
        />
      )}
      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={openLoginFromRegister}
        />
      )}
    </>
  );
};

export default NavLanding
