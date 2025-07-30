const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.put('/', authenticateToken, profileController.updateProfile);

module.exports = router;