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