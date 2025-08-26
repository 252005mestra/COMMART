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
    verifyCurrentPasswordController,
    findUserForRecoveryController,
    forgotPasswordController,
    resetPasswordController,
    getOwnArtistProfileController,
    updateArtistProfileController,
    getPublicArtistProfileController,
    getAllStylesController,
    getAllLanguagesController
} from '../controllers/authController.js';

// Importar modelos directamente para la ruta de eliminar imagen
import { removePortfolioImageModel, getArtistFullProfileModel, getAllStylesModel, getAllLanguagesModel } from '../models/userModel.js';
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
    
    // Determinar prefijo según el campo
    let prefix = 'file';
    if (file.fieldname === 'profile_image') {
      prefix = 'profile';
    } else if (file.fieldname === 'portfolio_images') {
      prefix = 'portfolio';
    }
    
    cb(null, prefix + '-' + uniqueSuffix + path.extname(file.originalname))
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
router.get('/styles', getAllStylesController);

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

// Rutas para recuperación de contraseña 
router.post('/find-user', findUserForRecoveryController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password/:token', resetPasswordController);

// Perfil propio de artista
router.get('/artist-profile', verifyToken, getOwnArtistProfileController);

// Actualizar perfil de artista - usando fields para múltiples tipos de archivos
router.put(
  '/artist-profile',
  verifyToken,
  upload.fields([
    { name: 'portfolio_images', maxCount: 6 },
    { name: 'profile_image', maxCount: 1 }
  ]),
  updateArtistProfileController
);

// Eliminar imagen de portafolio - corregido
router.delete('/artist/portfolio/:imageId', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { imageId } = req.params;
    
    await removePortfolioImageModel(userId, imageId);
    res.status(200).json({ message: 'Imagen eliminada exitosamente.' });
  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({ message: 'Error al eliminar imagen.' });
  }
});

// Perfil público de artista por ID
router.get('/artist/:id', getPublicArtistProfileController);

// Obtener todos los estilos
router.get('/styles', getAllStylesController);

// Obtener todos los idiomas
router.get('/languages', getAllLanguagesController);

export default router;