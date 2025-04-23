import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/protected', verifyToken, (req, res) => {
    res.status(200).json({
        message: 'Accediste a una ruta protegida!',
        user: req.user
    });
});

export default router;