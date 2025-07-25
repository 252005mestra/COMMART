import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/NavBar';
import Footer from '../components/Footer';

// Imagenes
import logo from '../assets/LogoCOMMART.png';
import Lino2 from '../assets/1.2 Lino.png';
import Lino3 from '../assets/1.3 Lino.png';
import Tiko2 from '../assets/2.2 Tiko.png';
import Tiko3 from '../assets/2.3 Tiko.png';

const Home = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/users', {
          withCredentials: true
        });
        setUsuarios(response.data);
      } catch (error) {
        setError('No autorizado o error al obtener usuarios');
        console.error('Error:', error);
      }
    };

    obtenerUsuarios();
  }, []);

  return (
    <>
      <Navbar />
      <main className="MainContent">
        <h2>Bienvenido al Home</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <h3>Usuarios Registrados:</h3>
        <ul>
          {usuarios.map((usuario, index) => (
            <li key={index}>{usuario.username}</li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
};

export default Home;