import express from 'express';
import { createTicket, getTickets, getStats, updateTicket, refreshReply } from '../controllers/ticketController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/', createTicket); // Public endpoint for customer submission
router.get('/', protect, getTickets);
router.get('/stats', protect, getStats);
router.patch('/:id', protect, updateTicket);
router.post('/:id/reply', protect, refreshReply);
export default router;

