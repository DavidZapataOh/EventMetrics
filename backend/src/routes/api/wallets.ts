import express from 'express';
import * as walletHandler from '../../handlers/walletHandler';
import authMiddleware from '../../middleware/authMiddleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/wallets/search?address=0x...
router.get('/search', walletHandler.searchWallet);

// GET /api/wallets/:address
router.get('/:address', walletHandler.getWalletInfo);

export default router; 