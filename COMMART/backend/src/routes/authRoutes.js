// Rutas de autenticación y usuarios
import express from 'express';
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getAllUsers, 
    getUserById, 
    updateUser, 
    deleteUser,
    getPublicArtists 
} from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Registro, login y logout
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

// Ruta protegida de ejemplo
router.get('/protected', verifyToken, (req, res) => {
    res.status(200).json({
        message: 'Accediste a una ruta protegida!',
        user: req.user
    });
});

// Obtener artistas públicos para la landing
router.get('/public-artists', getPublicArtists);

// Rutas protegidas para usuarios
router.get('/users', verifyToken, getAllUsers);
router.get('/users/:id', verifyToken, getUserById);
router.put('/users/:id', verifyToken, updateUser);
router.delete('/users/:id', verifyToken, deleteUser);

export default router;