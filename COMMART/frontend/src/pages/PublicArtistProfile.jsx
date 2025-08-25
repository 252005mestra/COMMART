import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import ArtistPortfolio from '../components/ArtistPortfolio';

const PublicArtistProfile = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [allStyles, setAllStyles] = useState([]);
  const [allLanguages, setAllLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, stylesRes, langsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/auth/artist/${id}`),
          axios.get('http://localhost:5000/api/auth/styles'),
          axios.get('http://localhost:5000/api/auth/languages')
        ]);
        setArtist(profileRes.data);
        setAllStyles(stylesRes.data);
        setAllLanguages(langsRes.data);
      } catch (err) {
        console.error('Error al cargar perfil:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const handleOrder = () => {
    alert('Funcionalidad de hacer pedido');
  };

  const handleFollow = () => {
    setIsFollowing((prev) => !prev);
  };

  const handleFavorite = () => {
    setIsFavorite((prev) => !prev);
  };

  if (loading) return <div>Cargando...</div>;
  if (!artist) return <div>Artista no encontrado.</div>;

  return (
    <>
      <MainNav />
      
      <main className="main-content">
        <section className="public-artist-section">
          <ArtistPortfolio
            artist={artist}
            allStyles={allStyles}
            allLanguages={allLanguages}
            isOwnProfile={false}
            onOrder={handleOrder}
            onFollow={handleFollow}
            onFavorite={handleFavorite}
            isFollowing={isFollowing}
            isFavorite={isFavorite}
          />
        </section>
      </main>

      <Footer />
    </>
  );
};

export default PublicArtistProfile;