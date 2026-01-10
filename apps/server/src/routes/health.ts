import { Router } from 'express';
import type { Request, Response as ExpressResponse } from 'express';

const router: Router = Router();

router.get('/', (_req: Request, res: ExpressResponse) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;
