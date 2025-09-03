import axios from 'axios';

const API_URL = 'http://localhost:5000/api/packages';

// Obtener paquetes de un artista
export const getArtistPackages = async (artistId) => {
  try {
    const response = await axios.get(`${API_URL}/artist/${artistId}`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    console.error('Error al obtener paquetes:', error);
    throw error;
  }
};