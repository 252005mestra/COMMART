import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/auth/profile', { withCredentials: true });
      setProfile(res.data);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // NUEVO: función para cerrar sesión
  const logout = async () => {
    await axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true });
    setProfile(null);
  };

  const addFavoriteArtist = async (artistId) => {
    await axios.post(`http://localhost:5000/api/auth/artists/${artistId}/favorite`, {}, { withCredentials: true });
    await fetchProfile(); // <-- Refresca el perfil global, incluyendo favoritos y conteo
  };

  const removeFavoriteArtist = async (artistId) => {
    await axios.post(`http://localhost:5000/api/auth/artists/${artistId}/favorite`, {}, { withCredentials: true });
    await fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <UserContext.Provider value={{ profile, loading, fetchProfile, logout, addFavoriteArtist, removeFavoriteArtist }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);