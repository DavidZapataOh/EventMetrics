// src/routes/api/metrics.ts
import { Router, Request, Response } from 'express';
import client from 'prom-client';

const router = Router();

// GET /api/metrics
router.get('/', async (_req: Request, res: Response) => {
  res.set('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

export default router;
