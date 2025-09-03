import dbConnection from '../config/db.js';

// ========== PAQUETES ==========

// Obtener paquetes del artista
export const getPackagesByArtist = (artistId) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT * FROM packages WHERE artist_id = ? ORDER BY id ASC LIMIT 3',
      [artistId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

// Crear paquete
export const createPackage = (data) => {
  const { artist_id, title, description, price, reference_image1, reference_image2, delivery_time_days } = data;
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `INSERT INTO packages (artist_id, title, description, price, reference_image1, reference_image2, delivery_time_days)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [artist_id, title, description, price, reference_image1, reference_image2, delivery_time_days],
      (err, result) => {
        if (err) return reject(err);
        resolve({ id: result.insertId, ...data });
      }
    );
  });
};

// Actualizar paquete
export const updatePackage = (id, data) => {
  const fields = [];
  const values = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  values.push(id);
  
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `UPDATE packages SET ${fields.join(', ')} WHERE id = ?`,
      values,
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

// Eliminar paquete
export const deletePackage = (id, artistId) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'DELETE FROM packages WHERE id = ? AND artist_id = ?',
      [id, artistId],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

// ========== EXTRAS ==========

// Obtener extras del artista
export const getExtrasByArtist = (artistId) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `SELECT e.* FROM extras e
       JOIN packages p ON e.package_id = p.id
       WHERE p.artist_id = ?
       ORDER BY e.id ASC LIMIT 6`,
      [artistId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

// Crear extra
export const createExtra = (data) => {
  const { package_id, name, price } = data;
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `INSERT INTO extras (package_id, name, price) VALUES (?, ?, ?)`,
      [package_id, name, price],
      (err, result) => {
        if (err) return reject(err);
        resolve({ id: result.insertId, ...data });
      }
    );
  });
};

// Actualizar extra
export const updateExtra = (id, data) => {
  const fields = [];
  const values = [];
  
  Object.entries(data).forEach(([key, value]) => {
    if (key !== 'id' && value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });
  
  values.push(id);
  
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `UPDATE extras SET ${fields.join(', ')} WHERE id = ?`,
      values,
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

// Eliminar extra
export const deleteExtra = (id) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'DELETE FROM extras WHERE id = ?',
      [id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};