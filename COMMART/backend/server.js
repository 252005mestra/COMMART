import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes.js';
import orderRoutes from './src/routes/orderRoutes.js';
import packageRoutes from './src/routes/packageRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js'; // ✅ AGREGAR
import dbConnection from './src/config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();
const app = express();

app.use(cors({
    origin: 'http://localhost:5173', // frontend
    credentials: true               // permitir cookies cross-origin
}));

app.use(express.json());
app.use(cookieParser());

// Rutas
app.use('/api/auth', authRoutes); // localhost:5000/api/auth/register
app.use('/api/orders', orderRoutes);
app.use('/api/packages', packageRoutes); // ✅ AGREGAR ESTA LÍNEA
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes); // ✅ AGREGAR

// Obtener el nombre y directorio del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Servir archivos estáticos de la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'src', 'uploads')));
app.use('/src/uploads', express.static(path.join(__dirname, 'src', 'uploads')));

// Conexión a la base de datos
dbConnection.connect(error => {
    if (error) return console.error(error);
    console.log('Conectado a la base de datos');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
