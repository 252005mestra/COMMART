import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import MainNav from '../components/MainNav';
import ArtistPortfolio from '../components/ArtistPortfolio';

const PublicArtistProfile = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [allStyles, setAllStyles] = useState([]);
  const [allLanguages, setAllLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

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
        // Manejo de error
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) return <div>Cargando...</div>;
  if (!artist) return <div>Artista no encontrado.</div>;

  return (
    <>
      <MainNav />
      <ArtistPortfolio
        artist={artist}
        allStyles={allStyles}
        allLanguages={allLanguages}
        isOwnProfile={false}
      />
    </>
  );
};

export default PublicArtistProfile;