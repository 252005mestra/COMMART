import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/footer.css';

const Footer = () => {
  return (
    <footer className='footer'>
      <div className='footer-content'>
        <div className='footer-links'>
          <Link to='/terms'>Términos del servicio</Link>
          <Link to='/privacy'>Política de privacidad</Link>
          <Link to='/help'>Ayuda</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
