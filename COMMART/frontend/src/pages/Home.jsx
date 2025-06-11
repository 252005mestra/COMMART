import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Home = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/users', {
          withCredentials: true // <- esto es clave para que se envíen las cookies
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
    <div>
      <h2>Bienvenido al Home</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h3>Usuarios Registrados:</h3>
      <ul>
        {usuarios.map((usuario, index) => (
          <li key={index}>{usuario.username}</li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
