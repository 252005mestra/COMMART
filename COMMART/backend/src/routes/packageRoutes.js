import express from 'express';
import multer from 'multer';
import fs from 'fs';
import {
  getArtistPackages,
  createArtistPackage,
  updateArtistPackage,
  deleteArtistPackage,
  getArtistExtras,
  createArtistExtra,
  updateArtistExtra,
  deleteArtistExtra
} from '../controllers/packageController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Configuración de multer para imágenes de paquetes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = 'src/uploads/package_images/';
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.originalname.slice(file.originalname.lastIndexOf('.'));
    cb(null, `pkg-${unique}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// ========== RUTAS DE PAQUETES ==========
router.get('/my', verifyToken, getArtistPackages);
router.post('/my', verifyToken, upload.fields([
  { name: 'reference_image1', maxCount: 1 },
  { name: 'reference_image2', maxCount: 1 }
]), createArtistPackage);
router.put('/my/:id', verifyToken, upload.fields([
  { name: 'reference_image1', maxCount: 1 },
  { name: 'reference_image2', maxCount: 1 }
]), updateArtistPackage);
router.delete('/my/:id', verifyToken, deleteArtistPackage);

// ========== RUTAS DE EXTRAS ==========
router.get('/my/extras', verifyToken, getArtistExtras);
router.post('/my/extras', verifyToken, createArtistExtra);
router.put('/my/extras/:id', verifyToken, updateArtistExtra);
router.delete('/my/extras/:id', verifyToken, deleteArtistExtra);

export default router;