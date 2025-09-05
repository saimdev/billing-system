// apps/backend/src/routes/search.ts
import { Router } from 'express';
import { searchService } from '../services/search.service.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

// GET /api/search/global - Global search
router.get('/global', async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const results = await searchService.globalSearch(req.user!.tenantId, q);
    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

export { router as searchRoutes };