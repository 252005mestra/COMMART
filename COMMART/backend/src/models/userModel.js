import connection from '../config/db.js';

// Registro de Usuario
export const createUser = (username, email, hashedPassword) => {
  return new Promise((resolve, reject) => {
    connection.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword], (err, result) => { 
        if (err) return reject(err); 
        resolve(result); 
    });
  })
};

// Encontrar el usuario por correo electrónico
export const findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]); 
    });
  });
};

// Encontrar el usuario por nombre de usuario
export const findUserByUsername = (username) => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
      if (err) return reject(err);
      resolve(results[0]);
    });
  });
};

// Obtener todos los usuarios (solo sus nombres de usuario)
export const getAllUsers = () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT username FROM users', (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};