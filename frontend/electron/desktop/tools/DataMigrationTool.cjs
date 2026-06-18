const dbService = require('../database/DatabaseService.cjs');
const crypto = require('crypto');

class DataMigrationTool {
  constructor() {
    this.migratedCount = 0;
  }

  /**
   * Phase 11: Runs the data migration to convert legacy relational records into events.
   * @param {string} nodeId - The identity of the local node.
   */
  runMigration(nodeId) {
    console.log('[DataMigrationTool] Starting legacy data migration...');
    
    try {
      const db = dbService.getDb();
      
      // Start a transaction so migration is atomic
      const transaction = db.transaction(() => {
        this.migrateTable(db, nodeId, 'clinics', 'ClinicCreated');
        this.migrateTable(db, nodeId, 'users', 'UserCreated');
        this.migrateTable(db, nodeId, 'patients', 'PatientCreated');
        this.migrateTable(db, nodeId, 'doctors', 'DoctorCreated');
        this.migrateTable(db, nodeId, 'appointments', 'AppointmentCreated');
      });

      transaction();
      
      console.log(`[DataMigrationTool] Migration complete. Generated ${this.migratedCount} retroactive events.`);
    } catch (err) {
      console.error('[DataMigrationTool] Migration failed:', err);
    }
  }

  /**
   * Helper to migrate a specific table.
   */
  migrateTable(db, nodeId, tableName, eventType) {
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    
    for (const row of rows) {
      // Check if an event already exists for this entity
      const existing = db.prepare(`
        SELECT id FROM events 
        WHERE entity_id = ? AND event_type = ?
      `).get(row.id, eventType);
      
      if (!existing) {
        const eventId = crypto.randomUUID();
        
        // Generate a retroactive event directly into the ledger
        db.prepare(`
          INSERT INTO events (id, node_id, event_type, entity_type, entity_id, payload, version, synced)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          eventId,
          nodeId,
          eventType,
          tableName,
          row.id,
          JSON.stringify(row),
          1, // Start at version 1
          0  // Mark as unsynced so the SyncService will broadcast it!
        );
        
        this.migratedCount++;
        console.log(`[DataMigrationTool] Migrated legacy ${tableName} record: ${row.id}`);
      }
    }
  }
}

// Export as singleton
module.exports = new DataMigrationTool();
