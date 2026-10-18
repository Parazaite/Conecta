import { Router } from 'express';
import pool from '../config/database.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const [categories] = await pool.execute(
    'SELECT id, name, slug, icon FROM categories ORDER BY name'
  );
  return res.json(categories);
}));

export default router;
