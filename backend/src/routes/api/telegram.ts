import express from 'express';
import { handleTelegramWebhook } from '../../handlers/organizationHandler';

const router = express.Router();

router.post('/webhook', handleTelegramWebhook as any);

export default router;