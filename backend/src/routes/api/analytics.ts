import express from 'express'
import { getOverallMetrics, getUserMetrics, getTimelineMetrics, getRegionMetrics, getWalletMetrics } from '../../handlers/analyticsHandler'
import authMiddleware from '../../middleware/authMiddleware'

const router = express.Router()

router.get('/overall', authMiddleware, getOverallMetrics);
router.get('/users', authMiddleware, getUserMetrics);
router.get('/timeline', authMiddleware, getTimelineMetrics);
router.get('/regions', authMiddleware, getRegionMetrics);
router.get('/wallets', authMiddleware, getWalletMetrics);

export default router


