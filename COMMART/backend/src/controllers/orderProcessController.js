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
    await updateOrderFields(id, { current_stage: next_phase });
    // Notificar a ambos usuarios
    // (Obtén order para saber client_id y artist_id)
    // Suponiendo que tienes un modelo getOrderById
    const order = await getOrderById(id);
    await createNotification({
      user_id: order.client_id,
      type: 'order',
      message: `Tu pedido avanzó a la fase: ${next_phase}`,
      link: `/orders/${id}`,
      is_read: false
    });
    await createNotification({
      user_id: order.artist_id,
      type: 'order',
      message: `El pedido avanzó a la fase: ${next_phase}`,
      link: `/orders/${id}`,
      is_read: false
    });
    res.json({ message: 'Fase actualizada.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al avanzar de fase.' });
  }
};

// Subir muestra
export const uploadSampleController = async (req, res) => {
  try {
    const { id } = req.params;
    const { phase } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: 'No se subió ninguna imagen.' });

    // Determina el campo a actualizar según la fase
    const phaseField = `${phase}_image`;
    const imagePath = file.path.replace(/\\/g, '/');

    // Actualiza el campo correspondiente en la base de datos
    await dbConnection.promise().query(
      `UPDATE orders SET ${phaseField} = IF(${phaseField} IS NULL OR ${phaseField} = '', ?, CONCAT(${phaseField}, ',', ?)) WHERE id = ?`,
      [imagePath, imagePath, id]
    );

    res.status(200).json({ message: 'Muestra subida correctamente.' });
  } catch (error) {
    console.error('Error al subir muestra:', error);
    res.status(500).json({ message: 'Error al subir muestra.' });
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
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado.' });

    // Solo el artista puede subir el arte final
    if (req.user.id !== order.artist_id) {
      return res.status(403).json({ message: 'No autorizado.' });
    }

    // Verifica que haya archivo
    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ningún archivo.' });
    }

    // Guarda la ruta en completed_image
    await updateOrderStatusModel(id, { completed_image: `uploads/${req.file.filename}` });
    res.json({ message: 'Arte final subido.' });
  } catch (error) {
    console.error('Error al subir arte final:', error);
    res.status(500).json({ message: 'Error al subir arte final.' });
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