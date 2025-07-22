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

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

router.get('/protected', verifyToken, (req, res) => {
    res.status(200).json({
        message: 'Accediste a una ruta protegida!',
        user: req.user
    });
});

router.get('/public-artists', getPublicArtists);

router.get('/users', verifyToken, getAllUsers);
router.get('/users/:id', verifyToken, getUserById);
router.put('/users/:id', verifyToken, updateUser);
router.delete('/users/:id', verifyToken, deleteUser);

export default router;