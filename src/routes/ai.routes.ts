import { Router } from 'express';

const router = Router();

router.post('/analyze', (_req, res) => {
  res.json({ message: 'IA em construção 🤖' });
});

export default router;
