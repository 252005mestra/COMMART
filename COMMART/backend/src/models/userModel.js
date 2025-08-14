import dbConnection from '../config/db.js';
import bcrypt from 'bcrypt';

// Registro de usuario
export const createUser = (username, email, hashedPassword) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

// Encontrar usuario por correo electrónico
export const findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      }
    );
  });
};

// Encontrar usuario por nombre de usuario
export const findUserByUsername = (username) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT * FROM users WHERE username = ?',
      [username],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      }
    );
  });
};

// Encontrar usuario por ID (con opción de incluir datos completos)
export const findUserById = (id, includePassword = false) => {
  return new Promise((resolve, reject) => {
    const fields = includePassword 
      ? 'id, username, email, recovery_email, profile_image, registered_at, is_artist, role, password'
      : 'id, username, email, recovery_email, profile_image, registered_at, is_artist, role';
    
    dbConnection.query(
      `SELECT ${fields} FROM users WHERE id = ?`,
      [id],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      }
    );
  });
};

// Obtener todos los usuarios (datos completos para admin)
export const getAllUsers = () => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT id, username, email, registered_at, is_artist, role FROM users ORDER BY registered_at DESC',
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

// Actualizar usuario (unificado para admin y perfil)
export const updateUser = (id, updateData) => {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);
    
    if (fields.length === 0) {
      return reject(new Error('No se proporcionaron campos para actualizar.'));
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    values.push(id);
    
    const query = `UPDATE users SET ${setClause} WHERE id = ?`;
    
    dbConnection.query(query, values, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

// Verificar si un nombre de usuario está disponible (excluyendo un ID específico)
export const isUsernameAvailable = (username, excludeUserId = null) => {
  return new Promise((resolve, reject) => {
    let query = 'SELECT id FROM users WHERE username = ?';
    let params = [username];
    
    if (excludeUserId) {
      query += ' AND id != ?';
      params.push(excludeUserId);
    }
    
    dbConnection.query(query, params, (err, results) => {
      if (err) return reject(err);
      resolve(results.length === 0); // true si está disponible
    });
  });
};

// Eliminar usuario (por ID)
export const deleteUserFromDB = (id) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'DELETE FROM users WHERE id = ?',
      [id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

// Obtener información completa de los artistas (incluyendo estilos)
export const getArtistsBasicInfo = (styleId = null) => {
  return new Promise((resolve, reject) => {
    let query = `
      SELECT 
        u.id,
        u.username,
        u.profile_image,
        ap.bio as description,
        (SELECT COUNT(*) FROM artist_followers WHERE artist_id = u.id) AS followers,
        (SELECT image_path FROM portfolios WHERE artist_id = u.id ORDER BY created_at DESC LIMIT 1) AS portfolio_image,
        GROUP_CONCAT(s.name SEPARATOR ', ') AS styles,
        GROUP_CONCAT(s.id SEPARATOR ',') AS style_ids
      FROM users u
      LEFT JOIN artist_profiles ap ON u.id = ap.user_id
      LEFT JOIN artist_styles ast ON u.id = ast.artist_id
      LEFT JOIN styles s ON ast.style_id = s.id
      WHERE u.role = 'artist'
    `;
    
    const params = [];
    
    // Si se especifica un estilo, filtrar por él
    if (styleId) {
      query += ` AND u.id IN (
        SELECT DISTINCT artist_id 
        FROM artist_styles 
        WHERE style_id = ?
      )`;
      params.push(styleId);
    }
    
    query += `
      GROUP BY u.id, u.username, u.profile_image, ap.bio
      ORDER BY u.id DESC
    `;
    
    dbConnection.query(query, params, (err, results) => {
      if (err) return reject(err);
      
      // Procesar los resultados para convertir los estilos en arrays
      const processedResults = results.map(artist => ({
        ...artist,
        styles: artist.styles ? artist.styles.split(', ') : [],
        style_ids: artist.style_ids ? artist.style_ids.split(',').map(id => parseInt(id)) : []
      }));
      
      resolve(processedResults);
    });
  });
};

// Obtener todos los estilos
export const getAllStyles = () => {
  return new Promise((resolve, reject) => {
    dbConnection.query('SELECT * FROM styles ORDER BY name', (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Obtener artistas públicos para la landing
export const getPublicArtists = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        u.id,
        u.username,
        u.profile_image,
        (SELECT COUNT(*) FROM artist_followers WHERE artist_id = u.id) AS followers,
        (SELECT image_path FROM portfolios WHERE artist_id = u.id ORDER BY created_at DESC LIMIT 1) AS portfolio_image
      FROM users u
      WHERE u.is_artist = TRUE AND u.role = 'artist'
      ORDER BY u.id DESC
      LIMIT 20
    `;
    
    dbConnection.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Encontrar usuario por correo electrónico de recuperación
export const findUserByRecoveryEmail = (recovery_email) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT * FROM users WHERE recovery_email = ?',
      [recovery_email],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      }
    );
  });
};

// Establecer token de restablecimiento
export const setResetToken = (userId, token, expiry) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [token, expiry, userId],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};

// Buscar usuario por token de recuperación
export const findUserByResetToken = (token) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT * FROM users WHERE reset_token = ?',
      [token],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      }
    );
  });
};

// Actualizar contraseña y limpiar token
export const updatePasswordAndClearToken = (userId, hashedPassword) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, userId],
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
  });
};
