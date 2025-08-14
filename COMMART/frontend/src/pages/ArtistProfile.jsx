import { useUser } from '../context/UserContext';

const ArtistProfile = () => {
  const { profile } = useUser();

  if (!profile) return null;

  return (
    <div className="artist-profile">
      <h1>Perfil de Artista</h1>
      <p><strong>Nombre artístico:</strong> {profile.username}</p>
      <p><strong>Email:</strong> {profile.email}</p>
      {/* Puedes agregar aquí portafolio, estilos, biografía, etc. */}
      {/* Ejemplo: */}
      {profile.bio && <p><strong>Biografía:</strong> {profile.bio}</p>}
      {profile.styles && (
        <div>
          <strong>Estilos:</strong>
          <ul>
            {profile.styles.map(style => (
              <li key={style}>{style}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ArtistProfile;