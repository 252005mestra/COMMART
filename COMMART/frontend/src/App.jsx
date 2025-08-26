import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Home from './pages/Home'
import EditProfile from './pages/EditProfile'
import ArtistProfile from './pages/ArtistProfile'  // <-- Agregar esta importación
import ResetPassword from './pages/ResetPasswordPage'; // o './pages/ResetPassword'
import PrivateRoute from './components/PrivateRoute'
import Profile from './components/Profile';
import PublicArtistProfile from './pages/PublicArtistProfile';


const App = () => {
  return (
    <>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        
        <Route
          path='/home'
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        
        <Route
          path='/edit-profile'
          element={
            <PrivateRoute>
              <EditProfile />
            </PrivateRoute>
          }
        />

        {/* Agregar ruta para perfil de artista propio */}
        <Route
          path='/artist-profile'
          element={
            <PrivateRoute>
              <ArtistProfile />
            </PrivateRoute>
          }
        />

        <Route path='/reset-password/:token' element={<ResetPassword />} />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        <Route path="/artist/:id" element={<PublicArtistProfile />} />

      </Routes>
    </>
  )
}

export default App
