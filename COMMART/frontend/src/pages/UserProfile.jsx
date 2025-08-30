import { useRef, useState } from 'react';
import { useUser } from '../context/UserContext';
import { Settings, Camera, CircleUserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import MainNav from '../components/MainNav';
import '../styles/userprofile.css';
import axios from 'axios';
import UserListModal from '../components/UserListModal';
import ProfileTabsSection from '../components/ProfileTabsSection';
import Footer from '../components/Footer'; // Agregar import

const UserProfile = () => {
  const { profile, removeFavoriteArtist, fetchProfile } = useUser();
  const fileInputRef = useRef(null);

  // Imagen actual y preview
  const [imagePreview, setImagePreview] = useState(
    profile?.profile_image ? `http://localhost:5000/${profile.profile_image}` : null
  );
  // Nueva imagen seleccionada (temporal)
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingImageUrl, setPendingImageUrl] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);

  // Manejar selección de imagen (solo preview y confirmación)
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no puede ser mayor a 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPendingImage(file);
        setPendingImageUrl(ev.target.result);
        setShowConfirm(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Confirmar cambio de imagen
  const handleConfirmChange = async () => {
    if (!pendingImage) return;
    const formData = new FormData();
    formData.append('profile_image', pendingImage);
    try {
      await axios.put('http://localhost:5000/api/auth/profile', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (typeof fetchProfile === 'function') await fetchProfile();
      setImagePreview(pendingImageUrl);
      setShowConfirm(false);
      setPendingImage(null);
      setPendingImageUrl(null);
    } catch (err) {
      alert('Error al actualizar la foto de perfil');
    }
  };

  // Cancelar cambio de imagen
  const handleCancelChange = () => {
    setPendingImage(null);
    setPendingImageUrl(null);
    setShowConfirm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getProfileImageUrl = () =>
    imagePreview || '/default-profile.jpg';

  return (
    <>
      <MainNav />
      
      <main className="main-content">
        <section className="user-profile-section">
          <div className="user-profile-header">
            <div
              className="user-profile-avatar editable-avatar"
              onClick={() => fileInputRef.current?.click()}
              title="Hacer click para cambiar foto de perfil"
              style={{ cursor: 'pointer' }}
            >
              {imagePreview ? (
                <img src={getProfileImageUrl()} alt={profile?.username || 'Usuario'} />
              ) : (
                <CircleUserRound size={60} />
              )}
              <div className="camera-overlay">
                <Camera size={20} />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleProfileImageChange}
              />
            </div>
            <div className="user-profile-info">
              <h1>{profile?.username}</h1>
              <div className="user-profile-stats">
                <span
                  className="stat-clickable"
                  onClick={() => setShowFollowingModal(true)}
                >
                  <strong>{profile?.followedArtistsCount || 0}</strong> Seguidos
                </span>
                <span
                  className="stat-clickable"
                  onClick={() => setShowFavoritesModal(true)}
                >
                  <strong>{profile?.favorites || 0}</strong> Favoritos
                </span>
                <span><strong>{profile?.purchases || 0}</strong> Compras</span>
                <span><strong>{profile?.reviews || 0}</strong> Reseñas</span>
              </div>
            </div>
          </div>
        </section>

        {/* Sección de pestañas de perfil - INCLUIR COMPRAS en versión privada */}
        {profile && (
          <ProfileTabsSection
            data={{
              purchases: profile.purchasesList || [],
              favorites: profile.favoritesList || [],
              reviews: profile.reviewsList || [],
            }}
            isArtist={profile.is_artist}
            isPublicView={false}
            onFavoriteToggle={async (artist) => {
              await removeFavoriteArtist(artist.id);
              await fetchProfile();
            }}
          />
        )}

        {/* Modales para seguidos y favoritos */}
        <UserListModal
          isOpen={showFollowingModal}
          onClose={() => setShowFollowingModal(false)}
          type="my-following"
          title="Seguidos"
        />
        <UserListModal
          isOpen={showFavoritesModal}
          onClose={() => setShowFavoritesModal(false)}
          type="my-favorites"
          title="Favoritos"
        />
      </main>

      <Footer />
    </>
  );
};

export default UserProfile;