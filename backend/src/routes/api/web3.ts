import express from 'express';
import { validateAddress, getWalletTransactions, getTransactionCount, getWalletBalance, verifyTransaction } from '../../handlers/web3Handlers';
import authMiddleware from '../../middleware/authMiddleware';

const router = express.Router();

router.get('/validate/:address', authMiddleware, validateAddress);
router.get('/transactions/:address', authMiddleware, getWalletTransactions);
router.get('/transaction-count/:address', authMiddleware, getTransactionCount);
router.get('/balance/:address', authMiddleware, getWalletBalance);
router.get('/verify/:txHash', authMiddleware, verifyTransaction);

export default router;

