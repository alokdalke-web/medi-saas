const databaseService = require('../database/DatabaseService.cjs');
const eventStoreService = require('./EventStoreService.cjs');
const ipcNotifier = require('../api/IpcNotifier.cjs');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

class CloudSyncService {
  constructor() {
    this.intervalId = null;
    this.syncStateFile = path.join(app.getPath('userData'), 'cloud_sync_state.json');
  }

  getCloudApiUrl() {
    const nodeIdentityService = require('./NodeIdentityService.cjs');
    return nodeIdentityService.getCloudUrl() || process.env.CLOUD_API_URL || 'http://localhost:5000/api/v1/sync';
  }

  start() {
    console.log('[CloudSync] Starting background sync to cloud...');
    // Sync every 10 seconds
    this.intervalId = setInterval(() => {
      this.performSync();
    }, 10000);
    
    // Do an immediate sync on startup
    this.performSync();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async performSync() {
    try {
      await this.pushEvents();
      await this.pullEvents();
    } catch (err) {
      console.error('[CloudSync] Sync failed:', err.message);
    }
  }

  async pushEvents() {
    const db = databaseService.getDb();
    
    // Get all events that haven't been synced to the cloud yet
    const pendingEvents = db.prepare('SELECT * FROM events WHERE cloud_synced = 0 ORDER BY created_at ASC').all();
    
    if (pendingEvents.length === 0) return;

    console.log(`[CloudSync] Pushing ${pendingEvents.length} events to cloud...`);

    try {
      const apiUrl = this.getCloudApiUrl();
      const response = await fetch(`${apiUrl}/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: pendingEvents })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      
      if (result.status === 'success') {
        // Mark these events as cloud synced locally
        const markSynced = db.prepare('UPDATE events SET cloud_synced = 1 WHERE id = ?');
        const transaction = db.transaction((events) => {
          for (const event of events) {
            markSynced.run(event.id);
          }
        });
        transaction(pendingEvents);
        console.log(`[CloudSync] Successfully pushed ${result.processed} events.`);
      }
    } catch (error) {
      console.error('[CloudSync] Failed to push events:', error.message);
    }
  }

  async pullEvents() {
    let lastSyncDate = '0';
    if (fs.existsSync(this.syncStateFile)) {
      try {
        const state = JSON.parse(fs.readFileSync(this.syncStateFile, 'utf8'));
        lastSyncDate = state.lastSyncDate || '0';
      } catch (e) {}
    }

    try {
      const apiUrl = this.getCloudApiUrl();
      const response = await fetch(`${apiUrl}/pull?since=${encodeURIComponent(lastSyncDate)}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const result = await response.json();
      const events = result.events || [];

      if (events.length > 0) {
        console.log(`[CloudSync] Pulled ${events.length} new events from cloud.`);
        
        let newestDate = lastSyncDate;

        for (const event of events) {
          try {
            const db = databaseService.getDb();
            const existing = db.prepare('SELECT id FROM events WHERE id = ?').get(event.id);

            if (existing) {
              db.prepare('UPDATE events SET cloud_synced = 1 WHERE id = ?').run(event.id);
            } else {
              // Apply remote event to local database
              eventStoreService.applyRemoteEvent(event);
              db.prepare('UPDATE events SET cloud_synced = 1 WHERE id = ?').run(event.id);
            }

            if (new Date(event.created_at) > new Date(newestDate === '0' ? 0 : newestDate)) {
              newestDate = event.created_at;
            }
          } catch (e) {
            console.error(`[CloudSync] Error applying pulled event ${event.id}:`, e.message);
          }
        }

        // Save new state
        fs.writeFileSync(this.syncStateFile, JSON.stringify({ lastSyncDate: newestDate }));
        
        // Notify frontend that we pulled new data so UI can refresh
        ipcNotifier.notifyFrontend('p2p-sync-update', { source: 'cloud' });
      }
    } catch (error) {
      console.error('[CloudSync] Failed to pull events:', error.message);
    }
  }
}

module.exports = new CloudSyncService();
