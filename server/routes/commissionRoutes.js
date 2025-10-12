const express = require('express');
const { getPublicCommissions, getCommissions } = require('../controllers/commissionController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.get('/public', getPublicCommissions);
router.get('/', authenticateToken, getCommissions);

module.exports = router;