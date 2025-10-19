import express from 'express';
import { 
    getUsers, 
    getUserById,
    getUserProfile, 
    updateUserRole, 
    deleteUser, 
    updateProfile 
} from '../controllers/userController.js';
import { authenticateToken, checkRole } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticateToken, checkRole(['superadmin']), getUsers);
router.get('/me', authenticateToken, getUserProfile);
router.get('/:id', authenticateToken, getUserById);
router.put('/:id/role', authenticateToken, checkRole(['superadmin']), updateUserRole);
router.put('/profile', authenticateToken, updateProfile);
router.delete('/:id', authenticateToken, checkRole(['superadmin']), deleteUser);

export default router;