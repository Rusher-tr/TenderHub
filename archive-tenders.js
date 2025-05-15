// utils/archive-tenders.js
import { db } from "../fort/db-client.js";
import { getAllTenders, updateTenderStatus } from "../models/tender.model.js";

/**
 * Automatically archives tenders that have passed their deadline
 * @returns {Promise<{archived: number, errors: number}>} Count of archived tenders and errors
 */
export async function archiveExpiredTenders() {
  console.log("🗄️ Checking for expired tenders to archive...");
  let archived = 0;
  let errors = 0;
  
  try {
    // Get all published tenders
    const tenders = await getAllTenders();
    const today = new Date();
    
    // Filter to find tenders that are published and past deadline
    const expiredTenders = tenders.filter(tender => 
      tender.status === 'Published' && 
      new Date(tender.deadline) < today
    );
    
    if (expiredTenders.length === 0) {
      console.log("✅ No expired tenders found to archive");
      return { archived, errors };
    }
    
    console.log(`🗄️ Found ${expiredTenders.length} expired tenders to archive`);
    
    // Update each expired tender to Archived status
    for (const tender of expiredTenders) {
      try {
        await updateTenderStatus(tender.id, 'Archived');
        archived++;
        console.log(`✅ Archived tender: ${tender.id} - ${tender.title}`);
      } catch (err) {
        errors++;
        console.error(`❌ Failed to archive tender ${tender.id}:`, err);
      }
    }
    
    console.log(`🗄️ Archived ${archived} tenders with ${errors} errors`);
    return { archived, errors };
  } catch (err) {
    console.error("🔥 Error in archive process:", err);
    throw err;
  }
}

/**
 * Schedule auto-archiving to run at regular intervals
 * @param {number} intervalMinutes How often to run archiving (in minutes)
 */
export function scheduleAutoArchiving(intervalMinutes = 60) {
  console.log(`⏰ Scheduling auto-archiving to run every ${intervalMinutes} minutes`);
  
  // Run immediately on startup
  archiveExpiredTenders().catch(err => {
    console.error("🔥 Error in initial archive run:", err);
  });
  
  // Schedule recurring runs
  const intervalMs = intervalMinutes * 60 * 1000;
  return setInterval(() => {
    archiveExpiredTenders().catch(err => {
      console.error("🔥 Error in scheduled archive run:", err);
    });
  }, intervalMs);
}
