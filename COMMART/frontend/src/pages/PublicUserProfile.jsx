import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import ProfileTabsSection from '../components/ProfileTabsSection';
import { CircleUserRound } from 'lucide-react';
import { useUser } from '../context/UserContext';
import '../styles/userprofile.css';

const PublicUserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile: currentUser } = useUser();

  // Redirigir si el usuario intenta ver su propio perfil público
  useEffect(() => {
    if (currentUser && String(currentUser.id) === String(id)) {
      // Redirigir a vista privada si intentas ver tu propio perfil público
      navigate('/profile', { replace: true });
    }
  }, [currentUser, id, navigate]);

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/auth/public-user/${id}`, {
          withCredentials: true
        });
        setUserProfile(response.data);
      } catch (err) {
        console.error('Error al cargar perfil:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id && (!currentUser || String(currentUser.id) !== String(id))) {
      fetchProfile();
    }
  }, [id, currentUser]);

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
            Cargando perfil del usuario...
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!userProfile) {
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
            Usuario no encontrado.
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const getProfileImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-profile.jpg';

  return (
    <>
      <MainNav />
      
      <main className="main-content">
        <section className="user-profile-section">
          <div className="user-profile-header">
            <div className="user-profile-avatar">
              {userProfile.profile_image ? (
                <img src={getProfileImageUrl(userProfile.profile_image)} alt={userProfile.username} />
              ) : (
                <CircleUserRound size={60} />
              )}
            </div>
            
            <div className="user-profile-info">
              <h1>{userProfile.username}</h1>
              <div className="user-profile-stats">
                <span><strong>{userProfile.followedArtistsCount || 0}</strong> Seguidos</span>
                <span><strong>{userProfile.favorites || 0}</strong> Favoritos</span>
                <span><strong>{userProfile.purchases || 0}</strong> Compras</span>
                <span><strong>{userProfile.reviews || 0}</strong> Reseñas</span>
              </div>
            </div>
          </div>
        </section>

        {/* Solo mostrar favoritos y reseñas en la versión pública */}
        <ProfileTabsSection
          data={{
            favorites: userProfile.favoritesList || [],
            reviews: userProfile.reviewsList || [],
          }}
          isArtist={false}
          isPublicView={true} // Nueva prop para indicar que es vista pública
        />
      </main>

      <Footer />
    </>
  );
};

export default PublicUserProfile;