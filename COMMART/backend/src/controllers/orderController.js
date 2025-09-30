import {
  createOrder,
  getOrdersByArtist,
  getOrdersByClient,
  getOrderById,
  updateOrderStatus,
  updateOrderFields
} from '../models/orderModel.js';
import { findUserByIdModel } from '../models/userModel.js';
import { createNotification } from '../models/notificationModel.js';
import dbConnection from '../config/db.js'; // <-- AÑADIR ESTA LÍNEA

// Crear pedido
export const createOrderController = async (req, res) => {
  try {
    const client_id = req.user.id;
    const { artist_id, description, package_id, total_price, extras } = req.body;

    if (!artist_id || !description || !package_id || !total_price) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    let references_image = null;
    if (req.files && req.files.length > 0) {
      references_image = req.files.map(f => f.path.replace(/\\/g, '/')).join(',');
    }

    // Procesar extras si existen
    let extrasString = null;
    if (extras) {
      try {
        const extrasArray = JSON.parse(extras);
        extrasString = extrasArray.join(','); // Guardar IDs separados por comas
      } catch (e) {
        extrasString = extras; // Si ya es string, usarlo directamente
      }
    }

    const order = await createOrder({
      client_id,
      artist_id,
      package_id,
      description,
      references_image,
      extras: extrasString,
      status: 'pending',
      total_price
    });

    // Crear notificación para el artista
    await createNotification({
      user_id: artist_id,
      type: 'order',
      message: `Tienes una nueva solicitud de pedido.`,
      link: `/artist/orders`,
      order_id: order.id,
      is_read: false
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ message: 'Error del servidor al crear el pedido.' });
  }
};

// Pedidos del artista autenticado
export const getArtistOrdersController = async (req, res) => {
  try {
    const artistId = req.user.id;
    const orders = await getOrdersByArtist(artistId);
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error al obtener pedidos del artista:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Pedidos del cliente autenticado
export const getClientOrdersController = async (req, res) => {
  try {
    const clientId = req.user.id;
    const orders = await getOrdersByClient(clientId);
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error al obtener pedidos del cliente:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Detalles de un pedido
export const getOrderDetailsController = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await getOrderById(orderId);
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado.' });

    // Solo el artista o el cliente pueden ver el pedido
    if (order.artist_id !== req.user.id && order.client_id !== req.user.id) {
      return res.status(403).json({ message: 'No autorizado.' });
    }

    // Obtener datos completos del cliente y artista
    const clientUser = await findUserByIdModel(order.client_id);
    const artistUser = await findUserByIdModel(order.artist_id);

    res.json({
      ...order,
      clientUser,
      artistUser,
      current_stage: order.current_stage // o order.phase, según el nombre real
    });
  } catch (error) {
    console.error('Error al obtener detalles del pedido:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Cambiar estado del pedido
export const updateOrderStatusController = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    // PRIMERO obtener los datos del pedido
    const order = await getOrderById(id);
    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado.' });
    }

    await updateOrderStatus(id, status, reason);

    // Notificar al cliente si es rechazado
    if (status === 'rejected') {
      await createNotification({
        user_id: order.client_id,
        type: 'order_rejected',
        message: `Tu pedido #${id} fue rechazado por el artista.`,
        link: `/orders/${id}`,
        order_id: id,
        is_read: false
      });
      console.log(`📧 Cliente ${order.client_id} notificado de rechazo del pedido ${id}`);
    }

    // Notificar al cliente si es aceptado
    if (status === 'in_progress') {
      await createNotification({
        user_id: order.client_id,
        type: 'order_accepted',
        message: `¡Tu pedido #${id} fue aceptado por el artista!`,
        link: `/orders/${id}`,
        order_id: id,
        is_read: false
      });
      console.log(`📧 Cliente ${order.client_id} notificado de aceptación del pedido ${id}`);
    }

    // Notificar al cliente y artista si el pedido es completado
    if (status === 'completed') {
      // Notificar al cliente
      await createNotification({
        user_id: order.client_id,
        type: 'order_completed',
        message: `🎉 ¡Tu pedido #${id} ha sido completado! Ya puedes descargar tu obra final.`,
        link: `/orders/${id}`,
        order_id: id,
        is_read: false
      });

      // Notificar al artista
      await createNotification({
        user_id: order.artist_id,
        type: 'order_completed',
        message: `✅ Has completado exitosamente el pedido #${id}.`,
        link: `/orders/${id}`,
        order_id: id,
        is_read: false
      });

      // Actualizar timestamp de completado
      await new Promise((resolve, reject) => {
        dbConnection.query(
          'UPDATE orders SET completed_at = NOW() WHERE id = ?',
          [id],
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
      });

      console.log(`✅ Pedido ${id} completado exitosamente`);
      console.log(`📧 Notificaciones enviadas a cliente ${order.client_id} y artista ${order.artist_id}`);
    }

    res.json({ message: 'Estado actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar estado del pedido:', error);
    res.status(500).json({ message: 'Error al actualizar el estado del pedido.' });
  }
};

