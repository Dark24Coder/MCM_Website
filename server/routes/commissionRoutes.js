import express from 'express';
import { getPublicCommissions, getCommissions } from '../controllers/commissionController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/public', getPublicCommissions);
router.get('/', authenticateToken, getCommissions);

export default router;