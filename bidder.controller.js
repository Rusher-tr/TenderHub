import { z } from "zod";
import { db } from "../fort/db-client.js";
import { createBid, getBidsByBidder, getBidsByTender } from "../models/bidder.model.js";

const BidSchema = z.object({
  tenderId: z.coerce.number().int().positive(),
  amount: z.coerce.number()
    .positive("Bid amount must be positive")
    .max(1000000000, "Bid amount cannot exceed 1 billion")
    .min(1, "Bid amount must be at least 1")
});

export async function createBidHandler(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "Bidder") return res.status(403).json({ error: "Only bidders can place bids" });

    const { tenderId, amount } = BidSchema.parse(req.body);
    
    // Check if tender exists
    const [tender] = await db.execute(
      "SELECT tender_id FROM Tender WHERE tender_id = ?",
      [tenderId]
    );
    if (!tender.length) return res.status(404).json({ error: "Tender not found" });

    const bidId = await createBid(req.user.userId, tenderId, amount);
    return res.status(201).json({ bidId });

  } catch (err) {
    console.error("🔥 Bid Error:", err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getUserBids(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const bids = await getBidsByBidder(req.user.userId);
    return res.json(bids);
  } catch (err) {
    console.error("🔥 Get Bids Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getTenderBids(req, res) {
  try {
    const bids = await getBidsByTender(req.params.tenderId);
    return res.json(bids);
  } catch (err) {
    console.error("🔥 Get Tender Bids Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}