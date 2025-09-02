import dbConnection from '../config/db.js';

// Crear un pedido
export const createOrder = (orderData) => {
  return new Promise((resolve, reject) => {
    const {
      client_id, artist_id, package_id, description, references_image,
      extras, status, total_price
    } = orderData;
    dbConnection.query(
      `INSERT INTO orders (client_id, artist_id, package_id, description, references_image, extras, status, total_price, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        client_id,
        artist_id,
        package_id,
        description,
        references_image,
        extras,
        status,
        total_price
      ],
      (err, result) => {
        if (err) return reject(err);
        resolve({ id: result.insertId, ...orderData });
      }
    );
  });
};

// Obtener pedidos de un artista
export const getOrdersByArtist = (artistId) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `SELECT id, client_id, artist_id, package_id, description, references_image, extras, status, total_price, created_at, rejection_reason
       FROM orders WHERE artist_id = ? ORDER BY created_at DESC`,
      [artistId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

// Obtener pedidos de un cliente
export const getOrdersByClient = (clientId) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `SELECT id, client_id, artist_id, package_id, description, references_image, extras, status, total_price, created_at, rejection_reason
       FROM orders WHERE client_id = ? ORDER BY created_at DESC`,
      [clientId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

// Obtener detalles de un pedido
export const getOrderById = (id) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT * FROM orders WHERE id = ?',
      [id],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      }
    );
  });
};

// Cambiar estado de un pedido
export const updateOrderStatus = (orderId, status, reason = null) => {
  return new Promise((resolve, reject) => {
    let query = 'UPDATE orders SET status = ?';
    const params = [status];
    if (status === 'rejected') {
      query += ', rejection_reason = ?';
      params.push(reason);
    }
    query += ' WHERE id = ?';
    params.push(orderId);
    dbConnection.query(query, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

export const updateOrderFields = (orderId, fields) => {
  return new Promise((resolve, reject) => {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    dbConnection.query(
      `UPDATE orders SET ${setClause} WHERE id = ?`,
      [...values, orderId],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

export const updateOrderStatusModel = (orderId, updateData) => {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    if (fields.length === 0) return reject(new Error('No hay campos para actualizar.'));
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    values.push(orderId);
    dbConnection.query(
      `UPDATE orders SET ${setClause} WHERE id = ?`,
      values,
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};