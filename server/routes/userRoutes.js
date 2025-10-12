const express = require('express');
const { 
    getUsers, 
    getUserById,
    getUserProfile, 
    updateUserRole, 
    deleteUser, 
    updateProfile 
} = require('../controllers/userController');
const { authenticateToken, checkRole } = require('../middlewares/auth');

const router = express.Router();

// Routes pour les utilisateurs
router.get('/', authenticateToken, checkRole(['superadmin']), getUsers);
router.get('/me', authenticateToken, getUserProfile);           // ROUTE AJOUTÉE
router.get('/:id', authenticateToken, getUserById);             // ROUTE AJOUTÉE
router.put('/:id/role', authenticateToken, checkRole(['superadmin']), updateUserRole);
router.put('/profile', authenticateToken, updateProfile);
router.delete('/:id', authenticateToken, checkRole(['superadmin']), deleteUser);

module.exports = router;