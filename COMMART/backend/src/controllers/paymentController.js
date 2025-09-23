import crypto from 'crypto';
import { getOrderById, updateOrderPaymentStatus } from '../models/orderModel.js';
import { createNotification } from '../models/notificationModel.js';

// Configuración de Wompi
const WOMPI_PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY || 'pub_test_smNFutR1Lt5liWNzx1WeH5km8qxIiWWc';
const WOMPI_INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET || 'test_integrity_4CI9rdnxrqepWyjyLrd3DjxKX69l730t';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Crear sesión de pago
export const createPaymentSessionController = async (req, res) => {
  try {
    console.log('💳 Iniciando creación de sesión de pago...');
    console.log('📋 Datos recibidos:', req.body);
    console.log('📋 Usuario:', req.user ? { id: req.user.id, email: req.user.email } : 'No autenticado');
    
    const { orderId, amount, customerEmail, customerName } = req.body;
    
    // Validaciones estrictas
    if (!orderId || !amount || !customerEmail || !customerName) {
      console.error('❌ Faltan datos requeridos:', { orderId, amount, customerEmail, customerName });
      return res.status(400).json({ 
        success: false,
        message: 'Faltan datos requeridos para el pago',
        required: ['orderId', 'amount', 'customerEmail', 'customerName']
      });
    }

    if (amount <= 0) {
      console.error('❌ Monto inválido:', amount);
      return res.status(400).json({ 
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    // Verificar que el pedido existe y pertenece al usuario
    const order = await getOrderById(orderId);
    if (!order) {
      console.error('❌ Pedido no encontrado:', orderId);
      return res.status(404).json({ 
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    console.log('📋 Pedido encontrado:', { id: order.id, client_id: order.client_id, is_paid: order.is_paid });

    if (order.client_id !== req.user.id) {
      console.error('❌ Permisos insuficientes:', { order_client: order.client_id, user: req.user.id });
      return res.status(403).json({ 
        success: false,
        message: 'No tienes permisos para pagar este pedido'
      });
    }

    if (order.is_paid) {
      console.log('⚠️ Pedido ya pagado');
      return res.status(400).json({ 
        success: false,
        message: 'Este pedido ya ha sido pagado'
      });
    }

    // Generar referencia única
    const reference = `COMMART-${orderId}-${Date.now()}`;
    console.log(`📝 Referencia generada: ${reference}`);
    
    // Convertir a centavos
    const amountInCents = Math.round(parseFloat(amount) * 100);
    const currency = 'COP';
    
    console.log(`💰 Conversión: ${amount} COP = ${amountInCents} centavos`);
    
    // Generar firma de integridad
    const integrityString = `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_SECRET}`;
    const signature = crypto.createHash('sha256').update(integrityString).digest('hex');
    
    console.log('🔐 Firma generada:', signature.substring(0, 10) + '...');
    
    // URLs de redirección
    const redirectUrl = `${FRONTEND_URL}/orders/${orderId}?payment=success`;
    
    // Datos para Wompi
    const paymentData = {
      public_key: WOMPI_PUBLIC_KEY,
      currency: currency,
      amount_in_cents: amountInCents,
      reference: reference,
      signature: {
        integrity: signature
      },
      redirect_url: redirectUrl,
      customer_data: {
        email: customerEmail,
        full_name: customerName,
        phone_number: '+573117152353'
      }
    };
    
    console.log('✅ Datos preparados para Wompi:', {
      public_key: paymentData.public_key ? 'PRESENT' : 'MISSING',
      currency: paymentData.currency,
      amount_in_cents: paymentData.amount_in_cents,
      reference: paymentData.reference,
      redirect_url: paymentData.redirect_url,
      hasSignature: !!paymentData.signature?.integrity,
      hasCustomerData: !!paymentData.customer_data
    });
    
    console.log('🔥 [BACKEND] Datos finales que se envían al frontend:');
    console.log('🔥 [BACKEND] public_key:', paymentData.public_key);
    console.log('🔥 [BACKEND] currency:', paymentData.currency);
    console.log('🔥 [BACKEND] amount_in_cents:', paymentData.amount_in_cents);
    console.log('🔥 [BACKEND] reference:', paymentData.reference);

    console.log('✅ Sesión de pago creada exitosamente');
    
    // Responder con los datos
    res.json({
      success: true,
      data: paymentData
    });
    
  } catch (error) {
    console.error('❌ Error creando sesión de pago:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor al crear sesión de pago'
    });
  }
};

export const handlePaymentWebhookController = async (req, res) => {
  try {
    console.log('🔔 Webhook recibido de Wompi:', JSON.stringify(req.body, null, 2));
    
    const { event, data } = req.body;
    
    if (!event || !data) {
      console.log('⚠️ Webhook sin event o data');
      return res.status(400).send('Estructura de webhook inválida');
    }
    
    // ✅ CORREGIR: Wompi envía los datos de transacción dentro de data.transaction
    const transaction = data.transaction;
    
    if (!transaction) {
      console.log('⚠️ No hay datos de transacción en el webhook');
      return res.status(400).send('No hay datos de transacción');
    }
    
    const { reference, status } = transaction;
    
    if (!reference || !status) {
      console.log('⚠️ Faltan reference o status en transaction:', { reference, status });
      return res.status(400).send('Faltan datos de referencia o estado');
    }
    
    if (event !== 'transaction.updated') {
      console.log(`ℹ️ Evento ignorado: ${event}`);
      return res.status(200).send('Evento ignorado');
    }
    
    console.log(`📋 Procesando pago - Referencia: ${reference}, Estado: ${status}`);
    
    const referenceMatch = reference.match(/COMMART-(\d+)-/);
    if (!referenceMatch) {
      console.log('⚠️ Formato de referencia inválido:', reference);
      return res.status(400).send('Formato de referencia inválido');
    }
    
    const orderId = parseInt(referenceMatch[1]);
    console.log(`🆔 ID del pedido: ${orderId}`);

    const order = await getOrderById(orderId);
    if (!order) {
      console.log('❌ Pedido no encontrado:', orderId);
      return res.status(404).send('Pedido no encontrado');
    }

    if (status === 'APPROVED') {
      console.log('✅ Pago APROBADO - Actualizando pedido...');
      
      // ✅ ACTUALIZAR EL ESTADO DE PAGO
      await updateOrderPaymentStatus(orderId, true);
      
      console.log('🎯 Estado de pago actualizado en la base de datos');
      
      // Verificar que se actualizó correctamente
      const updatedOrder = await getOrderById(orderId);
      console.log('📋 Pedido después de actualizar:', {
        id: updatedOrder.id,
        is_paid: updatedOrder.is_paid,
        paid_at: updatedOrder.paid_at
      });
      
      // Notificar al artista
      await createNotification({
        user_id: order.artist_id,
        type: 'payment',
        message: `¡Pago recibido! El cliente ha pagado el pedido #${orderId}. Puedes continuar con el trabajo.`,
        link: `/orders/${orderId}`,
        order_id: orderId,
        is_read: false
      });
      
      console.log('🎉 Pedido marcado como pagado y artista notificado');
      
    } else if (status === 'DECLINED') {
      console.log('❌ Pago RECHAZADO');
      
      await createNotification({
        user_id: order.client_id,
        type: 'payment_failed',
        message: `El pago del pedido #${orderId} fue rechazado. Puedes intentar nuevamente.`,
        link: `/orders/${orderId}`,
        order_id: orderId,
        is_read: false
      });
      
    } else {
      console.log(`ℹ️ Estado de pago: ${status} - Sin acción requerida`);
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    res.status(500).send('Error interno del servidor');
  }
};