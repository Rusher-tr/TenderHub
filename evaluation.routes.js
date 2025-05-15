import { Router } from 'express';
import { authMiddleware } from '../fort/auth-middleware.js';
import { z } from 'zod';
import { db } from '../fort/db-client.js';

const router = Router();

// All evaluation routes require authentication
router.use(authMiddleware);

// Schema for evaluation
const EvaluationSchema = z.object({
  bidId: z.coerce.number().int().positive(),
  score: z.coerce.number().int().min(0).max(10)
});

// Score a bid
router.post('/', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== 'Evaluator') return res.status(403).json({ error: "Only evaluators can score bids" });
    
    // Validate request
    const { bidId, score } = EvaluationSchema.parse(req.body);
    
    // Check if bid exists
    const [bidResult] = await db.execute(
      "SELECT * FROM Bid WHERE bid_id = ?",
      [bidId]
    );
    
    if (bidResult.length === 0) {
      return res.status(404).json({ error: "Bid not found" });
    }
    
    // Create evaluation
    const [result] = await db.execute(
      "INSERT INTO Evaluation (bid_id, evaluator_id, score) VALUES (?, ?, ?)",
      [bidId, req.user.userId, score]
    );
    
    return res.status(201).json({
      success: true,
      message: "Bid evaluated successfully",
      evaluationId: result.insertId
    });
    
  } catch (err) {
    console.error("Error evaluating bid:", err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid evaluation data", details: err.errors });
    }
    return res.status(500).json({ error: "Failed to evaluate bid" });
  }
});

// Get evaluations for a bid
router.get('/bid/:bidId', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const { bidId } = req.params;
    
    const [evaluations] = await db.execute(
      `SELECT e.*, u.name as evaluator_name
       FROM Evaluation e
       JOIN User u ON e.evaluator_id = u.user_id
       WHERE e.bid_id = ?
       ORDER BY e.evaluated_at DESC`,
      [bidId]
    );
    
    return res.json(evaluations);
  } catch (err) {
    console.error("Error fetching evaluations:", err);
    return res.status(500).json({ error: "Failed to fetch evaluations" });
  }
});

export default router;
