import express from 'express';
import multer from 'multer';
import path from 'path';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
  createOrderController,
  getArtistOrdersController,
  getClientOrdersController,
  getOrderDetailsController,
  updateOrderStatusController,
} from '../controllers/orderController.js';
import {
  advanceOrderPhaseController,
  uploadSampleController,
  sendPhaseMessageController,
  getPhaseSamplesController,
  getPhaseMessagesController,
  payOrderController,
  uploadFinalArtController
} from '../controllers/orderProcessController.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/uploads/references/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ref-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const finalArtStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'final-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadFinalArt = multer({ storage: finalArtStorage });

// Crear pedido (cliente) - acepta imágenes
router.post('/', verifyToken, upload.array('reference_images', 3), createOrderController);

// Listar pedidos del artista autenticado
router.get('/artist', verifyToken, getArtistOrdersController);

// Listar pedidos del cliente autenticado
router.get('/client', verifyToken, getClientOrdersController);

// Detalles de un pedido
router.get('/:id', verifyToken, getOrderDetailsController);

// Cambiar estado del pedido
router.put('/:id/status', verifyToken, updateOrderStatusController);

// Avanzar etapa del pedido
router.put('/:id/phase', verifyToken, advanceOrderPhaseController);

// Enviar mensaje sobre el pedido
router.post('/:id/sample', verifyToken, upload.single('sample_image'), uploadSampleController);
router.post('/:id/message', verifyToken, sendPhaseMessageController);

// Obtener mensajes de un pedido
router.get('/:id/samples/:phase', verifyToken, getPhaseSamplesController);
router.get('/:id/messages/:phase', verifyToken, getPhaseMessagesController);

// Pagar un pedido
router.post('/:id/pay', verifyToken, payOrderController);

// Subir arte final
router.post('/:id/final', verifyToken, uploadFinalArt.single('final_image'), uploadFinalArtController);

export default router;