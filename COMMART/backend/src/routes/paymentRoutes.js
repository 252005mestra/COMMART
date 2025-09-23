import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { 
  createPaymentSessionController, 
  handlePaymentWebhookController 
} from '../controllers/paymentController.js';

const router = express.Router();

// Crear sesión de pago (requiere autenticación)
router.post('/create-session', verifyToken, createPaymentSessionController);

// Webhook de Wompi (NO requiere autenticación)
router.post('/webhook', handlePaymentWebhookController);

// Ruta de prueba para verificar el servicio
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Servicio de pagos activo',
    timestamp: new Date().toISOString()
  });
});

// AGREGAR esta ruta temporal para simular el webhook:

// Ruta temporal para simular webhook (SOLO PARA TESTING)
router.post('/simulate-webhook/:orderId', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('🔧 [SIMULACIÓN] Simulando webhook para pedido:', orderId);
    
    // Simular datos de webhook de Wompi
    const simulatedWebhook = {
      event: 'transaction.updated',
      data: {
        reference: `COMMART-${orderId}-${Date.now()}`,
        status: 'APPROVED'
      }
    };
    
    // Crear request simulado
    const fakeReq = {
      body: simulatedWebhook
    };
    
    const fakeRes = {
      status: (code) => ({ send: (msg) => console.log(`Response: ${code} - ${msg}`) })
    };
    
    // Ejecutar el controlador del webhook
    await handlePaymentWebhookController(fakeReq, fakeRes);
    
    res.json({ success: true, message: 'Webhook simulado exitosamente' });
    
  } catch (error) {
    console.error('Error simulando webhook:', error);
    res.status(500).json({ success: false, message: 'Error en simulación' });
  }
});

export default router;