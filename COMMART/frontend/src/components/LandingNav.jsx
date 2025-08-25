import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Info, BookOpen, LogIn, UserPlus } from 'lucide-react';
import logo from '../assets/LogoCOMMART.png';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import ForgotPasswordModal from './ForgotPasswordModal';
import '../styles/navlanding.css';

const LandingNav = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Función para abrir login desde registro
  const openLoginFromRegister = () => {
    setIsRegisterModalOpen(false);
    setTimeout(() => setIsLoginModalOpen(true), 100);
  };

  // Función para abrir registro desde login
  const openRegisterFromLogin = () => {
    setIsLoginModalOpen(false);
    setTimeout(() => setIsRegisterModalOpen(true), 100);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <nav className='landing-menu' aria-label='Menú principal'>
        <button onClick={() => navigate('/')} className='logo'>
            <img src={logo} alt='Logo COMMART'/>
            <span className='logo-text'>COMMART</span>
        </button>
        
        {/* Menú desktop (existente) */}
        <ul className='desktop-menu'>
            <li>
              <Link to=''>Info</Link>
            </li>
            <li>
              <Link to=''>Blog</Link>
            </li>
            <li>
              <button onClick={() => setIsLoginModalOpen(true)}>Iniciar Sesión</button>
            </li>
            <li>
              <button onClick={() => setIsRegisterModalOpen(true)}>Registrarse</button>
            </li>
        </ul>

        {/* Botón hamburguesa para móvil */}
        <button 
          className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Abrir menú"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Menú móvil */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <ul>
            <li>
              <Link to="" onClick={toggleMobileMenu}>
                <Info size={20} />
                Info
              </Link>
            </li>
            <li>
              <Link to="" onClick={toggleMobileMenu}>
                <BookOpen size={20} />
                Blog
              </Link>
            </li>
            <li>
              <button onClick={() => { setIsLoginModalOpen(true); toggleMobileMenu(); }}>
                <LogIn size={20} />
                Iniciar Sesión
              </button>
            </li>
            <li>
              <button onClick={() => { setIsRegisterModalOpen(true); toggleMobileMenu(); }}>
                <UserPlus size={20} />
                Registrarse
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onSwitchToRegister={openRegisterFromLogin}
          onForgotPassword={() => {
            setIsLoginModalOpen(false);
            setTimeout(() => setIsForgotModalOpen(true), 100);
          }}
        />
      )}
      {isRegisterModalOpen && (
        <RegisterModal
          onClose={() => setIsRegisterModalOpen(false)}
          onSwitchToLogin={openLoginFromRegister}
        />
      )}
      {isForgotModalOpen && (
        <ForgotPasswordModal
          onClose={() => setIsForgotModalOpen(false)}
        />
      )}
    </>
  );
};

export default LandingNav;
