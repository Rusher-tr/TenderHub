import { Router } from 'express';
import { z } from 'zod';
import { db } from '../fort/db-client.js';
import { authMiddleware } from '../fort/auth-middleware.js';

const router = Router();

// Protect all bidder routes with JWT authentication
router.use(authMiddleware);

// Schema for bid submission validation
const BidSchema = z.object({
  tenderId: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive()
});

// Route for placing a bid
router.post('/', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== 'Bidder') return res.status(403).json({ error: "Only bidders can place bids" });
    
    // Validate request body
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

// Get all bids for a specific tender
router.get('/tender/:tenderId', async (req, res) => {
  try {
    const { tenderId } = req.params;
    
    const [bids] = await db.execute(
      `SELECT b.*, u.name as bidder_name
       FROM Bid b
       JOIN User u ON b.bidder_id = u.user_id
       WHERE b.tender_id = ?
       ORDER BY b.submission_date DESC`,
      [tenderId]
    );
    
    return res.json(bids);
  } catch (err) {
    console.error("Error fetching tender bids:", err);
    return res.status(500).json({ error: "Failed to fetch bids" });
  }
});

// Get all bids by the current bidder
router.get('/my-bids', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== 'Bidder') return res.status(403).json({ error: "Only bidders can access their bids" });
    
    const [bids] = await db.execute(
      `SELECT b.*, t.title as tender_title, t.status as tender_status
       FROM Bid b
       JOIN Tender t ON b.tender_id = t.tender_id
       WHERE b.bidder_id = ?
       ORDER BY b.submission_date DESC`,
      [req.user.userId]
    );
    
    return res.json(bids);
  } catch (err) {
    console.error("Error fetching user bids:", err);
    return res.status(500).json({ error: "Failed to fetch your bids" });
  }
});

export default router;