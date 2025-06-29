import express from 'express';
import { getWalletInfo, searchWallet } from '../../handlers/walletHandler';
import authMiddleware from '../../middleware/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/wallets/search?address=0x...
router.get('/search', searchWallet);

// GET /api/wallets/:address
router.get('/:address', getWalletInfo);

export default router; 