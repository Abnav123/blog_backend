import express from 'express';
import { addArgument, getArgumentsByDebate } from '../controllers/argument_controller.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/:debateId', getArgumentsByDebate);

router.post('/', authMiddleware, addArgument);

export default router;