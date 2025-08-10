import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Home from './pages/Home'
import EditProfile from './pages/EditProfile'
import PrivateRoute from './components/PrivateRoute'


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
      </Routes>
    </>
  )
}

export default App
