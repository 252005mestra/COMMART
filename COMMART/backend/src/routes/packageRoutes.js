import express from 'express';
import { getArtistPackagesController } from '../controllers/packageController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Obtener paquetes de un artista
router.get('/artist/:artistId', verifyToken, getArtistPackagesController);

export default router;