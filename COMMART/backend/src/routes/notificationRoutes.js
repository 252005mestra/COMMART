import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
  createNotificationController,
  getUserNotificationsController
} from '../controllers/notificationController.js';
import dbConnection from '../config/db.js';

const router = express.Router();

router.post('/', verifyToken, createNotificationController);
router.get('/', verifyToken, getUserNotificationsController);

// Marcar notificación como leída (usa is_read)
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await new Promise((resolve, reject) => {
      dbConnection.query(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
        [id, userId],
        (err, result) => {
          if (err) return reject(err);
          resolve(result);
        }
      );
    });

    res.status(200).json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error al marcar notificación:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

export default router;