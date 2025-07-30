const express = require('express');
const router = express.Router();
const membreController = require('../controllers/membre.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.get('/', authenticateToken, membreController.getMembres);
router.get('/service/:serviceId', authenticateToken, membreController.getMembresByService);

module.exports = router;