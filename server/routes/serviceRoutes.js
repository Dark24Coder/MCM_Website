import express from 'express';
import { 
    getServices, 
    getServicesByCommission, 
    createService 
} from '../controllers/serviceController.js';
import { authenticateToken, checkRole } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getServices);
router.get('/commission/:commissionId', authenticateToken, getServicesByCommission);
router.post('/', authenticateToken, checkRole(['superadmin', 'adminCom']), createService);

export default router;