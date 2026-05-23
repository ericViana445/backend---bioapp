import { Router } from 'express';

import { analyzeManualExam } from '../controllers/ai.controller';

const router = Router();

router.post('/analyze-manual', analyzeManualExam);

export default router;
