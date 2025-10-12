const express = require('express');
const { 
    getPublicServicesByCommission, 
    getServices, 
    getServicesByCommission, 
    createService 
} = require('../controllers/serviceController');
const { authenticateToken, checkRole } = require('../middlewares/auth');

const router = express.Router();

router.get('/public/:commissionId', getPublicServicesByCommission);
router.get('/', authenticateToken, getServices);
router.get('/commission/:commissionId', authenticateToken, getServicesByCommission);
router.post('/', authenticateToken, checkRole(['superadmin', 'adminCom']), createService);

module.exports = router;