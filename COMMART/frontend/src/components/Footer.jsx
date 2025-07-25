import { Link } from 'react-router-dom';
import '../styles/footer.css';

const Footer = () => {
  return (
    <>
      <footer className='Terms-and-Conditions'>
        <ul>
            <li><Link to="">Términos del servicio</Link></li>
            <li><Link to="">Política de privacidad</Link></li>
            <li><Link to="">Ayuda</Link></li>
        </ul>
      </footer>
    </>
  )
}

export default Footer
