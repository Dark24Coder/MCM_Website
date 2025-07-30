const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/service.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.get('/', authenticateToken, serviceController.getServices);
router.get('/commission/:commissionId', authenticateToken, serviceController.getServicesByCommission);

module.exports = router;