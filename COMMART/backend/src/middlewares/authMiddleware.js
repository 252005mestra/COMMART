// Middleware para verificar el token JWT
import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const token = req.cookies.token; // Buscamos el token en la cookie
  
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Esto debe incluir id, email, role
    next(); // Continuar al siguiente middleware o ruta
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido.' });
  }
};
