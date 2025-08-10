// Rutas de autenticación y usuarios
import express from 'express';
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getUsersController,  
    getUserByIdController, 
    updateUserByIdController, 
    deleteUserController, 
    getPublicArtistsController, 
    getAllArtistsController, 
    getArtistsByStyleController, 
    getStylesController, 
    getUserProfileController, 
    updateUserProfileController, 
    checkUsernameController, 
    verifyCurrentPasswordController  
} from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
});

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
router.get('/public-artists', getPublicArtistsController);
router.get('/artists', verifyToken, getAllArtistsController);
router.get('/artists/style/:styleId', verifyToken, getArtistsByStyleController);
router.get('/styles', getStylesController);

// Rutas protegidas para usuarios (admin)
router.get('/users', verifyToken, getUsersController);
router.get('/users/:id', verifyToken, getUserByIdController);
router.put('/users/:id', verifyToken, updateUserByIdController);
router.delete('/users/:id', verifyToken, deleteUserController);

// Rutas para perfil del usuario actual
router.get('/profile', verifyToken, getUserProfileController);
router.put('/profile', verifyToken, upload.single('profile_image'), updateUserProfileController);
router.post('/check-username', verifyToken, checkUsernameController);
router.post('/verify-password', verifyToken, verifyCurrentPasswordController);

export default router;