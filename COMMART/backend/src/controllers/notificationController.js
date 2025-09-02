import {
  createNotification,
  getUserNotifications,
  markNotificationAsRead
} from '../models/notificationModel.js';

// Crear notificación (puedes usarlo desde otros controladores)
export const createNotificationController = async (req, res) => {
  try {
    const { user_id, type, message, link, order_id } = req.body;
    await createNotification({
      user_id,
      type,
      message,
      link: link || null,
      order_id: order_id || null,
      is_read: false
    });
    res.status(201).json({ message: 'Notificación creada.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear notificación.' });
  }
};

// Cuando creas la notificación para el artista
export const createOrderNotificationForArtist = async (artistId, newOrderId) => {
  try {
    await createNotification({
      user_id: artistId, // el artista que recibe el pedido
      type: 'new_order',
      message: 'Has recibido un nuevo pedido.',
      link: '/artist/orders',
      order_id: newOrderId, // Asegúrate de pasar el id del pedido aquí
      is_read: false
    });
  } catch (error) {
    console.error('Error al crear notificación para el artista:', error);
  }
};

// Obtener notificaciones del usuario autenticado (siempre incluye order_id)
export const getUserNotificationsController = async (req, res) => {
  try {
    const user_id = req.user.id;
    const notifications = await getUserNotifications(user_id);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener notificaciones.' });
  }
};

// Marcar notificación como leída
export const markNotificationAsReadController = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    await markNotificationAsRead(notificationId, userId);
    res.status(200).json({ message: 'Notificación marcada como leída.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al marcar notificación como leída.' });
  }
};