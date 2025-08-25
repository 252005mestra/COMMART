import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; 
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import {
  createUserModel,
  findUserByEmailModel,
  findUserByUsernameModel,
  findUserByIdModel,
  getAllUsersModel,
  updateUserModel,
  isUsernameAvailableModel,
  deleteUserFromDBModel,
  getArtistsBasicInfoModel,
  getArtistFullProfileModel,
  getAllStylesModel,
  getAllLanguagesModel,
  findUserByRecoveryEmailModel,
  setResetTokenModel,
  findUserByResetTokenModel,
  updatePasswordAndClearTokenModel,
  getArtistPortfolioModel,
  getArtistStylesModel,
  getArtistLanguagesModel,
  getArtistFollowersCountModel,
  getArtistFollowingCountModel,
  getArtistSalesCountModel,
  getArtistPurchasesCountModel,
  getArtistFavoritesCountModel,
  getArtistReviewsCountModel,
  getArtistRatingModel,
  updateArtistProfileModel
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
        const existingEmail = await findUserByEmailModel(email);
        if (existingEmail) {
            return res.status(400).json({ message: 'El correo ya está registrado.' });
        }
        
        // Validar que el nombre de usuario no esté registrado
        const existingUsername = await findUserByUsernameModel(username);
        if (existingUsername) {
            return res.status(400).json({ message: 'El nombre de usuario ya está en uso.' });
        }
        
        // Encriptación de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);
        await createUserModel(username, email, hashedPassword);
        
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
        let user = await findUserByEmailModel(identifier);

        // Si no encuentra por email, buscar por username
        if (!user) {
            user = await findUserByUsernameModel(identifier);
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
        const users = await getAllUsersModel();  // Usar directamente el nombre del modelo
        
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
        const user = await findUserByIdModel(id);
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
        const existingEmail = await findUserByEmailModel(email);
        if (existingEmail && existingEmail.id != id) {
            return res.status(400).json({ message: 'El correo ya está registrado.' });
        }

        // Validar que el nombre de usuario no esté en uso por otro usuario
        const existingUsername = await findUserByUsernameModel(username);
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
        await updateUserModel(id, updateData);
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
        await deleteUserFromDBModel(id);
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
    const artists = await getArtistsBasicInfoModel();  // Usar directamente el nombre del modelo
    
    // Sanitizar datos antes de enviarlos (usernames que se muestran al público)
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
    const currentUserId = req.user?.id; // Obtener ID del usuario actual
    const artists = await getArtistsBasicInfoModel();

    // Sanitizar usernames para mostrar de forma segura Y excluir perfil propio
    const sanitizedArtists = artists
      .filter(artist => artist.id !== currentUserId) // <-- Excluir perfil propio
      .map(artist => ({
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
    const currentUserId = req.user?.id; // Obtener ID del usuario actual
    const artists = await getArtistsBasicInfoModel(parseInt(styleId));

    // Sanitizar usernames para mostrar de forma segura Y excluir perfil propio
    const sanitizedArtists = artists
      .filter(artist => artist.id !== currentUserId) // <-- Excluir perfil propio
      .map(artist => ({
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
    const styles = await getAllStylesModel();
    res.status(200).json(styles);
  } catch (error) {
    console.error('Error al obtener estilos:', error);
    res.status(500).json({ message: 'Error del servidor al obtener estilos.' });
  }
};

// Obtener perfil del usuario actual (completo)
export const getUserProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await findUserByIdModel(userId, true);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Si es artista, traer datos relacionados
    let portfolio = [];
    let styles = [];
    let languages = [];
    let followers = 0;
    let following = 0;
    let sales = 0;
    let purchases = 0;
    let favorites = 0;
    let reviews = 0;
    let rating = 0;

    if (user.is_artist) {
      portfolio = await getArtistPortfolioModel(userId); 
      styles = await getArtistStylesModel(userId); 
      languages = await getArtistLanguagesModel(userId); 
      followers = await getArtistFollowersCountModel(userId);
      following = await getArtistFollowingCountModel(userId);
      sales = await getArtistSalesCountModel(userId);
      purchases = await getArtistPurchasesCountModel(userId);
      favorites = await getArtistFavoritesCountModel(userId);
      reviews = await getArtistReviewsCountModel(userId);
      rating = await getArtistRatingModel(userId);
    }

    // Sanitizar y devolver todo
    res.status(200).json({
      ...user,
      portfolio,
      styles,
      languages,
      followers,
      following,
      sales,
      purchases,
      favorites,
      reviews,
      rating
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Actualizar perfil del usuario
export const updateUserProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, recovery_email, current_password, new_password, is_artist } = req.body;
    const profileImage = req.file;

    // Obtener usuario actual
    const currentUser = await findUserByIdModel(userId, true);
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
      const isAvailable = await isUsernameAvailableModel(username, userId);
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

    // Actualizar estado de artista si se proporciona
    if (typeof is_artist !== 'undefined') {
      if (currentUser.is_artist) {
        // Ya es artista, no permitir volver a cliente
        // Ignorar el cambio si intenta ponerlo en false
      } else if (is_artist === true || is_artist === 'true') {
        updateData.is_artist = true;
        updateData.artist_activated_at = new Date();
        updateData.role = 'artist'; // <--- Asegura el cambio de rol en la base de datos
        // Aquí puedes crear el perfil de artista si no existe
      }
    }

    // Si no hay campos para actualizar
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No se proporcionaron datos para actualizar.' });
    }

    // Ejecutar actualización
    await updateUserModel(userId, updateData);
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
    
    const available = await isUsernameAvailableModel(username, excludeUserId);
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
    const user = await findUserByIdModel(userId, true);
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

// Encontrar usuario para recuperación (por email o username)
export const findUserForRecoveryController = async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ message: 'Debes ingresar usuario o correo.' });
  }
  try {
    let user = await findUserByEmailModel(identifier);
    if (!user) user = await findUserByUsernameModel(identifier);
    if (!user) user = await findUserByRecoveryEmailModel(identifier);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    res.status(200).json({
      email: user.email || null,
      recovery_email: user.recovery_email || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Enviar correo de recuperación de contraseña
export const forgotPasswordController = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Debes ingresar un correo válido.' });
  }
  try {
    // Buscar por email principal o de recuperación
    const user = await findUserByEmailModel(email) || await findUserByRecoveryEmailModel(email);
    if (!user) {
      return res.status(404).json({ message: 'No se encontró el usuario con ese correo.' });
    }

    // Generar token y guardar en la base de datos
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 3600000; // 1 hora
    await setResetTokenModel(user.id, token, expiry);

    // Configura tu transporter con tus credenciales
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const resetUrl = `http://localhost:5173/reset-password/${token}`;
    await transporter.sendMail({
      to: email,
      subject: 'Restablecimiento de contraseña',
      html: `<p>Haz clic <a href="${resetUrl}">aquí</a> para restablecer tu contraseña.</p>`
    });

    res.status(200).json({ message: 'Correo de recuperación enviado.' });
  } catch (error) {
    console.error('Error al enviar correo de recuperación:', error);
    res.status(500).json({ message: 'Error al enviar el correo de recuperación.' });
  }
};

// Restablecer contraseña
export const resetPasswordController = async (req, res) => {
  // Obtener token y nueva contraseña del request
  const token = req.params.token || req.body.token;
  const password = req.body.password || req.body.newPassword;

  // Validaciones robustas
  if (!token || !password) {
    // Token o contraseña faltante
    return res.status(400).json({ message: 'Token y nueva contraseña son requeridos.' });
  }
  if (/\s/.test(password)) {
    // Espacios en la contraseña
    return res.status(400).json({ message: 'La contraseña no puede contener espacios.' });
  }
  if (containsXSSChars(password)) {
    // Caracteres peligrosos
    return res.status(400).json({ message: 'La contraseña contiene caracteres peligrosos.' });
  }
  if (!passwordRegex.test(password)) {
    // Contraseña débil
    return res.status(400).json({
      message: 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula, un número y un carácter especial.'
    });
  }

  try {
    // Buscar usuario por token de recuperación
    const user = await findUserByResetTokenModel(token);

    // Verificar expiración del token
    // Si tu campo es BIGINT (milisegundos):
    if (!user || !user.reset_token_expiry || user.reset_token_expiry < Date.now()) {
      // Token inválido o expirado
      return res.status(400).json({ message: 'Token inválido o expirado.' });
    }
    // Si tu campo es DATETIME, usa:
    // if (!user || !user.reset_token_expiry || new Date(user.reset_token_expiry) < new Date()) { ... }

    // Hashear y actualizar la contraseña, limpiar token y expiración
    const hashedPassword = await bcrypt.hash(password, 10);
    await updatePasswordAndClearTokenModel(user.id, hashedPassword);

    // Contraseña cambiada correctamente
    res.status(200).json({ message: 'Contraseña restablecida exitosamente.' });
  } catch (error) {
    // Error inesperado
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Perfil propio (requiere autenticación)
export const getOwnArtistProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await getArtistFullProfileModel(userId);
    if (!profile) return res.status(404).json({ message: 'No eres artista.' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener perfil de artista.' });
  }
};

// Perfil público de artista por ID
export const getPublicArtistProfileController = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await getArtistFullProfileModel(id);
    if (!profile) return res.status(404).json({ message: 'Artista no encontrado.' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener perfil público.' });
  }
};

// Endpoint para obtener todos los estilos
export const getAllStylesController = async (req, res) => {
  try {
    const styles = await getAllStylesModel();
    res.json(styles);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener estilos.' });
  }
};

// Endpoint para obtener todos los idiomas
export const getAllLanguagesController = async (req, res) => {
  try {
    const languages = await getAllLanguagesModel();
    res.json(languages);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener idiomas.' });
  }
};

// Actualizar perfil de artista
export const updateArtistProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio, availability, price_policy, styles = [], languages = [] } = req.body;
    const portfolioImages = req.files || [];

    // Validaciones aquí si quieres

    await updateArtistProfileModel({
      userId,
      bio,
      availability,
      price_policy,
      styles,
      languages,
      portfolioImages
    });

    const updatedProfile = await getArtistFullProfileModel(userId);
    res.status(200).json(updatedProfile);
  } catch (err) {
    console.error('Error al actualizar perfil de artista:', err);
    res.status(500).json({ message: 'Error al actualizar perfil de artista.' });
  }
};


