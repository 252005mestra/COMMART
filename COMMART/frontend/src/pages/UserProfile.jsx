import { useUser } from '../context/UserContext';

const UserProfile = () => {
  const { profile } = useUser();

  if (!profile) return null;

  return (
    <div className="user-profile">
      <h1>Perfil de Usuario</h1>
      <p><strong>Nombre:</strong> {profile.username}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      {/* Agrega aquí más campos si los tienes, como fecha de registro, avatar, etc. */}
    </div>
  );
};

export default UserProfile;