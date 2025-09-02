import dbConnection from '../config/db.js';

// Crear notificación
export const createNotification = ({ user_id, type, message, link, order_id, is_read }) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `INSERT INTO notifications (user_id, type, message, link, order_id, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [user_id, type, message, link, order_id || null, is_read ? 1 : 0],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

// Obtener notificaciones de un usuario (siempre incluye order_id)
export const getUserNotifications = (user_id) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `SELECT id, user_id, type, message, link, order_id, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
      [user_id],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

// Marcar notificación como leída
export const markNotificationAsRead = (id, user_id) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [id, user_id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};