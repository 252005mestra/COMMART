import { useUser } from '../context/UserContext';
import { Link } from 'react-router-dom';
import MainNav from '../components/MainNav';
import Footer from '../components/Footer';
import { CircleUserRound, Settings, Star, Heart } from 'lucide-react';

const UserProfile = () => {
  const { profile } = useUser();

  const getProfileImageUrl = (imgPath) =>
    imgPath ? `http://localhost:5000/${imgPath}` : '/default-profile.jpg';

  return (
    <>
      <MainNav />

      <main className="main-content">
        <section className="user-profile-section">
          <div className="profile-container">
            <div className="profile-header">
              <div className="profile-avatar-section">
                <div className="profile-avatar">
                  {profile?.profile_image ? (
                    <img 
                      src={getProfileImageUrl(profile.profile_image)} 
                      alt={profile.username} 
                    />
                  ) : (
                    <CircleUserRound size={80} />
                  )}
                </div>
              </div>
              
              <div className="profile-info">
                <h1 className="profile-username">{profile?.username}</h1>
                <p className="profile-email">{profile?.email}</p>
                
                <div className="profile-actions">
                  <Link to="/edit-profile" className="btn-edit-profile">
                    <Settings size={16} />
                    Editar perfil
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="user-stats-section">
          <div className="stats-container">
            <div className="stat-card">
              <Star className="stat-icon" />
              <h3>Mis Artistas Favoritos</h3>
              <p>{profile?.favorites || 0}</p>
              <span className="stat-description">Artistas que agregaste a tus favoritos</span>
            </div>
            
            <div className="stat-card">
              <Heart className="stat-icon" />
              <h3>Artistas que Sigo</h3>
              <p>{profile?.followedArtistsCount || 0}</p>
              <span className="stat-description">Artistas que sigues</span>
            </div>

            {profile?.is_artist && (
              <div className="stat-card">
                <Star className="stat-icon artist-stat" />
                <h3>Me Tienen de Favorito</h3>
                <p>{profile?.peopleWhoFavoriteMe || 0}</p>
                <span className="stat-description">Personas que te tienen como favorito</span>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default UserProfile;