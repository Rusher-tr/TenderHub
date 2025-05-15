// models/tender.model.js
import { db } from "../fort/db-client.js";

export async function createTender(userId, { title, description, issue_date, deadline, status }) {
  const [result] = await db.execute(
    `INSERT INTO Tender 
    (user_id, title, description, issue_date, deadline, status)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, title, description, issue_date, deadline, status || 'Draft']
  );
  return result.insertId;
}

export async function getTendersByUser(userId) {
  const [rows] = await db.execute(
    "SELECT tender_id, title, description, issue_date, deadline, status FROM Tender WHERE user_id = ?",
    [userId]
  );
  return rows;
}

export async function getTenderById(tenderId) {
  const [rows] = await db.execute(
    "SELECT * FROM Tender WHERE tender_id = ?",
    [tenderId]
  );
  return rows[0];
}

export async function updateTenderStatus(tenderId, status) {
  // Validate status to ensure it matches the allowed values in the database
  const validStatuses = ['Draft', 'Pending Approval', 'Published', 'Rejected', 'Archived'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status value: ${status}. Must be one of: ${validStatuses.join(', ')}`);
  }
  
  const [result] = await db.execute(
    "UPDATE Tender SET status = ? WHERE tender_id = ?",
    [status, tenderId]
  );
  
  console.log(`Updated tender ${tenderId} status to ${status}. Affected rows: ${result.affectedRows}`);
  return result.affectedRows > 0;
}

export async function getAllTenders() {
  const [rows] = await db.execute(
    "SELECT t.tender_id, t.title, t.description, t.issue_date, t.deadline, t.status, t.user_id, u.name as buyer_name FROM Tender t JOIN User u ON t.user_id = u.user_id ORDER BY t.created_at DESC"
  );
  return rows;
}

// Get published tenders
export async function getPublishedTenders() {
  const [rows] = await db.execute(
    `SELECT t.tender_id, t.title, t.description, t.issue_date, t.deadline, t.status, 
            t.user_id, u.name as buyer_name 
     FROM Tender t 
     JOIN User u ON t.user_id = u.user_id 
     WHERE t.status = 'Published' 
     ORDER BY t.deadline ASC`
  );
  
  return rows;
}

// Check and auto-archive expired tenders
export async function archiveExpiredTenders() {
  const today = new Date().toISOString().split('T')[0];
  
  // Update tenders with passed deadlines to Archived
  const [result] = await db.execute(
    "UPDATE Tender SET status = 'Archived' WHERE deadline < ? AND status IN ('Published', 'Pending Approval', 'Draft')",
    [today]
  );
  
  // Log archive activity for monitoring
  console.log(`Auto-archive check completed at ${new Date().toISOString()}`);
  console.log(`${result.affectedRows} tenders auto-archived due to passed deadline`);
  
  return result.affectedRows;
}