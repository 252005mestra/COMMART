import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import ArtistPortfolio from '../components/ArtistPortfolio';

const ArtistProfile = () => {
  const { profile, fetchProfile } = useUser();
  const [allStyles, setAllStyles] = useState([]);
  const [allLanguages, setAllLanguages] = useState([]);
  const [artistData, setArtistData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [stylesRes, langsRes, profileRes] = await Promise.all([
          axios.get('http://localhost:5000/api/auth/styles'),
          axios.get('http://localhost:5000/api/auth/languages'),
          axios.get('http://localhost:5000/api/auth/artist-profile', {
            withCredentials: true
          })
        ]);
        
        setAllStyles(stylesRes.data);
        setAllLanguages(langsRes.data);
        setArtistData(profileRes.data);
        
      } catch (error) {
        console.error('Error al cargar datos:', error);
        // Si falla obtener el perfil de artista, usar el perfil general
        if (error.response?.status === 404) {
          // Si no tiene perfil de artista, crear uno básico con los datos del usuario
          setArtistData({
            ...profile,
            bio: null,
            availability: true,
            price_policy: null,
            styles: [],
            languages: [],
            portfolio: [],
            followers: 0,
            following: 0,
            sales: 0,
            purchases: 0,
            favorites: 0,
            reviews: 0,
            rating: 0
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (profile?.is_artist) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const handleSave = async (formData) => {
    try {
      const response = await axios.put(
        'http://localhost:5000/api/auth/artist-profile', 
        formData, 
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );
      
      // Actualizar datos locales con la respuesta
      if (response.data.profile) {
        setArtistData(response.data.profile);
      }
      
      // Actualizar también el contexto de usuario
      await fetchProfile();
      
      alert('Perfil actualizado exitosamente');
      
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Error al actualizar el perfil: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return (
      <>
        <MainNav />
        <main className="main-content">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '60vh',
            fontSize: '18px',
            color: '#666'
          }}>
            Cargando perfil de artista...
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!profile?.is_artist) {
    return (
      <>
        <MainNav />
        <main className="main-content">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '60vh',
            fontSize: '18px',
            color: '#666'
          }}>
            No tienes una cuenta de artista activada.
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <MainNav />

      <main className="main-content">
        <section className="artist-profile-section">
          <ArtistPortfolio
            artist={artistData || profile}
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