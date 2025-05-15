import { db } from "../fort/db-client.js";

export async function createBid(bidderId, tenderId, amount) {
  const [result] = await db.execute(
    `INSERT INTO Bid 
    (tender_id, bidder_id, amount, status)
    VALUES (?, ?, ?, 'Submitted')`,
    [tenderId, bidderId, amount]
  );
  return result.insertId;
}

export async function getBidsByBidder(bidderId) {
  const [rows] = await db.execute(
    `SELECT b.bid_id, t.title, b.amount, b.submission_date, b.status 
     FROM Bid b
     JOIN Tender t ON b.tender_id = t.tender_id
     WHERE b.bidder_id = ?`,
    [bidderId]
  );
  return rows;
}

export async function getBidsByTender(tenderId) {
  const [rows] = await db.execute(
    "SELECT bid_id, bidder_id, amount, submission_date, status FROM Bid WHERE tender_id = ?",
    [tenderId]
  );
  return rows;
}