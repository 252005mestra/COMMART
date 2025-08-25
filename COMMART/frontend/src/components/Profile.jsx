import { useUser } from '../context/UserContext';
import UserProfile from '../pages/UserProfile';
import ArtistProfile from '../pages/ArtistProfile';

const Profile = () => {
  const { profile, loading } = useUser();

  if (loading) return <div>Cargando...</div>;
  if (!loading && !profile) return <div>No tienes acceso a esta vista.</div>;

  return profile?.is_artist || profile?.role === 'artist'
    ? <ArtistProfile />
    : <UserProfile />;
};

export default Profile;