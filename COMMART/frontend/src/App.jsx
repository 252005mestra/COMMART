import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Home from './pages/Home'
import EditProfile from './pages/EditProfile'
import ArtistProfile from './pages/ArtistProfile'
import ResetPassword from './pages/ResetPasswordPage'
import PrivateRoute from './components/PrivateRoute'
import Profile from './components/Profile'
import PublicArtistProfile from './pages/PublicArtistProfile'
import PublicUserProfile from './pages/PublicUserProfile'
import ArtistOrders from './pages/ArtistOrders'
import ClientOrders from './pages/ClientOrders'
import CreateOrder from './components/CreateOrder'
import CreateOrderPage from './pages/CreateOrderPage'
import OrderTracking from './pages/OrderTracking'
import { useUser } from './context/UserContext'
import AdminDashboard from './pages/AdminDashboard'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Help from './pages/Help'

const App = () => {
  const { profile } = useUser()

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

        {/* Ruta para perfil de artista propio */}
        <Route
          path='/artist-profile'
          element={
            <PrivateRoute>
              <ArtistProfile />
            </PrivateRoute>
          }
        />

        <Route path='/reset-password/:token' element={<ResetPassword />} />

        {/* Ruta para perfil de usuario propio */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        {/* Rutas públicas para ver perfiles de otros usuarios */}
        <Route path="/artist/:id" element={<PublicArtistProfile />} />
        
        <Route
          path='/user/:id'
          element={
            <PrivateRoute>
              <PublicUserProfile />
            </PrivateRoute>
          }
        />

        {/* Rutas de pedidos */}
        <Route
          path="/artist/orders"
          element={
            <PrivateRoute>
              <ArtistOrders />
            </PrivateRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <PrivateRoute>
              <ClientOrders />
            </PrivateRoute>
          }
        />

        <Route
          path="/order/new/:artistId"
          element={
            <PrivateRoute>
              <CreateOrder />
            </PrivateRoute>
          }
        />

        <Route
          path="/orders/:id"
          element={
            <PrivateRoute>
              <OrderTracking user={profile} />
            </PrivateRoute>
          }
        />

        <Route
          path="/artist/:artistId/order"
          element={
            <PrivateRoute>
              <CreateOrderPage />
            </PrivateRoute>
          }
        />

        <Route
          path='/admin/dashboard'
          element={<AdminDashboard />}
        />

        <Route 
          path="/terms" 
          element={<Terms />}
        />

        <Route 
          path="/privacy" 
          element={<Privacy />} 
        />

        <Route 
          path="/help" 
          element={<Help />} 
        />

      </Routes>
    </>
  )
}

export default App
