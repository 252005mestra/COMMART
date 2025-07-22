import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './src/routes/authRoutes.js';
import db from './src/config/db.js'
import path from 'path';

dotenv.config();
const app = express();

app.use(cors({
    origin: 'http://localhost:5173', // frontend
    credentials: true               // permitir cookies cross-origin
  }));
  
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes); // localhost:5000/api/auth/register

// Servir archivos estáticos de la carpeta uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'src', 'uploads')));

db.connect(err => {
    if (err) return console.error(err);
    console.log('Connected to database');
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`)
});
