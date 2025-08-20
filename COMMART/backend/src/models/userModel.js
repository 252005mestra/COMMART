import dbConnection from '../config/db.js';
import bcrypt from 'bcrypt';

// Registro de usuario
export const createUserModel = (username, email, hashedPassword) => {
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
export const findUserByEmailModel = (email) => {
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
export const findUserByUsernameModel = (username) => {
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
export const findUserByIdModel = (id, includePassword = false) => {
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
export const getAllUsersModel = () => {
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
export const updateUserModel = (id, updateData) => {
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
export const isUsernameAvailableModel = (username, excludeUserId = null) => {
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
export const deleteUserFromDBModel = (id) => {
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
export const getArtistsBasicInfoModel = (styleId = null) => {
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

// Obtener perfil completo de artista por ID de usuario
export const getArtistFullProfileModel = (userId) => {
  return new Promise((resolve, reject) => {
    // Traer datos de usuario y perfil de artista
    const query = `
      SELECT 
        u.id, u.username, u.profile_image, u.email,
        ap.bio, ap.availability, ap.price_policy,
        (SELECT COUNT(*) FROM artist_followers WHERE artist_id = u.id) AS followers,
        (SELECT COUNT(*) FROM artist_followers WHERE follower_id = u.id) AS following,
        (SELECT COUNT(*) FROM orders WHERE artist_id = u.id) AS sales,
        (SELECT COUNT(*) FROM orders WHERE client_id = u.id) AS purchases,
        (SELECT COUNT(*) FROM favorites WHERE artist_id = u.id) AS favorites,
        (SELECT COUNT(*) FROM reviews WHERE artist_id = u.id) AS reviews,
        (SELECT AVG(rating) FROM reviews WHERE artist_id = u.id) AS rating
      FROM users u
      LEFT JOIN artist_profiles ap ON u.id = ap.user_id
      WHERE u.id = ?
    `;
    dbConnection.query(query, [userId], async (err, results) => {
      if (err) return reject(err);
      if (!results[0]) return resolve(null);
      const artist = results[0];

      // Traer estilos
      dbConnection.query(
        `SELECT s.id, s.name FROM artist_styles ast
         JOIN styles s ON ast.style_id = s.id
         WHERE ast.artist_id = ?`,
        [userId],
        (err, styleRows) => {
          if (err) return reject(err);

          // Traer idiomas
          dbConnection.query(
            `SELECT l.id, l.name FROM artist_languages al
             JOIN languages l ON al.language_id = l.id
             WHERE al.artist_id = ?`,
            [userId],
            (err, langRows) => {
              if (err) return reject(err);

              // Traer portafolio
              dbConnection.query(
                `SELECT id, image_path FROM portfolios WHERE artist_id = ? ORDER BY created_at DESC LIMIT 6`,
                [userId],
                (err, portfolioRows) => {
                  if (err) return reject(err);

                  resolve({
                    ...artist,
                    styles: styleRows.map(s => s.name),
                    style_ids: styleRows.map(s => s.id),
                    languages: langRows.map(l => l.name),
                    language_ids: langRows.map(l => l.id),
                    portfolio: portfolioRows
                  });
                }
              );
            }
          );
        }
      );
    });
  });
};

// Obtener todos los estilos
export const getAllStylesModel = () => {
  return new Promise((resolve, reject) => {
    dbConnection.query('SELECT * FROM styles ORDER BY name', (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Obtener todos los idiomas
export const getAllLanguagesModel = () => {
  return new Promise((resolve, reject) => {
    dbConnection.query('SELECT * FROM languages ORDER BY name', (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// Encontrar usuario por correo electrónico de recuperación
export const findUserByRecoveryEmailModel = (recovery_email) => {
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
export const setResetTokenModel = (userId, token, expiry) => {
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
export const findUserByResetTokenModel = (token) => {
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
export const updatePasswordAndClearTokenModel = (userId, hashedPassword) => {
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

// Portafolio
export const getArtistPortfolioModel = (artistId) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT image_path FROM portfolios WHERE artist_id = ? ORDER BY created_at DESC',
      [artistId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

// Estilos
export const getArtistStylesModel = (artistId) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `SELECT s.name FROM artist_styles ast
       JOIN styles s ON ast.style_id = s.id
       WHERE ast.artist_id = ?`,
      [artistId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results.map(r => r.name));
      }
    );
  });
};

// Idiomas
export const getArtistLanguagesModel = (artistId) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      `SELECT l.name FROM artist_languages al
       JOIN languages l ON al.language_id = l.id
       WHERE al.artist_id = ?`,
      [artistId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results.map(r => r.name));
      }
    );
  });
};

// Seguidores
export const getArtistFollowersCountModel = (artistId) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT COUNT(*) as count FROM artist_followers WHERE artist_id = ?',
      [artistId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0].count);
      }
    );
  });
};

// Seguidos
export const getArtistFollowingCountModel = (artistId) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT COUNT(*) as count FROM artist_followers WHERE follower_id = ?',
      [artistId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0].count);
      }
    );
  });
};

// Ventas (pedidos recibidos)
export const getArtistSalesCountModel = (artistId) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT COUNT(*) as count FROM orders WHERE artist_id = ?',
      [artistId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0].count);
      }
    );
  });
};

// Compras (pedidos hechos)
export const getArtistPurchasesCountModel = (artistId) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT COUNT(*) as count FROM orders WHERE client_id = ?',
      [artistId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0].count);
      }
    );
  });
};

// Favoritos
export const getArtistFavoritesCountModel = (artistId) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT COUNT(*) as count FROM favorites WHERE artist_id = ?',
      [artistId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0].count);
      }
    );
  });
};

// Reseñas
export const getArtistReviewsCountModel = (artistId) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT COUNT(*) as count FROM reviews WHERE artist_id = ?',
      [artistId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0].count);
      }
    );
  });
};

// Calificación promedio
export const getArtistRatingModel = (artistId) => {
  return new Promise((resolve, reject) => {
    dbConnection.query(
      'SELECT AVG(rating) as avg FROM reviews WHERE artist_id = ?',
      [artistId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0].avg ? parseFloat(results[0].avg).toFixed(1) : 0);
      }
    );
  });
};

// Actualizar perfil de artista
export const updateArtistProfileModel = async ({
  userId,
  bio,
  availability,
  price_policy,
  styles,
  languages,
  portfolioImages
}) => {
  // Actualizar tabla artist_profiles
  await new Promise((resolve, reject) => {
    dbConnection.query(
      `
      INSERT INTO artist_profiles (user_id, bio, availability, price_policy)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE bio = VALUES(bio), availability = VALUES(availability), price_policy = VALUES(price_policy)
      `,
      [userId, bio, availability, price_policy],
      (err) => (err ? reject(err) : resolve())
    );
  });

  // Actualizar estilos
  await new Promise((resolve, reject) => {
    dbConnection.query('DELETE FROM artist_styles WHERE artist_id = ?', [userId], async (err) => {
      if (err) return reject(err);
      if (Array.isArray(styles) && styles.length > 0) {
        try {
          for (const styleName of styles) {
            await new Promise((res, rej) => {
              dbConnection.query(
                `INSERT INTO artist_styles (artist_id, style_id)
                 SELECT ?, id FROM styles WHERE name = ?`,
                [userId, styleName],
                (err) => (err ? rej(err) : res())
              );
            });
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      } else {
        resolve();
      }
    });
  });

  // Actualizar idiomas
  await new Promise((resolve, reject) => {
    dbConnection.query('DELETE FROM artist_languages WHERE artist_id = ?', [userId], async (err) => {
      if (err) return reject(err);
      if (Array.isArray(languages) && languages.length > 0) {
        try {
          for (const langName of languages) {
            await new Promise((res, rej) => {
              dbConnection.query(
                `INSERT INTO artist_languages (artist_id, language_id)
                 SELECT ?, id FROM languages WHERE name = ?`,
                [userId, langName],
                (err) => (err ? rej(err) : res())
              );
            });
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      } else {
        resolve();
      }
    });
  });

  // Guardar imágenes nuevas en portfolios
  if (portfolioImages && portfolioImages.length > 0) {
    const values = portfolioImages.map(img => [userId, `uploads/${img.filename}`]);
    await new Promise((resolve, reject) => {
      dbConnection.query(
        'INSERT INTO portfolios (artist_id, image_path) VALUES ?',
        [values],
        (err) => (err ? reject(err) : resolve())
      );
    });
  }
};
