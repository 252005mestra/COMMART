import dbConnection from '../config/db.js';

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

// Encontrar el usuario por correo electrónico
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

// Encontrar el usuario por nombre de usuario
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

// Obtener todos los usuarios (solo sus nombres de usuario)
export const getAllUsers = () => {
  return new Promise((resolve, reject) => {
    dbConnection.query('SELECT username FROM users', (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Obtener usuario por ID
export const findUserById = (id) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT id, username, email FROM users WHERE id = ?',
      [id],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      }
    );
  });
};

// Actualizar usuario (por ID)
export const updateUserInDB = (id, username, email, hashedPassword) => {
  return new Promise((resolve, reject) => {
    const query = hashedPassword
      ? 'UPDATE users SET username = ?, email = ?, password = ? WHERE id = ?'
      : 'UPDATE users SET username = ?, email = ? WHERE id = ?';
    const params = hashedPassword
      ? [username, email, hashedPassword, id]
      : [username, email, id];

    dbConnection.query(query, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
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