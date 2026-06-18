const http = require('http');
const dbService = require('../database/DatabaseService.cjs');

class PeerApi {
  constructor() {
    this.port = process.env.PEER_PORT ? parseInt(process.env.PEER_PORT) : 5002;
    this.server = null;
  }

  initialize() {
    this.server = http.createServer((req, res) => {
      // Set CORS headers so browser-based peers or tools can hit this if needed
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');

      const url = new URL(req.url, `http://${req.headers.host}`);

      if (url.pathname === '/p2p/events' && req.method === 'GET') {
        try {
          const since = parseInt(url.searchParams.get('since') || '0', 10);
          const db = dbService.getDb();
          
          // Use SQLite's internal auto-incrementing rowid to fetch new events safely
          const events = db.prepare(`
            SELECT rowid, id, node_id, event_type, entity_type, entity_id, payload, version, created_at 
            FROM events 
            WHERE rowid > ? 
            ORDER BY rowid ASC
          `).all(since);

          res.writeHead(200);
          res.end(JSON.stringify({ success: true, data: events }));
        } catch (error) {
          console.error('[PeerApi] Error fetching events:', error);
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: 'Internal Server Error' }));
        }
        return;
      }

      // 404 for anything else
      res.writeHead(404);
      res.end(JSON.stringify({ success: false, error: 'Not Found' }));
    });

    this.server.listen(this.port, '0.0.0.0', () => {
      console.log(`[PeerApi] P2P Server listening on port ${this.port} across all LAN interfaces`);
    });
  }
}

module.exports = new PeerApi();
