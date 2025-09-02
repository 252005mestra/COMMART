import dbConnection from '../config/db.js';

export const addMessage = ({ order_id, phase, sender_id, message }) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `INSERT INTO order_messages (order_id, phase, sender_id, message, created_at) VALUES (?, ?, ?, ?, NOW())`,
      [order_id, phase, sender_id, message],
      (err, result) => {
        if (err) return reject(err);
        resolve({ id: result.insertId });
      }
    );
  });
};

export const getMessagesByOrderAndPhase = (order_id, phase) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `SELECT m.*, u.username as sender_username
       FROM order_messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.order_id = ? AND m.phase = ?
       ORDER BY m.created_at ASC`,
      [order_id, phase],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};