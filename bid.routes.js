import { Router } from 'express';
import { authMiddleware } from '../fort/auth-middleware.js';
import { 
  placeBidHandler, 
  getBidsByTenderHandler, 
  getBidsByBidderHandler,
  updateBidStatusHandler
} from '../controllers/bid.controller.js';
import { z } from 'zod';
import { db } from '../fort/db-client.js';

const router = Router();

// All bid routes require authentication
router.use(authMiddleware);

// Create a new bid
router.post('/', placeBidHandler);

// Get all bids for a tender
router.get('/tender/:tenderId', getBidsByTenderHandler);

// Get all bids by the current bidder
router.get('/my-bids', getBidsByBidderHandler);

// Fallback route for handling bids via direct API operations
router.post('/direct', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== 'Bidder') return res.status(403).json({ error: "Only bidders can place bids" });
    
    // Validate request body
    const BidSchema = z.object({
      tenderId: z.coerce.number().int().positive(),
      amount: z.coerce.number().positive()
    });
    
    const { tenderId, amount } = BidSchema.parse(req.body);
    
    // Check if tender exists and is published
    const [tenderResult] = await db.execute(
      "SELECT * FROM Tender WHERE tender_id = ? AND status = 'Published'",
      [tenderId]
    );
    
    if (tenderResult.length === 0) {
      return res.status(404).json({ error: "Tender not found or not available for bidding" });
    }
    
    const tender = tenderResult[0];
    
    // Check if tender deadline has passed
    const today = new Date();
    const deadline = new Date(tender.deadline);
    
    if (today > deadline) {
      return res.status(400).json({ error: "Tender deadline has passed, no more bids can be placed" });
    }
    
    // Insert the bid
    const [result] = await db.execute(
      "INSERT INTO Bid (tender_id, bidder_id, amount, status) VALUES (?, ?, ?, 'Submitted')",
      [tenderId, req.user.userId, amount]
    );
    
    return res.status(201).json({
      success: true,
      message: "Bid placed successfully",
      bidId: result.insertId
    });
    
  } catch (err) {
    console.error("Error placing bid:", err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid bid data", details: err.errors });
    }
    return res.status(500).json({ error: "Failed to place bid" });
  }
});

export default router;
