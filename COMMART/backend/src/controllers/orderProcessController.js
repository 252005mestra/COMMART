import { addMessage, getMessagesByOrderAndPhase } from '../models/orderMessageModel.js';
import { updateOrderFields, getOrderById } from '../models/orderModel.js';
import { updateOrderStatusModel } from '../models/orderModel.js';
import { createNotification } from '../models/notificationModel.js';
import dbConnection from '../config/db.js';
import fs from 'fs';
import path from 'path';

// Avanzar de fase
export const advanceOrderPhaseController = async (req, res) => {
  try {
    const { id } = req.params;
    const { next_phase } = req.body;
    const order = await getOrderById(id);

    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    // Solo el artista puede avanzar de fase
    if (req.user.id !== order.artist_id) {
      return res.status(403).json({ message: 'Solo el artista puede avanzar de fase.' });
    }

    // ✅ CORREGIR: Definir las 5 fases y sus transiciones correctas
    const validTransitions = {
      'plan': 'sketch',        // Planeación → Boceto
      'sketch': 'details',     // Boceto → Definición  
      'details': 'final',      // Definición → Últimos Detalles
      'final': 'completed'     // Últimos Detalles → Finalizado
      // 'completed' no avanza a nada (es el final)
    };

    console.log(`🔄 Intentando avanzar pedido ${id}:`, {
      current_stage: order.current_stage,
      next_phase: next_phase,
      valid_next: validTransitions[order.current_stage]
    });

    // Verificar que la transición sea válida
    if (!validTransitions[order.current_stage]) {
      return res.status(400).json({ 
        message: `No se puede avanzar desde la fase '${order.current_stage}'.` 
      });
    }

    if (validTransitions[order.current_stage] !== next_phase) {
      return res.status(400).json({ 
        message: `Transición no válida. Desde '${order.current_stage}' solo se puede avanzar a '${validTransitions[order.current_stage]}'.` 
      });
    }

    console.log(`📈 Avanzando pedido ${id} de ${order.current_stage} a ${next_phase}`);

    // Avanzar a la siguiente fase
    await updateOrderFields(id, { current_stage: next_phase });

    // ✅ MENSAJES CORREGIDOS para las 5 fases
    const phaseMessages = {
      'sketch': 'El pedido avanzó a la fase de Boceto. El artista comenzará con las propuestas iniciales.',
      'details': 'El pedido avanzó a la fase de Definición. El artista trabajará en los detalles del boceto elegido.',
      'final': 'El pedido avanzó a la fase de Últimos Detalles. El artista realizará los ajustes finales.',
      'completed': 'El pedido avanzó a la fase de Finalizado. El artista subirá la obra final.'
    };

    // Notificar al cliente
    await createNotification({
      user_id: order.client_id,
      type: 'phase_advanced',
      message: phaseMessages[next_phase] || `El pedido avanzó a la fase: ${next_phase}`,
      link: `/orders/${id}`,
      order_id: id,
      is_read: false
    });

    console.log(`✅ Pedido ${id} avanzó a ${next_phase}, cliente ${order.client_id} notificado`);

    res.json({ 
      message: 'Fase actualizada correctamente.',
      new_phase: next_phase 
    });
  } catch (error) {
    console.error('Error al avanzar de fase:', error);
    res.status(500).json({ message: 'Error al avanzar de fase.' });
  }
};

// Subir muestra
export const uploadSampleController = async (req, res) => {
  try {
    const { id } = req.params;
    const { phase } = req.body;

    console.log('📤 Recibiendo muestra:', {
      orderId: id,
      phase: phase,
      hasFile: !!req.file,
      fileName: req.file?.originalname
    });

    // Validaciones básicas
    if (!phase) {
      return res.status(400).json({ message: 'La fase es requerida.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ningún archivo.' });
    }

    // Verificar que el pedido existe
    const order = await getOrderById(id);
    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    // Solo el artista puede subir muestras
    if (req.user.id !== order.artist_id) {
      return res.status(403).json({ message: 'No autorizado.' });
    }

    // Verificar que la fase sea válida
    const validPhases = ['plan', 'sketch', 'details', 'final'];
    if (!validPhases.includes(phase)) {
      return res.status(400).json({ message: 'Fase no válida.' });
    }

    // Verificar límite de 3 muestras por fase
    const currentImages = order[`${phase}_image`];
    const currentCount = currentImages ? currentImages.split(',').filter(Boolean).length : 0;
    
    if (currentCount >= 3) {
      return res.status(400).json({ message: `Ya has subido el máximo de 3 muestras en la fase ${phase}.` });
    }

    const imagePath = req.file.path.replace(/\\/g, '/');
    console.log(`📁 Guardando imagen: ${imagePath}`);

    // Agregar la nueva imagen al campo correspondiente
    const newImages = currentImages 
      ? `${currentImages},${imagePath}` 
      : imagePath;

    await new Promise((resolve, reject) => {
      dbConnection.query(
        `UPDATE orders SET ${phase}_image = ? WHERE id = ?`,
        [newImages, id],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    console.log(`✅ Muestra subida correctamente para pedido ${id} en fase ${phase}`);

    res.json({ 
      message: 'Muestra subida correctamente.',
      image_path: imagePath 
    });

  } catch (error) {
    console.error('❌ Error al subir muestra:', error);
    res.status(500).json({ message: 'Error al subir la muestra.' });
  }
};

// Enviar mensaje
export const sendPhaseMessageController = async (req, res) => {
    console.log('POST /api/orders/:id/message', {
      params: req.params,
      body: req.body,
      user: req.user
    });
  try {
    const { id } = req.params;
    const { phase, message } = req.body;
    const sender_id = req.user.id;

    if (!phase || !message) {
      return res.status(400).json({ message: 'Faltan datos obligatorios.' });
    }

    await addMessage({ order_id: id, phase, sender_id, message });

    // Notificar al otro usuario
    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado.' });
    const notifyUser = sender_id === order.artist_id ? order.client_id : order.artist_id;
    await createNotification({
      user_id: notifyUser,
      type: 'order',
      message: `Nuevo mensaje en la fase: ${phase}`,
      link: `/orders/${id}`,
      is_read: false
    });

    res.json({ message: 'Mensaje enviado.' });
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({ message: 'Error al enviar mensaje.' });
  }
};

// Obtener muestras y mensajes por fase
export const getPhaseSamplesController = async (req, res) => {
  try {
    const { id, phase } = req.params;
    const samples = await getSamplesByOrderAndPhase(id, phase);
    res.json(samples);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener muestras.' });
  }
};
export const getPhaseMessagesController = async (req, res) => {
  try {
    const { id, phase } = req.params;
    const messages = await getMessagesByOrderAndPhase(id, phase);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener mensajes.' });
  }
};

// Pagar pedido
export const payOrderController = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado.' });

    // Solo permitir pago en 'plan' o 'sketch'
    if (!['plan', 'sketch'].includes(order.current_stage)) {
      return res.status(400).json({ message: 'Solo puedes pagar en la fase de planeación o boceto.' });
    }

    await updateOrderStatusModel(id, { is_paid: true, paid_at: new Date() });
    res.json({ message: 'Pago registrado exitosamente.' });
  } catch (error) {
    console.error('Error en payOrderController:', error);
    res.status(500).json({ message: 'Error al registrar el pago.' });
  }
};

export const uploadFinalArtController = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await getOrderById(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    // Solo el artista puede subir el arte final
    if (req.user.id !== order.artist_id) {
      return res.status(403).json({ message: 'No autorizado.' });
    }

    // ✅ CORRECCIÓN: Verificar que esté en fase 'completed' (Finalizado)
    if (order.current_stage !== 'completed') {
      return res.status(400).json({ message: 'Solo puedes subir arte final en la fase de Finalizado.' });
    }

    if (!order.is_paid) {
      return res.status(400).json({ message: 'El pedido debe estar pagado para subir la obra final.' });
    }

    // Verificar que haya archivo
    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ningún archivo.' });
    }

    const imagePath = req.file.path.replace(/\\/g, '/');
    console.log(`🎨 Subiendo obra final para pedido ${id}: ${imagePath}`);

    // SOLO GUARDAR LA IMAGEN - NO completar automáticamente
    await new Promise((resolve, reject) => {
      dbConnection.query(
        'UPDATE orders SET completed_image = ? WHERE id = ?',
        [imagePath, id],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    // Notificar al cliente que la obra final está lista
    await createNotification({
      user_id: order.client_id,
      type: 'final_art_uploaded',
      message: `¡La obra final de tu pedido #${id} está lista! El artista procederá a completar el pedido.`,
      link: `/orders/${id}`,
      order_id: id,
      is_read: false
    });

    console.log(`✅ Obra final subida para pedido ${id}`);
    console.log(`📧 Cliente ${order.client_id} notificado`);

    res.json({ 
      message: 'Obra final subida correctamente. Ahora puedes completar el pedido.',
      image_path: imagePath
    });

  } catch (error) {
    console.error('Error al subir obra final:', error);
    res.status(500).json({ message: 'Error al subir obra final.' });
  }
};

export const deleteSampleController = async (req, res) => {
  try {
    const { id } = req.params; // order id
    const { phase, image } = req.body; // image: ruta relativa
    const userId = req.user.id;

    if (!phase || !image) {
      return res.status(400).json({ message: 'Faltan datos obligatorios.' });
    }

    // Verifica que el usuario sea el artista del pedido
    const order = await getOrderById(id);
    if (!order || order.artist_id !== userId) {
      return res.status(403).json({ message: 'No autorizado.' });
    }

    // Elimina la referencia de la imagen en el campo correspondiente
    const phaseField = `${phase}_image`;
    let images = (order[phaseField] || '').split(',').filter(Boolean);
    images = images.filter(img => img !== image);
    const newImages = images.join(',');

    await new Promise((resolve, reject) => {
      dbConnection.query(
        `UPDATE orders SET ${phaseField} = ? WHERE id = ?`,
        [newImages, id],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    // Elimina el archivo físico si existe
    const filePath = path.join(process.cwd(), 'src', image);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: 'Muestra eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar muestra:', error);
    res.status(500).json({ message: 'Error al eliminar muestra.' });
  }
};

export const deleteFinalArtController = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await getOrderById(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    // Solo el artista puede eliminar la obra final
    if (req.user.id !== order.artist_id) {
      return res.status(403).json({ message: 'No autorizado.' });
    }

    // No permitir eliminar si el pedido ya está completado
    if (order.status === 'completed') {
      return res.status(400).json({ message: 'No puedes eliminar la obra final de un pedido completado.' });
    }

    // Verificar que tenga obra final
    if (!order.completed_image) {
      return res.status(400).json({ message: 'No hay obra final para eliminar.' });
    }

    console.log(`🗑️ Eliminando obra final para pedido ${id}: ${order.completed_image}`);

    // Eliminar la referencia en la base de datos
    await new Promise((resolve, reject) => {
      dbConnection.query(
        'UPDATE orders SET completed_image = NULL WHERE id = ?',
        [id],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    // Eliminar el archivo físico si existe
    const filePath = path.join(process.cwd(), order.completed_image);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`📁 Archivo físico eliminado: ${filePath}`);
    }

    console.log(`✅ Obra final eliminada para pedido ${id}`);

    res.json({ 
      message: 'Obra final eliminada correctamente.'
    });

  } catch (error) {
    console.error('Error al eliminar obra final:', error);
    res.status(500).json({ message: 'Error al eliminar obra final.' });
  }
};

// ✅ AGREGAR AL FINAL DEL ARCHIVO - Controlador para actualizar planeación

export const updateOrderPlanningController = async (req, res) => {
  console.log('🚀 === INICIO updateOrderPlanningController ===');
  
  try {
    const { id } = req.params;
    const { package_id, package_name, extras, total_price } = req.body;
    
    console.log('✅ 1. Datos recibidos:', {
      orderId: id,
      userId: req.user?.id,
      userRole: req.user?.role,
      body: req.body
    });
    
    console.log('✅ 2. Verificando funciones disponibles:', {
      getOrderById: typeof getOrderById,
      createNotification: typeof createNotification,
      dbConnection: !!dbConnection
    });
    
    console.log('✅ 3. Obteniendo pedido...');
    const order = await getOrderById(id);
    console.log('✅ 4. Pedido obtenido:', order ? 'OK' : 'NULL');
    
    if (!order) {
      console.log('❌ Pedido no encontrado:', id);
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    console.log('✅ 5. Validando permisos...');
    if (req.user.id !== order.artist_id) {
      console.log('❌ Usuario no autorizado:', {
        userId: req.user.id,
        artistId: order.artist_id
      });
      return res.status(403).json({ message: 'Solo el artista del pedido puede hacer cambios de planeación.' });
    }

    console.log('✅ 6. Validando fase...');
    if (order.current_stage !== 'plan') {
      console.log('❌ Fase incorrecta:', order.current_stage);
      return res.status(400).json({ 
        message: 'Solo se pueden hacer cambios en la fase de planeación.' 
      });
    }

    console.log('✅ 7. Validando pago...');
    if (order.is_paid) {
      console.log('❌ Pedido ya pagado');
      return res.status(400).json({ 
        message: 'No se pueden hacer cambios después del pago.' 
      });
    }

    console.log('✅ 8. Ejecutando UPDATE en BD...');
    await new Promise((resolve, reject) => {
      dbConnection.query(
        'UPDATE orders SET package_id = ?, extras = ?, total_price = ? WHERE id = ?',
        [package_id, extras, total_price, id], // ✅ QUITAR package_name
        (err, result) => {
          if (err) {
            console.error('❌ Error en query UPDATE:', err);
            return reject(err);
          }
          console.log('✅ Query UPDATE exitosa:', result);
          resolve(result);
        }
      );
    });

    console.log('✅ 9. Enviando notificación...');
    try {
      await createNotification({
        user_id: order.client_id,
        type: 'planning_updated',
        message: `El artista ha actualizado los detalles de tu pedido #${id}.`,
        link: `/orders/${id}`,
        order_id: id,
        is_read: false
      });
      console.log('✅ 10. Notificación enviada');
    } catch (notifError) {
      console.error('⚠️ Error en notificación (no crítico):', notifError);
    }

    console.log('✅ 11. Enviando respuesta exitosa...');
    res.json({ 
      success: true,
      message: 'Detalles de planeación actualizados correctamente.',
      updated_fields: { package_id, extras, total_price } // ✅ QUITAR package_name
    });

    console.log('🎉 === FIN updateOrderPlanningController EXITOSO ===');

  } catch (error) {
    console.error('💥 === ERROR CRÍTICO en updateOrderPlanningController ===');
    console.error('❌ Error:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Mensaje:', error.message);
    
    res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor al actualizar la planeación.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};