import { db } from "../fort/db-client.js";

export async function createEvaluation(bidId, evaluatorId, score) {
  const [result] = await db.execute(
    `INSERT INTO Evaluation 
    (bid_id, evaluator_id, score)
    VALUES (?, ?, ?)`,
    [bidId, evaluatorId, score]
  );
  return result.insertId;
}

export async function getEvaluationsByEvaluator(evaluatorId) {
  const [rows] = await db.execute(
    `SELECT e.evaluation_id, b.amount, e.score, t.title 
     FROM Evaluation e
     JOIN Bid b ON e.bid_id = b.bid_id
     JOIN Tender t ON b.tender_id = t.tender_id
     WHERE e.evaluator_id = ?`,
    [evaluatorId]
  );
  return rows;
}

export async function getEvaluationsByBid(bidId) {
  const [rows] = await db.execute(
    "SELECT evaluation_id, evaluator_id, score, evaluated_at FROM Evaluation WHERE bid_id = ?",
    [bidId]
  );
  return rows;
}