import express from 'express';
import { getCommissions } from '../controllers/commissionController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getCommissions);

export default router;