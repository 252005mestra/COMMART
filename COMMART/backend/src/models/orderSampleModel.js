import dbConnection from '../config/db.js';

export const addSample = ({ order_id, phase, image_path, uploaded_by }) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `INSERT INTO order_samples (order_id, phase, image_path, uploaded_by) VALUES (?, ?, ?, ?)`,
      [order_id, phase, image_path, uploaded_by],
      (err, result) => {
        if (err) return reject(err);
        resolve({ id: result.insertId });
      }
    );
  });
};

export const getSamplesByOrderAndPhase = (order_id, phase) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `SELECT * FROM order_samples WHERE order_id = ? AND phase = ? ORDER BY created_at ASC`,
      [order_id, phase],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};