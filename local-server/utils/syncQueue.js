const db = require('../db');

function addToSyncQueue(method, endpoint, payload, createdBy) {
  try {
    const stmt = db.prepare('INSERT INTO sync_queue (method, endpoint, payload, created_by) VALUES (?, ?, ?, ?)');
    stmt.run(method, endpoint, JSON.stringify(payload), createdBy);
    console.log(`[Sync Queue] Added ${method} ${endpoint} to queue.`);
  } catch (error) {
    console.error('[Sync Queue] Error adding to queue:', error);
  }
}

module.exports = { addToSyncQueue };
