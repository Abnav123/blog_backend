import express from 'express';
import { createDebate, getAllDebates, getSingleDebate } from '../controllers/debate_controller.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllDebates);
router.get('/:id', getSingleDebate);

router.post('/', authMiddleware, createDebate);

export default router;