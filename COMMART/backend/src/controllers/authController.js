import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; 
import { 
    createUser, 
    findUserByEmail, 
    findUserByUsername, 
    getAllUsers,  // Mantener nombre original del modelo
    updateUser,
    deleteUserFromDB,
    findUserById,
    isUsernameAvailable,
    getArtistsBasicInfo,
    getAllStyles,
    getPublicArtists  // Mantener nombre original del modelo
} from '../models/userModel.js';

// Función para detectar caracteres peligrosos (para validación - rechazar entrada)
const containsXSSChars = (input) => /[<>"'&/]/.test(input);

// Función para escapar caracteres XSS (para campos visuales - mostrar de forma segura)
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

// Obtener todos los usuarios registrados (función del controlador)
export const getUsersController = async (req, res) => {
    try {
        const users = await getAllUsers();  // Usar directamente el nombre del modelo
        
        // Sanitizar los datos antes de enviarlos
        const sanitizedUsers = users.map(user => ({
            ...user,
            username: sanitizeInput(user.username),
            email: sanitizeInput(user.email)
        }));
        
        res.status(200).json(sanitizedUsers);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ message: 'Error del servidor al obtener los usuarios.' });
    }
};

// Obtener un usuario por ID
export const getUserByIdController = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await findUserById(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Sanitizar antes de mostrar
        res.status(200).json({
            id: user.id,
            username: sanitizeInput(user.username),
            email: sanitizeInput(user.email)
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ message: 'Error del servidor al obtener el usuario.' });
    }
};

// Actualizar Usuario (por ID) - para admin
export const updateUserByIdController = async (req, res) => {
    const { id } = req.params;
    const { username, email, password } = req.body;

    // Validar que todos los campos necesarios estén presentes
    if (!username || !email) {
        return res.status(400).json({ message: 'El nombre de usuario y correo son obligatorios.' });
    }

    // Validar caracteres peligrosos
    if (containsXSSChars(username)) {
        return res.status(400).json({ message: 'El nombre de usuario y la contraseña no pueden contener caracteres peligrosos como < > " \' / &' });
    }

    // Validar formato de correo
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Formato de correo inválido.' });
    }

    // Validar que no haya espacios en blanco en username
    if (/\s/.test(username)) {
        return res.status(400).json({ message: 'El nombre de usuario y la contraseña no pueden contener espacios.' });
    }

    try {
        // Buscar el usuario por ID
        const existingEmail = await findUserByEmail(email);
        if (existingEmail && existingEmail.id != id) {
            return res.status(400).json({ message: 'El correo ya está registrado.' });
        }

        // Validar que el nombre de usuario no esté en uso por otro usuario
        const existingUsername = await findUserByUsername(username);
        if (existingUsername && existingUsername.id != id) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso.' });
        }

        const updateData = { username, email };

        if (password) {
            // Validar que la contraseña no contenga espacios
            if (/\s/.test(password)) {
                return res.status(400).json({ message: 'El nombre de usuario y la contraseña no pueden contener espacios.' });
            }

            // Validar caracteres peligrosos en la contraseña
            if (containsXSSChars(password)) {
                return res.status(400).json({ message: 'El nombre de usuario y la contraseña no pueden contener caracteres peligrosos como < > " \' / &' });
            }

            // Validar que la contraseña sea fuerte
            if (!passwordRegex.test(password)) {
                return res.status(400).json({
                    message: 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial.'
                });
            }

            updateData.password = await bcrypt.hash(password, 10);
        }

        // Actualizar el usuario en la base de datos
        await updateUser(id, updateData);
        res.status(200).json({ message: 'Usuario actualizado correctamente.' });

    } catch (error) {
        console.error('Error al actualizar el usuario:', error);
        res.status(500).json({ message: 'Error del servidor al actualizar el usuario.' });
    }
};

// Eliminar un usuario (por ID)
export const deleteUserController = async (req, res) => {
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

// Obtener artistas públicos para la landing (función del controlador)
export const getPublicArtistsController = async (req, res) => {
  try {
    const artists = await getPublicArtists();  // Usar directamente el nombre del modelo
    
    // Sanitizar datos antes de enviar (usernames que se muestran al público)
    const sanitizedArtists = artists.map(artist => ({
      ...artist,
      username: sanitizeInput(artist.username)
    }));
    
    res.status(200).json(sanitizedArtists);
  } catch (error) {
    console.error('Error al obtener artistas públicos:', error);
    res.status(500).json({ message: 'Error del servidor al obtener artistas públicos.' });
  }
};

// Obtener todos los artistas (con información completa)
export const getAllArtistsController = async (req, res) => {
  try {
    const artists = await getArtistsBasicInfo();
    
    // Sanitizar usernames para mostrar de forma segura
    const sanitizedArtists = artists.map(artist => ({
      ...artist,
      username: sanitizeInput(artist.username),
      description: artist.description ? sanitizeInput(artist.description) : null
    }));
    
    res.status(200).json(sanitizedArtists);
  } catch (error) {
    console.error('Error al obtener artistas:', error);
    res.status(500).json({ message: 'Error del servidor al obtener artistas.' });
  }
};

// Obtener artistas filtrados por estilo
export const getArtistsByStyleController = async (req, res) => {
  const { styleId } = req.params;
  try {
    const artists = await getArtistsBasicInfo(parseInt(styleId));
    
    // Sanitizar usernames para mostrar de forma segura
    const sanitizedArtists = artists.map(artist => ({
      ...artist,
      username: sanitizeInput(artist.username),
      description: artist.description ? sanitizeInput(artist.description) : null
    }));
    
    res.status(200).json(sanitizedArtists);
  } catch (error) {
    console.error('Error al obtener artistas por estilo:', error);
    res.status(500).json({ message: 'Error del servidor al obtener artistas por estilo.' });
  }
};

// Obtener todos los estilos
export const getStylesController = async (req, res) => {
  try {
    const styles = await getAllStyles();
    res.status(200).json(styles);
  } catch (error) {
    console.error('Error al obtener estilos:', error);
    res.status(500).json({ message: 'Error del servidor al obtener estilos.' });
  }
};

// Obtener perfil del usuario actual
export const getUserProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await findUserById(userId, true); // incluir password para verificaciones
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Remover la contraseña y sanitizar datos antes de enviar la respuesta
    const { password, ...userProfile } = user;
    
    // Sanitizar campos que se mostrarán en la interfaz
    const sanitizedProfile = {
      ...userProfile,
      username: sanitizeInput(userProfile.username),
      email: sanitizeInput(userProfile.email),
      recovery_email: userProfile.recovery_email ? sanitizeInput(userProfile.recovery_email) : null
    };
    
    res.status(200).json(sanitizedProfile);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Actualizar perfil del usuario
export const updateUserProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, recovery_email, current_password, new_password } = req.body;
    const profileImage = req.file;

    // Obtener usuario actual
    const currentUser = await findUserById(userId, true);
    if (!currentUser) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const updateData = {};

    // Validar y actualizar username si se proporciona
    if (username && username !== currentUser.username) {
      // Validar formato (usando las mismas validaciones que el registro)
      if (containsXSSChars(username)) {
        return res.status(400).json({ message: 'El nombre de usuario y la contraseña no pueden contener caracteres peligrosos como < > " \' / &' });
      }
      
      if (/\s/.test(username)) {
        return res.status(400).json({ message: 'El nombre de usuario y la contraseña no pueden contener espacios.' });
      }
      
      // Verificar que no esté en uso
      const isAvailable = await isUsernameAvailable(username, userId);
      if (!isAvailable) {
        return res.status(400).json({ message: 'El nombre de usuario ya está en uso.' });
      }
      
      updateData.username = username;
    }

    // Actualizar correo de recuperación
    if (recovery_email !== undefined) {
      if (recovery_email && !emailRegex.test(recovery_email)) {
        return res.status(400).json({ message: 'Formato de correo inválido.' });
      }
      updateData.recovery_email = recovery_email || null;
    }

    // Cambiar contraseña si se proporciona
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ message: 'Se requiere la contraseña actual para cambiarla.' });
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await bcrypt.compare(current_password, currentUser.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: 'Contraseña incorrecta.' });
      }

      // Validar nueva contraseña (usando las mismas validaciones que el registro)
      if (containsXSSChars(new_password)) {
        return res.status(400).json({ message: 'El nombre de usuario y la contraseña no pueden contener caracteres peligrosos como < > " \' / &' });
      }

      if (/\s/.test(new_password)) {
        return res.status(400).json({ message: 'El nombre de usuario y la contraseña no pueden contener espacios.' });
      }

      if (!passwordRegex.test(new_password)) {
        return res.status(400).json({ 
          message: 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial.' 
        });
      }

      updateData.password = await bcrypt.hash(new_password, 10);
    }

    // Actualizar imagen de perfil
    if (profileImage) {
      updateData.profile_image = `uploads/${profileImage.filename}`;
    }

    // Si no hay campos para actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron datos para actualizar.' });
    }

    // Ejecutar actualización
    await updateUser(userId, updateData);
    res.status(200).json({ message: 'Perfil actualizado exitosamente.' });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    
    if (error.message === 'No se proporcionaron campos para actualizar.') {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Verificar disponibilidad de username
export const checkUsernameController = async (req, res) => {
  try {
    const { username, excludeUserId } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: 'Se requiere un nombre de usuario.' });
    }
    
    const available = await isUsernameAvailable(username, excludeUserId);
    res.status(200).json({ available });
  } catch (error) {
    console.error('Error al verificar username:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Verificar contraseña actual del usuario
export const verifyCurrentPasswordController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password } = req.body;
    
    if (!current_password) {
      return res.status(400).json({ message: 'Se requiere la contraseña actual.' });
    }
    
    // Obtener usuario con contraseña
    const user = await findUserById(userId, true);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }
    
    // Verificar contraseña
    const isValid = await bcrypt.compare(current_password, user.password);
    res.status(200).json({ valid: isValid });
    
  } catch (error) {
    console.error('Error al verificar contraseña:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};
