// controllers/tender.controller.js
import { z } from "zod";
import { db } from "../fort/db-client.js";
import { createTender, getTendersByUser, getTenderById, updateTenderStatus, getAllTenders } from "../models/tender.model.js";

// Inline validation schema
const TenderSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  issue_date: z.coerce.date(),
  deadline: z.coerce.date(),
  status: z.enum(['Draft', 'Pending Approval', 'Published', 'Rejected', 'Archived']).optional().default('Pending Approval')
});

const StatusUpdateSchema = z.object({
  status: z.enum(['Draft', 'Pending Approval', 'Published', 'Rejected', 'Archived'])
});

// Schema for updating tender status
const UpdateStatusSchema = z.object({
  status: z.enum(['Pending Approval', 'Published', 'Rejected', 'Archived'])
});

export async function createTenderHandler(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "Buyer") return res.status(403).json({ error: "Only buyers can create tenders" });
    
    console.log("📨 Creating tender with data:", req.body);
    const tenderData = TenderSchema.parse(req.body);
    
    const issueDate = new Date(tenderData.issue_date);
    const deadline = new Date(tenderData.deadline);
    const today = new Date();
    
    if (isNaN(issueDate.getTime())) {
      return res.status(400).json({ error: "Invalid issue date format" });
    }
    
    if (isNaN(deadline.getTime())) {
      return res.status(400).json({ error: "Invalid deadline format" });
    }

    // Advanced validation
    if (deadline <= issueDate) {
      return res.status(400).json({ error: "Deadline must be after issue date" });
    }

    if (deadline <= today) {
      return res.status(400).json({ error: "Deadline must be in the future" });
    }

    // Minimum time between issue date and deadline (e.g., 7 days)
    const minDays = 7;
    const daysDifference = Math.ceil((deadline - issueDate) / (1000 * 60 * 60 * 24));
    
    if (daysDifference < minDays) {
      return res.status(400).json({ 
        error: `Deadline must be at least ${minDays} days after issue date` 
      });
    }

    // Force status to Pending Approval
    tenderData.status = 'Pending Approval';

    const tenderId = await createTender(req.user.userId, tenderData);
    console.log("✅ Created tender with ID:", tenderId);
    return res.status(201).json({ 
      tenderId, 
      message: "Tender created successfully and sent for approval" 
    });

  } catch (err) {
    console.error("🔥 Tender Error:", err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getUserTenders(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const tenders = await getTendersByUser(req.user.userId);
    return res.json(tenders);
  } catch (err) {
    console.error("🔥 Get Tenders Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getTenderDetails(req, res) {
  try {
    const tender = await getTenderById(req.params.tenderId);
    if (!tender) return res.status(404).json({ error: "Tender not found" });
    return res.json(tender);
  } catch (err) {
    console.error("🔥 Get Tender Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// PATCH: Update tender status
export async function updateTenderStatusHandler(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "Admin") return res.status(403).json({ error: "Only administrators can update tender status" });
    
    const { tenderId } = req.params;
    
    // Validate request body
    const { status } = UpdateStatusSchema.parse(req.body);
    
    // Update tender status in database
    const [result] = await db.execute(
      "UPDATE Tender SET status = ? WHERE tender_id = ?",
      [status, tenderId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Tender not found" });
    }
    
    res.json({ success: true, message: "Tender status updated successfully", status });
  } catch (err) {
    console.error("Error updating tender status:", err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid status value", details: err.errors });
    }
    res.status(500).json({ error: "Failed to update tender status" });
  }
}

export async function getAllTendersHandler(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== "Admin") return res.status(403).json({ error: "Admin access required" });
    
    const tenders = await getAllTenders();
    return res.json(tenders);
  } catch (err) {
    console.error("🔥 Get All Tenders Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function getPublishedTendersHandler(req, res) {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    
    const [tenders] = await db.execute(
      `SELECT t.tender_id, t.title, t.description, t.issue_date, t.deadline, 
              t.status, t.user_id, u.name as buyer_name
       FROM Tender t
       JOIN User u ON t.user_id = u.user_id
       WHERE t.status = 'Published'
       ORDER BY t.deadline ASC`
    );
    
    // For each tender, get bids made by the current user
    for (let tender of tenders) {
      const [bids] = await db.execute(
        `SELECT b.*, u.name as bidder_name 
         FROM Bid b
         JOIN User u ON b.bidder_id = u.user_id
         WHERE b.tender_id = ? AND b.bidder_id = ?`,
        [tender.tender_id, req.user.userId]
      );
      
      tender.bids = bids || [];
    }
    
    return res.json(tenders);
  } catch (err) {
    console.error("Error fetching published tenders:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}