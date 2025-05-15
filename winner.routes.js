// routes/winner.routes.js
import { Router } from 'express';
import { authMiddleware } from '../fort/auth-middleware.js';
import { 
  selectWinningBidHandler, 
  getAllWinnersHandler, 
  getTenderWinnerHandler
} from '../controllers/winner.controller.js';

const router = Router();

// All winner routes require authentication
router.use(authMiddleware);

// Select a winning bid for a tender
router.post('/', selectWinningBidHandler);

// Get all winners (admin only)
router.get('/', getAllWinnersHandler);

// Get winner for a specific tender
router.get('/tender/:tenderId', getTenderWinnerHandler);

export default router;
