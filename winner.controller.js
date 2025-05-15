// controllers/winner.controller.js
import { z } from "zod";
import { db } from "../fort/db-client.js";
import { updateTenderStatus } from "../models/tender.model.js";

const WinnerSelectionSchema = z.object({
  tenderId: z.coerce.number().int().positive(),
  bidId: z.coerce.number().int().positive()
});

/**
 * Selects a winning bid for a tender
 */
export async function selectWinningBidHandler(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "Admin") return res.status(403).json({ error: "Only administrators can select winning bids" });

    const { tenderId, bidId } = WinnerSelectionSchema.parse(req.body);

    // Verify the tender exists and is in Published status
    const [tenderResult] = await db.execute(
      `SELECT status FROM Tender WHERE tender_id = ?`,
      [tenderId]
    );
    
    if (!tenderResult.length) {
      return res.status(404).json({ error: "Tender not found" });
    }
    
    if (tenderResult[0].status !== 'Published') {
      return res.status(400).json({ 
        error: "Cannot select winner for tender that is not in Published status" 
      });
    }
    
    // Verify the bid exists and belongs to this tender
    const [bidResult] = await db.execute(
      `SELECT b.bid_id, b.bidder_id, b.amount, u.username AS bidder_name
       FROM Bid b
       JOIN User u ON b.bidder_id = u.user_id
       WHERE b.bid_id = ? AND b.tender_id = ?`,
      [bidId, tenderId]
    );
    
    if (!bidResult.length) {
      return res.status(404).json({ 
        error: "Bid not found or doesn't belong to this tender" 
      });
    }
    
    // Get the average score of this bid from evaluations
    const [scoreResult] = await db.execute(
      `SELECT AVG(score) AS avg_score
       FROM Evaluation
       WHERE bid_id = ?`,
      [bidId]
    );
    
    const avgScore = scoreResult[0].avg_score || 0;
    
    // Begin transaction
    await db.beginTransaction();    
    try {
      // Mark this bid as the winner by setting status to 'Locked'
      await db.execute(
        `UPDATE Bid SET status = 'Locked' WHERE bid_id = ?`,
        [bidId]
      );
      
      // Update tender status to "Completed"
      await db.execute(
        `UPDATE Tender SET status = 'Archived'
         WHERE tender_id = ?`,
        [tenderId]
      );
      
      await db.commit();
      
      return res.status(200).json({
        message: "Winning bid selected successfully",
        winningBid: {
          bidId: bidResult[0].bid_id,
          bidderId: bidResult[0].bidder_id,
          bidderName: bidResult[0].bidder_name,
          amount: bidResult[0].amount,
          score: avgScore
        }
      });
    } catch (err) {
      await db.rollback();
      throw err;
    }
  } catch (err) {
    console.error("🔥 Select Winner Error:", err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Gets all winners for admin dashboard
 */
export async function getAllWinnersHandler(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "Admin") return res.status(403).json({ error: "Only administrators can view all winners" });
    
    // Fix the SQL query to use the correct field names
    const [winners] = await db.execute(
      `SELECT 
         t.tender_id, t.title AS tender_title, 
         t.deadline AS selected_date,
         b.bid_id, b.amount AS bid_amount, 
         u.user_id AS bidder_id, u.name AS bidder_name,
         (SELECT AVG(score) FROM Evaluation e WHERE e.bid_id = b.bid_id) AS avg_score
       FROM Tender t
       JOIN Bid b ON t.tender_id = b.tender_id
       JOIN User u ON b.bidder_id = u.user_id
       WHERE b.status = 'Locked'
       ORDER BY t.deadline DESC`
    );
    
    // If no winners found, return empty array instead of error
    return res.json(winners || []);
  } catch (err) {
    console.error("🔥 Get Winners Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

/**
 * Gets winner for a specific tender
 */
export async function getTenderWinnerHandler(req, res) {
  try {
    const { tenderId } = req.params;
    
    const [winner] = await db.execute(
      `SELECT 
         b.bid_id, b.amount, 
         u.user_id AS bidder_id, u.username AS bidder_name,
         (SELECT AVG(score) FROM Evaluation e WHERE e.bid_id = b.bid_id) AS avg_score
       FROM Bid b
       JOIN User u ON b.bidder_id = u.user_id
       WHERE b.tender_id = ? AND b.is_winner = 1`,
      [tenderId]
    );
    
    if (!winner.length) {
      return res.status(404).json({ error: "No winner selected for this tender" });
    }
    
    return res.json(winner[0]);
  } catch (err) {
    console.error("🔥 Get Tender Winner Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
