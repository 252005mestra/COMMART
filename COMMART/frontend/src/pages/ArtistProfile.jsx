import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import ArtistPortfolio from '../components/ArtistPortfolio';

const ArtistProfile = () => {
  const { profile } = useUser();
  const [allStyles, setAllStyles] = useState([]);
  const [allLanguages, setAllLanguages] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stylesRes, langsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/auth/styles'),
          axios.get('http://localhost:5000/api/auth/languages')
        ]);
        setAllStyles(stylesRes.data);
        setAllLanguages(langsRes.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };
    fetchData();
  }, []);

  const handleSave = async (formData) => {
    try {
      await axios.put('http://localhost:5000/api/auth/artist-profile', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Recargar datos o mostrar mensaje de éxito
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
    }
  };

  return (
    <>
      <MainNav />

      <main className="main-content">
        <section className="artist-profile-section">
          <ArtistPortfolio
            artist={profile}
            allStyles={allStyles}
            allLanguages={allLanguages}
            isOwnProfile={true}
            onSave={handleSave}
          />
        </section>
      </main>

      <Footer />
    </>
  );
};

export default ArtistProfile;