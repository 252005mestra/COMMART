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
  updateArtistProfileModel,
  checkIfFollowingModel,
  followArtistModel,
  unfollowArtistModel,
  checkIfFavoriteModel,
  addFavoriteArtistModel,
  removeFavoriteArtistModel,
  getUserFavoriteArtistsModel,
  getUserFollowedArtistsModel,
  getUserFavoriteArtistsCountModel,
  getUserFollowedArtistsCountModel,
  getArtistFollowersListModel,
  getArtistFavoritedByListModel
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
    
    // Obtener datos básicos del usuario
    const user = await findUserByIdModel(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Para TODOS los usuarios (artistas y clientes)
    const myFavoriteArtistsCount = await getUserFavoriteArtistsCountModel(userId);
    const followedArtistsCount = await getUserFollowedArtistsCountModel(userId);

    if (user.is_artist) {
      // Obtener información adicional para artistas
      const artistInfo = await getArtistFullProfileModel(userId);
      let portfolio = [], styles = [], languages = [], followers = 0, following = 0;
      let sales = 0, purchases = 0, reviews = 0, rating = 0, peopleWhoFavoriteMe = 0;

      if (artistInfo) {
        ({ portfolio, styles, languages, followers, following, sales, purchases, reviews, rating } = artistInfo);
      }

      // Obtener contadores específicos para artistas
      peopleWhoFavoriteMe = await getArtistFavoritesCountModel(userId);

      // Obtener listas
      const favoritesList = await getUserFavoriteArtistsModel(userId);
      const followedList = await getUserFollowedArtistsModel(userId);
      
      // Responder con datos de artista
      res.status(200).json({
        ...user,
        portfolio,
        styles,
        languages,
        followers, // Seguidores del artista
        following, // Artistas que sigue el artista
        sales,
        purchases,
        favorites: myFavoriteArtistsCount, // MIS artistas favoritos
        peopleWhoFavoriteMe, // Cuántos usuarios ME tienen como favorito
        reviews,
        rating,
        myFavoriteArtistsCount,
        followedArtistsCount,
        favoritesList,
        followedList,
        packagesList: [],
        salesList: [],
        purchasesList: [],
        reviewsList: []
      });
    } else {
      // Para usuarios clientes
      const favoritesList = await getUserFavoriteArtistsModel(userId);
      const followedList = await getUserFollowedArtistsModel(userId);
      
      res.status(200).json({
        ...user,
        favorites: myFavoriteArtistsCount, // MIS artistas favoritos
        myFavoriteArtistsCount,
        followedArtistsCount,
        purchases: 0, // Implementar cuando tengas compras
        reviews: 0,   // Implementar cuando tengas reviews
        favoritesList,
        followedList,
        purchasesList: [],
        reviewsList: []
      });
    }

  } catch (error) {
    console.error('Error al obtener perfil de usuario:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
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

// Nuevo controlador para obtener perfil propio de artista
export const getOwnArtistProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await getArtistFullProfileModel(userId);
    
    if (!profile) {
      return res.status(404).json({ message: 'Perfil de artista no encontrado.' });
    }

    // Agregar contadores correctos
    const myFavoriteArtistsCount = await getUserFavoriteArtistsCountModel(userId);
    const followedArtistsCount = await getUserFollowedArtistsCountModel(userId);
    const peopleWhoFavoriteMe = await getArtistFavoritesCountModel(userId);

    // Agregar listas
    const favoritesList = await getUserFavoriteArtistsModel(userId);
    const followedList = await getUserFollowedArtistsModel(userId);
    
    res.json({
      ...profile,
      favorites: myFavoriteArtistsCount, // MIS favoritos
      peopleWhoFavoriteMe, // Cuántos me tienen como favorito
      myFavoriteArtistsCount,
      followedArtistsCount,
      favoritesList,
      followedList,
      packagesList: [],
      salesList: [],
      purchasesList: [],
      reviewsList: []
    });

  } catch (err) {
    console.error('Error al obtener perfil propio de artista:', err);
    res.status(500).json({ message: 'Error al obtener perfil.' });
  }
};

// Perfil público de artista por ID
export const getPublicArtistProfileController = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await getArtistFullProfileModel(id);
    if (!profile) return res.status(404).json({ message: 'Artista no encontrado.' });
    
    // Calcular contadores correctos para vista pública
    const myFavoriteArtistsCount = await getUserFavoriteArtistsCountModel(id);
    const followedArtistsCount = await getUserFollowedArtistsCountModel(id);
    
    // Agregar listas para vista pública
    const favoritesList = await getUserFavoriteArtistsModel(id);
    
    res.json({
      ...profile,
      favorites: myFavoriteArtistsCount, // Sus favoritos
      myFavoriteArtistsCount,
      followedArtistsCount,
      favoritesList,
      reviewsList: []
    });
  } catch (err) {
    console.error('Error al obtener perfil público:', err);
    res.status(500).json({ message: 'Error al obtener perfil público.' });
  }
};

// Endpoint para obtener todos los estilos
export const getAllStylesController = async (req, res) => {
  try {
    const styles = await getAllStylesModel();
    res.json(styles);
  } catch (err) {
    console.error('Error al obtener estilos:', err);
    res.status(500).json({ message: 'Error al obtener estilos.' });
  }
};

// Endpoint para obtener todos los idiomas
export const getAllLanguagesController = async (req, res) => {
  try {
    const languages = await getAllLanguagesModel();
    res.json(languages);
  } catch (err) {
    console.error('Error al obtener idiomas:', err);
    res.status(500).json({ message: 'Error al obtener idiomas.' });
  }
};

// Actualizar perfil de artista
export const updateArtistProfileController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bio, availability, price_policy, styles = [], languages = [] } = req.body;
    
    console.log('Datos recibidos:', { bio, availability, price_policy, styles, languages });
    console.log('Archivos recibidos:', req.files);

    // Validar que el usuario sea artista
    const user = await findUserByIdModel(userId);
    if (!user || !user.is_artist) {
      return res.status(403).json({ message: 'Solo los artistas pueden actualizar este perfil.' });
    }

    // Manejar archivos correctamente
    let portfolioImages = [];
    let profileImage = null;

    if (req.files) {
      // Si req.files es un array (multer.array())
      if (Array.isArray(req.files)) {
        portfolioImages = req.files;
      } 
      // Si req.files es un objeto (multer.fields())
      else if (typeof req.files === 'object') {
        portfolioImages = req.files.portfolio_images || [];
        profileImage = req.files.profile_image ? req.files.profile_image[0] : null;
      }
    }

    // Actualizar imagen de perfil del usuario si se proporciona
    if (profileImage) {
      await updateUserModel(userId, { profile_image: `uploads/${profileImage.filename}` });
    }

    // Convertir strings de arrays si vienen como JSON strings
    let stylesArray = [];
    let languagesArray = [];

    if (typeof styles === 'string') {
      try {
        stylesArray = JSON.parse(styles);
      } catch (e) {
        stylesArray = styles.split(',').map(s => s.trim()).filter(s => s);
      }
    } else if (Array.isArray(styles)) {
      stylesArray = styles;
    }

    if (typeof languages === 'string') {
      try {
        languagesArray = JSON.parse(languages);
      } catch (e) {
        languagesArray = languages.split(',').map(l => l.trim()).filter(l => l);
      }
    } else if (Array.isArray(languages)) {
      languagesArray = languages;
    }

    // Actualizar perfil de artista
    await updateArtistProfileModel({
      userId,
      bio,
      availability: availability === 'true' || availability === true || availability === '1',
      price_policy,
      styles: stylesArray,
      languages: languagesArray,
      portfolioImages
    });

    // Obtener perfil actualizado
    const updatedProfile = await getArtistFullProfileModel(userId);
    
    res.status(200).json({
      message: 'Perfil de artista actualizado exitosamente.',
      profile: updatedProfile
    });

  } catch (err) {
    console.error('Error al actualizar perfil de artista:', err);
    res.status(500).json({ 
      message: 'Error al actualizar perfil de artista.',
      error: err.message 
    });
  }
};

// ========== CONTROLADORES PARA SEGUIR ARTISTAS ==========

// Seguir/dejar de seguir artista
export const toggleFollowArtistController = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { artistId } = req.params;

    // Verificar que el artista existe y es artista
    const artist = await findUserByIdModel(artistId);
    if (!artist || !artist.is_artist) {
      return res.status(404).json({ message: 'Artista no encontrado.' });
    }

    // No permitir seguirse a sí mismo
    if (followerId == artistId) {
      return res.status(400).json({ message: 'No puedes seguirte a ti mismo.' });
    }

    // Verificar si ya está siguiendo
    const isFollowing = await checkIfFollowingModel(followerId, artistId);
    
    if (isFollowing) {
      // Dejar de seguir
      await unfollowArtistModel(followerId, artistId);
      res.status(200).json({ 
        message: 'Has dejado de seguir a este artista.',
        isFollowing: false 
      });
    } else {
      // Seguir
      await followArtistModel(followerId, artistId);
      res.status(200).json({ 
        message: 'Ahora sigues a este artista.',
        isFollowing: true 
      });
    }

  } catch (error) {
    console.error('Error al seguir/dejar de seguir artista:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Verificar si sigue a un artista específico
export const checkFollowStatusController = async (req, res) => {
  try {
    const followerId = req.user.id;
    const { artistId } = req.params;

    const isFollowing = await checkIfFollowingModel(followerId, artistId);
    res.status(200).json({ isFollowing });

  } catch (error) {
    console.error('Error al verificar estado de seguimiento:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// ========== CONTROLADORES PARA FAVORITOS ==========

// Agregar/quitar de favoritos
export const toggleFavoriteArtistController = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { artistId } = req.params;

    // Verificar que el artista existe y es artista
    const artist = await findUserByIdModel(artistId);
    if (!artist || !artist.is_artist) {
      return res.status(404).json({ message: 'Artista no encontrado.' });
    }

    // No permitir agregarse a sí mismo como favorito
    if (clientId == artistId) {
      return res.status(400).json({ message: 'No puedes agregarte a ti mismo como favorito.' });
    }

    // Verificar si ya está en favoritos
    const isFavorite = await checkIfFavoriteModel(clientId, artistId);
    
    if (isFavorite) {
      // Quitar de favoritos
      await removeFavoriteArtistModel(clientId, artistId);
      res.status(200).json({ 
        message: 'Has quitado este artista de tus favoritos.',
        isFavorite: false 
      });
    } else {
      // Agregar a favoritos
      await addFavoriteArtistModel(clientId, artistId);
      res.status(200).json({ 
        message: 'Este artista ha sido agregado a tus favoritos.',
        isFavorite: true 
      });
    }

  } catch (error) {
    console.error('Error al agregar/quitar de favoritos:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Verificar si un artista está en favoritos
export const checkFavoriteStatusController = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { artistId } = req.params;

    const isFavorite = await checkIfFavoriteModel(clientId, artistId);
    res.status(200).json({ isFavorite });

  } catch (error) {
    console.error('Error al verificar estado de favorito:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Obtener artistas favoritos del usuario
export const getUserFavoriteArtistsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const favoriteArtists = await getUserFavoriteArtistsModel(userId);
    
    // Sanitizar datos
    const sanitizedFavorites = favoriteArtists.map(artist => ({
      ...artist,
      username: sanitizeInput(artist.username)
    }));
    
    res.status(200).json(sanitizedFavorites);
  } catch (error) {
    console.error('Error al obtener artistas favoritos:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Obtener artistas que sigue el usuario
export const getUserFollowedArtistsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const followedArtists = await getUserFollowedArtistsModel(userId);
    
    // Sanitizar datos
    const sanitizedFollowed = followedArtists.map(artist => ({
      ...artist,
      username: sanitizeInput(artist.username)
    }));
    
    res.status(200).json(sanitizedFollowed);

  } catch (error) {
    console.error('Error al obtener artistas seguidos:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Obtener lista de seguidores de un artista (para modal)
export const getArtistFollowersController = async (req, res) => {
  try {
    const { artistId } = req.params;
    const followers = await getArtistFollowersListModel(artistId);
    
    // Sanitizar datos
    const sanitizedFollowers = followers.map(follower => ({
      ...follower,
      username: sanitizeInput(follower.username)
    }));
    
    res.status(200).json(sanitizedFollowers);

  } catch (error) {
    console.error('Error al obtener seguidores:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Obtener lista de usuarios que tienen al artista en favoritos (para modal)
export const getArtistFavoritedByController = async (req, res) => {
  try {
    const { artistId } = req.params;
    const favoritedBy = await getArtistFavoritedByListModel(artistId);
    
    // Sanitizar datos
    const sanitizedFavoritedBy = favoritedBy.map(user => ({
      ...user,
      username: sanitizeInput(user.username)
    }));
    
    res.status(200).json(sanitizedFavoritedBy);

  } catch (error) {
    console.error('Error al obtener usuarios que favoritearon:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};

// Obtener perfil público de usuario (cliente)
export const getPublicUserProfileController = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findUserByIdModel(id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Calcular contadores correctos
    const followedArtistsCount = await getUserFollowedArtistsCountModel(id);
    const myFavoriteArtistsCount = await getUserFavoriteArtistsCountModel(id);
    
    // Obtener listas
    const favoritesList = await getUserFavoriteArtistsModel(id);
    const reviewsList = [];
    
    res.status(200).json({
      id: user.id,
      username: user.username,
      profile_image: user.profile_image,
      followedArtistsCount, // Conteo correcto
      favorites: myFavoriteArtistsCount, // Conteo correcto
      purchases: 0,
      reviews: 0,
      favoritesList,
      reviewsList
    });

  } catch (error) {
    console.error('Error al obtener perfil público de usuario:', error);
    res.status(500).json({ message: 'Error del servidor.' });
  }
};


