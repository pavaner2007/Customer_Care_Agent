import express from 'express';
import { createTicket, getTickets, getStats, updateTicket, refreshReply, submitCsat, sendResponseEmail } from '../controllers/ticketController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/', createTicket); // Public endpoint for customer submission
router.patch('/:id/csat', submitCsat); // Public CSAT rating endpoint
router.get('/', protect, getTickets);
router.get('/stats', protect, getStats);
router.patch('/:id', protect, updateTicket);
router.post('/:id/reply', protect, refreshReply);
router.post('/:id/send-response', protect, sendResponseEmail);
export default router;

