const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken, checkRole } = require('../middlewares/auth.middleware');

router.get('/', authenticateToken, checkRole(['superadmin']), userController.getAllUsers);
router.put('/:id/role', authenticateToken, checkRole(['superadmin']), userController.updateUserRole);
router.delete('/:id', authenticateToken, checkRole(['superadmin']), userController.deleteUser);

module.exports = router;