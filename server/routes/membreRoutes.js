import express from 'express';
import { 
    getMembres,
    getMembresByService,
    getMembreById,
    createMembre,
    updateMembre,
    deleteMembre 
} from '../controllers/membreController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getMembres);
router.get('/service/:serviceId', authenticateToken, getMembresByService);
router.get('/:id', authenticateToken, getMembreById);
router.post('/', authenticateToken, createMembre);
router.put('/:id', authenticateToken, updateMembre);
router.delete('/:id', authenticateToken, deleteMembre);

export default router;