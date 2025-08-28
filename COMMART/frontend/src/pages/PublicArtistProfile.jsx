import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import ArtistPortfolio from '../components/ArtistPortfolio';
import { useUser } from '../context/UserContext'; // Asegúrate de tener este hook

const PublicArtistProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useUser(); // Obtén el usuario autenticado

  // Redirigir si el usuario intenta ver su propio perfil público
  useEffect(() => {
    if (profile && String(profile.id) === String(id)) {
      navigate('/artist-profile', { replace: true });
    }
  }, [profile, id, navigate]);

  const [artist, setArtist] = useState(null);
  const [allStyles, setAllStyles] = useState([]);
  const [allLanguages, setAllLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [actionLoading, setActionLoading] = useState({ follow: false, favorite: false });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, stylesRes, langsRes, followRes, favoriteRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/auth/artist/${id}`),
          axios.get('http://localhost:5000/api/auth/styles'),
          axios.get('http://localhost:5000/api/auth/languages'),
          axios.get(`http://localhost:5000/api/auth/artists/${id}/follow-status`, {
            withCredentials: true
          }).catch(() => ({ data: { isFollowing: false } })),
          axios.get(`http://localhost:5000/api/auth/artists/${id}/favorite-status`, {
            withCredentials: true
          }).catch(() => ({ data: { isFavorite: false } }))
        ]);
        
        setArtist(profileRes.data);
        setAllStyles(stylesRes.data);
        setAllLanguages(langsRes.data);
        setIsFollowing(followRes.data.isFollowing);
        setIsFavorite(favoriteRes.data.isFavorite);
        
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

  const handleFollow = async () => {
    if (actionLoading.follow) return;
    
    try {
      setActionLoading(prev => ({ ...prev, follow: true }));
      
      const response = await axios.post(
        `http://localhost:5000/api/auth/artists/${id}/follow`,
        {},
        { withCredentials: true }
      );
      
      setIsFollowing(response.data.isFollowing);
      
      // Actualizar contador de seguidores del artista
      setArtist(prev => ({
        ...prev,
        followers: response.data.isFollowing 
          ? (prev.followers || 0) + 1 
          : Math.max(0, (prev.followers || 0) - 1)
      }));
      
    } catch (error) {
      console.error('Error al seguir/dejar de seguir:', error);
      alert('Error al procesar la acción. Inténtalo de nuevo.');
    } finally {
      setActionLoading(prev => ({ ...prev, follow: false }));
    }
  };

  const handleFavorite = async () => {
    if (actionLoading.favorite) return;
    
    try {
      setActionLoading(prev => ({ ...prev, favorite: true }));
      
      const response = await axios.post(
        `http://localhost:5000/api/auth/artists/${id}/favorite`,
        {},
        { withCredentials: true }
      );
      
      setIsFavorite(response.data.isFavorite);
      
    } catch (error) {
      console.error('Error al manejar favorito:', error);
      alert('Error al procesar la acción. Inténtalo de nuevo.');
    } finally {
      setActionLoading(prev => ({ ...prev, favorite: false }));
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
            Cargando perfil del artista...
          </div>
        </main>
        <Footer />
      </>
    );
  }
  
  if (!artist) {
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
            Artista no encontrado.
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
            actionLoading={actionLoading}
          />
        </section>
      </main>

      <Footer />
    </>
  );
};

export default PublicArtistProfile;