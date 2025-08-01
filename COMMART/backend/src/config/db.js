import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la conexión a la base de datos
const dbConnection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Verificar errores al establecer la conexión a la base de datos
dbConnection.connect(err => {
  if (err) {
    console.error('Error al conectar a la base de datos', err);
    return;
  }
  console.log('Conectado a la base de datos');
});

export default dbConnection;