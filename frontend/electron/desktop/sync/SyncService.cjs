const discoveryService = require('../discovery/DiscoveryService.cjs');
const eventStoreService = require('../services/EventStoreService.cjs');
const dbService = require('../database/DatabaseService.cjs');

class SyncService {
  constructor() {
    this.isOnline = false;
    this.peers = new Map();
    this.pollInterval = null;
  }

  /**
   * Initializes the sync service.
   */
  initialize() {
    console.log(`[SyncService] Initialized.`);
  }

  /**
   * Phase 4: Start background polling for events
   */
  startPolling() {
    if (this.pollInterval) return;
    
    console.log(`[SyncService] Starting P2P polling loop (every 10s)...`);
    this.pollInterval = setInterval(() => {
      // Phase 5: Fetch dynamically discovered peers from UDP broadcast
      const peers = discoveryService.getDiscoveredPeers();
      
      for (const peer of peers) {
        this.pollPeer(peer.ip);
      }
    }, 10000);
  }

  /**
   * Phase 4 & 7: Fetch events from a specific peer
   */
  async pollPeer(peerIp) {
    const db = dbService.getDb();
    
    // Phase 7: Fetch persistent sync state from SQLite
    const stateRecord = db.prepare('SELECT last_event_id FROM sync_state WHERE peer_id = ?').get(peerIp);
    const lastVersion = stateRecord ? stateRecord.last_event_id : 0;
    
    try {
      // Use native fetch to hit PeerApi
      const response = await fetch(`http://${peerIp}:5002/p2p/events?since=${lastVersion}`);
      if (!response.ok) return;
      
      const json = await response.json();
      if (json.success && json.data.length > 0) {
        console.log(`[SyncService] Found ${json.data.length} new events from peer ${peerIp}`);
        
        for (const event of json.data) {
          eventStoreService.saveRemoteEvent(event);
        }
        // Phase 7: Persist sync state to SQLite to survive app restarts
        const highestRowid = json.data[json.data.length - 1].rowid;
        db.prepare(`
          INSERT INTO sync_state (peer_id, last_event_id, last_sync_at) 
          VALUES (?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(peer_id) DO UPDATE SET 
            last_event_id = excluded.last_event_id,
            last_sync_at = excluded.last_sync_at
        `).run(peerIp, highestRowid);
      }
    } catch (err) {
      // Ignore network errors (peer offline) to avoid log spam
    }
  }

  /**
   * Stub for Phase 6: Broadcast an event to all connected peers.
   */
  broadcastEvent(event) {
    console.log(`[SyncService] (Stub) Broadcasting event: ${event.id} to peers.`);
  }

  /**
   * Stub for Phase 6: Handle an incoming event from a peer.
   */
  handleIncomingEvent(peerId, event) {
    console.log(`[SyncService] (Stub) Received event: ${event.id} from peer: ${peerId}`);
  }

  /**
   * Stub for Phase 7: Sync missing events when a peer reconnects.
   */
  syncWithPeer(peerId) {
    console.log(`[SyncService] (Stub) Starting sync with peer: ${peerId}`);
  }
}

// Export as a singleton
module.exports = new SyncService();
