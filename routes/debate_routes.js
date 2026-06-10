import express from 'express';
import {
    closeDebate,
    createDebate,
    deleteDebate,
    getAllDebates,
    getBookmarkedDebates,
    getSingleDebate,
    reopenDebate,
    toggleBookmarkDebate,
    toggleLikeDebate,
    updateDebate
} from '../controllers/debate_controller.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllDebates);
router.get('/bookmarks/me', authMiddleware, getBookmarkedDebates);
router.get('/:id', getSingleDebate);

router.post('/', authMiddleware, createDebate);
router.patch('/:id', authMiddleware, updateDebate);
router.delete('/:id', authMiddleware, deleteDebate);
router.post('/:id/like', authMiddleware, toggleLikeDebate);
router.post('/:id/bookmark', authMiddleware, toggleBookmarkDebate);
router.patch('/:id/close', authMiddleware, closeDebate);
router.patch('/:id/reopen', authMiddleware, reopenDebate);

export default router;
