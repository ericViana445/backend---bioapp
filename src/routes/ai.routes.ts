import { Router } from "express";
import { analyzeText } from "../controllers/ai.controller";

const router = Router();

// POST /ai/analyze
router.post("/analyze", analyzeText);

export default router;
