import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; 
import { createUser, findUserByEmail, findUserByUsername, getAllUsers as getAllUsersFromModel } from '../models/userModel.js';

// Validación registro de usuario
export const registerUser = async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Validar que todos los campos esten completos
    if (!username || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Las contraseñas no coinciden.' });
    }

    try {
        // Validar que el correo electrónico no esté registrado
        const existingEmail = await findUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: 'El correo ya está registrado.' });
        }
        
        // Validar que el nombre de usuario no esté registrado
        const existingUsername = await findUserByUsername(username);
        if (existingUsername) {
          return res.status(400).json({ message: 'El nombre de usuario ya está en uso.' });
        }
        
        // Encriptación de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        await createUser(username, email, hashedPassword);
    
        res.status(201).json({ message: 'Usuario registrado exitosamente.' });
    } catch (error) {
        console.error('Error al registrar:', error);
        res.status(500).json({ message: 'Error del servidor al registrar el usuario.' });
    }
};

// Inicio de sesión con correo o nombre de usuario
export const loginUser = async (req, res) => {
    const { identifier, password } = req.body;

    // Validación de campos
    if (!identifier || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        // Buscar por email primero
        let user = await findUserByEmail(identifier);

        // Si no encuentra por email, buscar por username
        if (!user) {
            user = await findUserByUsername(identifier);
        }

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Contraseña incorrecta.' });
        }

        // Generar token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' } // Token dura 1 hora
        );

        // Enviar el token en una cookie, no en el body
        res.cookie('token', token, {
            httpOnly: true, // solo accesible por el servidor
            secure: process.env.NODE_ENV === 'production', // en producción solo por HTTPS
            sameSite: 'strict', // prevenir ataques CSRF
            maxAge: 60 * 60 * 1000 // 1 hora en milisegundos
        });

        res.status(200).json({ message: 'Inicio de sesión exitoso' });
        
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error del servidor al iniciar sesión.' });
    }
};

// Obtener todos los usuarios registrados (solo nombres de usuario)
export const getAllUsers = async (req, res) => {
  try {
      const users = await getAllUsersFromModel(); // cambiar nombre para evitar conflicto
      res.status(200).json(users);
  } catch (error) {
      console.error('Error al obtener los usuarios:', error);
      res.status(500).json({ message: 'Error del servidor al obtener los usuarios.' });
  }
};

// Cerrar sesión (Logout)
export const logoutUser = (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.status(200).json({ message: 'Sesión cerrada correctamente.' });
};
