import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Home from './pages/Home'
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
      </Routes>
    </>
  )
}

export default App
