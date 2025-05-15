import { z } from "zod";
import { db } from "../fort/db-client.js";
import { createEvaluation, getEvaluationsByEvaluator, getEvaluationsByBid } from "../models/evaluator.model.js";

const EvaluationSchema = z.object({
  bidId: z.coerce.number().int().positive(),
  score: z.number().int().min(0).max(10)
});

export async function createEvaluationHandler(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "Evaluator") return res.status(403).json({ error: "Only evaluators can submit evaluations" });

    const { bidId, score } = EvaluationSchema.parse(req.body);

    // Check if bid exists and not owned by evaluator
    const [bid] = await db.execute(
      `SELECT b.bidder_id 
       FROM Bid b
       WHERE b.bid_id = ?`,
      [bidId]
    );
    if (!bid.length) return res.status(404).json({ error: "Bid not found" });
    if (bid[0].bidder_id === req.user.userId) {
      return res.status(403).json({ error: "Cannot evaluate your own bid" });
    }

    const evaluationId = await createEvaluation(bidId, req.user.userId, score);
    return res.status(201).json({ evaluationId });

  } catch (err) {
    console.error("🔥 Evaluation Error:", err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getMyEvaluations(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const evaluations = await getEvaluationsByEvaluator(req.user.userId);
    return res.json(evaluations);
  } catch (err) {
    console.error("🔥 Get Evaluations Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getBidEvaluations(req, res) {
  try {
    const evaluations = await getEvaluationsByBid(req.params.bidId);
    return res.json(evaluations);
  } catch (err) {
    console.error("🔥 Get Bid Evaluations Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}