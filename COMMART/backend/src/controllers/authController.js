import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; 
import dbConnection from '../config/db.js';
import { 
    createUser, 
    findUserByEmail, 
    findUserByUsername, 
    getAllUsers as getAllUsersFromModel, 
    updateUserInDB,
    deleteUserFromDB,
    findUserById,
    getArtistsBasicInfo
} from '../models/userModel.js';

// Función para detectar caracteres peligrosos
const containsXSSChars = (input) => /[<>"'&/]/.test(input);

// Función para escapar caracteres XSS (para campos visuales)
const sanitizeInput = (input) => input.replace(/[<>&"'\/]/g, (char) => {
    const map = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    };
    return map[char];
});

// Regex para validar formato de email
const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

// Regex para validar contraseña fuerte
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

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

    // Validar caracteres peligrosos en username y password
    if (containsXSSChars(username) || containsXSSChars(password)) {
        return res.status(400).json({ message: 'El nombre de usuario y la contraseña no pueden contener caracteres peligrosos como < > " \' / &' });
    }

    // Validar formato de correo
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Formato de correo inválido.' });
    }

    // Validar que no haya espacios en blanco en username y password
    if (/\s/.test(username) || /\s/.test(password)) {
        return res.status(400).json({ message: 'El nombre de usuario y la contraseña no pueden contener espacios.' });
    }

    // Validar que la contraseña sea fuerte
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial.'
        });
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

        // Si no encuentra el usuario por ninguno de los dos, retornar error
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
            { expiresIn: '1h' }
        );

        // Enviar el token en una cookie, no en el body
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000
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
        const users = await getAllUsersFromModel();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ message: 'Error del servidor al obtener los usuarios.' });
    }
};

// Obtener un usuario por ID
export const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await findUserById(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json({
            id: user.id,
            username: user.username,
            email: user.email
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ message: 'Error del servidor al obtener el usuario.' });
    }
};

// Actualizar Usuario (por ID)
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email, password } = req.body;

    // Validar que todos los campos necesarios estén presentes
    if (!username || !email) {
        return res.status(400).json({ message: 'El nombre de usuario y correo son obligatorios.' });
    }

    // Validar caracteres peligrosos
    if (containsXSSChars(username)) {
        return res.status(400).json({ message: 'El nombre de usuario contiene caracteres peligrosos.' });
    }

    // Validar formato de correo
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Formato de correo inválido.' });
    }

    // Validar que no haya espacios en blanco en username
    if (/\s/.test(username)) {
        return res.status(400).json({ message: 'El nombre de usuario no puede contener espacios.' });
    }

    try {
        // Buscar el usuario por ID
        const existingEmail = await findUserByEmail(email);
        if (existingEmail && existingEmail.id != id) {
            return res.status(400).json({ message: 'El correo ya está en uso por otro usuario.' });
        }

        // Validar que el nombre de usuario no esté en uso por otro usuario
        const existingUsername = await findUserByUsername(username);
        if (existingUsername && existingUsername.id != id) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso por otro usuario.' });
        }

        let hashedPassword = null;

        if (password) {
            // Validar que la contraseña no contenga espacios
            if (/\s/.test(password)) {
                return res.status(400).json({ message: 'La contraseña no puede contener espacios.' });
            }

            // Validar caracteres peligrosos en la contraseña
            if (containsXSSChars(password)) {
                return res.status(400).json({ message: 'La contraseña contiene caracteres peligrosos.' });
            }

            // Validar que la contraseña sea fuerte
            if (!passwordRegex.test(password)) {
                return res.status(400).json({
                    message: 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial.'
                });
            }

            hashedPassword = await bcrypt.hash(password, 10);
        }

        // Actualizar el usuario en la base de datos
        await updateUserInDB(id, username, email, hashedPassword);
        res.status(200).json({ message: 'Usuario actualizado correctamente.' });

    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        res.status(500).json({ message: 'Error del servidor al actualizar el usuario.' });
    }
};

// Eliminar un usuario (por ID)
export const deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        await deleteUserFromDB(id);
        res.status(200).json({ message: 'Usuario eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ message: 'Error del servidor al eliminar el usuario.' });
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

// Obtener artistas públicos para la landing
export const getPublicArtists = (req, res) => {
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
        if (err) {
            console.error('Error al obtener artistas públicos:', err);
            return res.status(500).json({ message: 'Error del servidor.' });
        }
        res.status(200).json(results);
    });
};

// Obtener todos los artistas (solo datos básicos)
export const getAllArtists = async (req, res) => {
  try {
    const artists = await getArtistsBasicInfo();
    res.status(200).json(artists);
  } catch (error) {
    console.error('Error al obtener artistas:', error);
    res.status(500).json({ message: 'Error del servidor al obtener artistas.' });
  }
};
