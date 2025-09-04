import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import ArtistPortfolio from '../components/ArtistPortfolio';
import ProfileTabsSection from '../components/ProfileTabsSection';
import { useUser } from '../context/UserContext';
import CreateOrder from '../components/CreateOrder'; // Asegúrate de que el import sea correcto

const PublicArtistProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, fetchProfile } = useUser();

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
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const [profileRes, stylesRes, langsRes, followRes, favoriteRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/auth/artist/${id}`),
          axios.get('http://localhost:5000/api/auth/styles'),
          axios.get('http://localhost:5000/api/auth/languages'),
          axios.get(`http://localhost:5000/api/auth/artists/${id}/follow-status`, { withCredentials: true }).catch(() => ({ data: { isFollowing: false } })),
          axios.get(`http://localhost:5000/api/auth/artists/${id}/favorite-status`, { withCredentials: true }).catch(() => ({ data: { isFavorite: false } }))
        ]);
        setArtist(profileRes.data);
        setAllStyles(stylesRes.data);
        setAllLanguages(langsRes.data);
        setIsFollowing(followRes.data.isFollowing);
        setIsFavorite(favoriteRes.data.isFavorite);
      } catch (err) {
        setArtist(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [id]);

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
      setArtist(prev => ({
        ...prev,
        followers: response.data.isFollowing
          ? (prev.followers || 0) + 1
          : Math.max(0, (prev.followers || 0) - 1)
      }));
    } catch (error) {
      alert('Error al procesar la acción. Inténtalo de nuevo.');
    } finally {
      setActionLoading(prev => ({ ...prev, follow: false }));
    }
  };

  const handleFavorite = async () => {
    if (actionLoading.favorite) return;
    try {
      setActionLoading(prev => ({ ...prev, favorite: true }));
      await axios.post(
        `http://localhost:5000/api/auth/artists/${id}/favorite`,
        {},
        { withCredentials: true }
      );
      setIsFavorite(prev => !prev);
      await fetchProfile();
    } catch (error) {
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

  // Solo mostrar el botón de pedido si no es tu propio perfil
  const isOwnProfile = profile && String(profile.id) === String(id);

  return (
    <>
      <MainNav />
      <main className="main-content">
        <section className="public-artist-section">
          <ArtistPortfolio
            artist={artist}
            allStyles={allStyles}
            allLanguages={allLanguages}
            isOwnProfile={isOwnProfile}
            onOrder={() => setShowOrderModal(true)}
            onFollow={handleFollow}
            onFavorite={handleFavorite}
            isFollowing={isFollowing}
            isFavorite={isFavorite}
            actionLoading={actionLoading}
          />
        </section>

        {/* Sección de pestañas para artista - VISTA PÚBLICA */}
        {artist && (
          <ProfileTabsSection
            data={{
              packages: artist.packagesList || [],
              favorites: artist.favoritesList || [],
              reviews: artist.reviewsList || [],
            }}
            isArtist={true}
            isPublicView={true}
            artistId={artist.id}
          />
        )}


        {/* Modal para crear pedido */}
        {showOrderModal && (
          <div
            className="order-modal-overlay"
            onClick={e => {
              if (e.target.classList.contains('order-modal-overlay')) setShowOrderModal(false);
            }}
          >
            <div
              className="order-modal-content"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="close-button"
                onClick={() => setShowOrderModal(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
              <CreateOrder
                artistId={artist.id}
                onClose={() => setShowOrderModal(false)}
                onOrderCreated={() => setShowOrderModal(false)}
              />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
};

export default PublicArtistProfile;