const os = require('os');
const dgram = require('dgram');
const nodeIdentityService = require('../services/NodeIdentityService.cjs');

class DiscoveryService {
  constructor() {
    this.peers = new Map();
    this.socket = null;
    this.broadcastInterval = null;
    this.PORT = 5000;
  }

  /**
   * Helper to get the local IP address
   */
  getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return '127.0.0.1';
  }

  /**
   * Initializes the UDP discovery service.
   */
  initialize() {
    this.socket = dgram.createSocket('udp4');

    this.socket.on('error', (err) => {
      console.error(`[DiscoveryService] UDP Error:\n${err.stack}`);
      this.socket.close();
    });

    this.socket.on('message', (msg, rinfo) => {
      try {
        const peerData = JSON.parse(msg.toString());
        const myNodeId = nodeIdentityService.getNodeId();

        // Ignore our own broadcasts
        if (peerData.nodeId && peerData.nodeId !== myNodeId) {
          if (!this.peers.has(peerData.nodeId)) {
            console.log(`[DiscoveryService] Discovered new peer: ${peerData.nodeId} at ${peerData.ip}`);
          }
          // Save or update peer (also acts as a heartbeat if we added lastSeen)
          this.peers.set(peerData.nodeId, {
            nodeId: peerData.nodeId,
            ip: peerData.ip,
            lastSeen: Date.now()
          });
        }
      } catch (err) {
        // Ignore invalid UDP noise
      }
    });

    this.socket.on('listening', () => {
      const address = this.socket.address();
      console.log(`[DiscoveryService] UDP Server listening on port ${address.port}`);
      this.socket.setBroadcast(true);
      this.startBroadcasting();
    });

    // Phase 12: Allow multiple local testing processes to bind to the same UDP port
    this.socket.bind({ port: this.PORT, address: '0.0.0.0', exclusive: false });
  }

  /**
   * Start broadcasting this node's presence on the LAN.
   */
  startBroadcasting() {
    if (this.broadcastInterval) return;

    this.broadcastInterval = setInterval(() => {
      try {
        const myNodeId = nodeIdentityService.getNodeId();
        const myIp = this.getLocalIp();
        
        const message = Buffer.from(JSON.stringify({
          nodeId: myNodeId,
          ip: myIp
        }));

        this.socket.send(message, 0, message.length, this.PORT, '255.255.255.255', (err) => {
          if (err) console.error('[DiscoveryService] Broadcast error:', err);
        });
      } catch (e) {
        // Handle case where NodeIdentityService isn't fully ready yet
      }
    }, 5000); // Broadcast every 5 seconds
  }

  /**
   * Returns a list of currently discovered peers.
   */
  getDiscoveredPeers() {
    return Array.from(this.peers.values());
  }
}

// Export as a singleton
module.exports = new DiscoveryService();
