const dbService = require('../database/DatabaseService.cjs');
const crypto = require('crypto');

class AuditService {
  constructor() {
    this.nodeId = 'PENDING_NODE_ID';
  }

  /**
   * Initializes the audit service.
   * @param {string} nodeId - The unique identity of this node.
   */
  initialize(nodeId) {
    this.nodeId = nodeId;
    console.log(`[AuditService] Initialized.`);
  }

  /**
   * Phase 9: Logs an action to the audit_logs table.
   */
  logAction(userId, action, entity) {
    const db = dbService.getDb();
    const logId = crypto.randomUUID();
    
    try {
      db.prepare(`
        INSERT INTO audit_logs (id, user_id, node_id, action, entity)
        VALUES (?, ?, ?, ?, ?)
      `).run(logId, userId, this.nodeId, action, entity);
      
      console.log(`[AuditService] Logged: User ${userId} performed ${action} on ${entity}`);
    } catch (err) {
      console.error('[AuditService] Failed to insert audit log:', err);
    }
    
    return logId;
  }
}

// Export as a singleton
module.exports = new AuditService();
