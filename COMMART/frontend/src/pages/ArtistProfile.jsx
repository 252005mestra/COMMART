import { useEffect, useState } from 'react';
import axios from 'axios';
import MainNav from '../components/MainNav';
import ArtistPortfolio from '../components/ArtistPortfolio';

const ArtistProfile = () => {
  const [artist, setArtist] = useState(null);
  const [allStyles, setAllStyles] = useState([]);
  const [allLanguages, setAllLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, stylesRes, langsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/auth/artist/profile', { withCredentials: true }),
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
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (!artist) return <div>No eres artista.</div>;

  return (
    <>
      <MainNav />
      <ArtistPortfolio
        artist={artist}
        allStyles={allStyles}
        allLanguages={allLanguages}
        isOwnProfile={true}
        onSave={async (formData) => {
          const res = await axios.put('http://localhost:5000/api/auth/artist/profile', formData, {
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setArtist(res.data);
        }}
      />
    </>
  );
};

export default ArtistProfile;