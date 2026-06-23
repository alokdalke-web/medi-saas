const os = require('os');
const dgram = require('dgram');
const nodeIdentityService = require('../services/NodeIdentityService.cjs');

let peers = new Map();
let socket = null;
let broadcastInterval = null;
const PORT = 5000;

/**
 * Helper to get the local IP address
 */
function getLocalIp() {
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
function initialize() {
  socket = dgram.createSocket('udp4');

  socket.on('error', (err) => {
    console.error(`[DiscoveryService] UDP Error:\n${err.stack}`);
    socket.close();
  });

  socket.on('message', (msg, rinfo) => {
      try {
        const peerData = JSON.parse(msg.toString());
        const myNodeId = nodeIdentityService.getNodeId();

      // Ignore our own broadcasts
      if (peerData.nodeId && peerData.nodeId !== myNodeId) {
        if (!peers.has(peerData.nodeId)) {
          console.log(`[DiscoveryService] Discovered new peer: ${peerData.nodeId} at ${peerData.ip}`);
        }
        // Save or update peer (also acts as a heartbeat if we added lastSeen)
        peers.set(peerData.nodeId, {
          nodeId: peerData.nodeId,
          ip: peerData.ip,
          lastSeen: Date.now()
        });
      }
    } catch (err) {
      // Ignore invalid UDP noise
    }
  });

  socket.on('listening', () => {
    const address = socket.address();
    console.log(`[DiscoveryService] UDP Server listening on port ${address.port}`);
    socket.setBroadcast(true);
    startBroadcasting();
  });

  // Phase 12: Allow multiple local testing processes to bind to the same UDP port
  socket.bind({ port: PORT, address: '0.0.0.0', exclusive: false });
  
  // Prune stale peers every 30 seconds
  setInterval(() => {
    const now = Date.now();
    for (const [peerId, peer] of peers.entries()) {
      if (now - peer.lastSeen > 60000) {
        console.log(`[Discovery] Peer ${peerId} timed out. Evicting from active list.`);
        peers.delete(peerId);
      }
    }
    }, 30000);
  }

/**
 * Start broadcasting this node's presence on the LAN.
 */
function startBroadcasting() {
  if (broadcastInterval) return;

  broadcastInterval = setInterval(() => {
    try {
      const myNodeId = nodeIdentityService.getNodeId();
      const myIp = getLocalIp();
      
      const message = Buffer.from(JSON.stringify({
        nodeId: myNodeId,
        ip: myIp
      }));

      socket.send(message, 0, message.length, PORT, '255.255.255.255', (err) => {
        if (err) console.error('[DiscoveryService] Broadcast error:', err);
      });
    } catch (e) {
      // Handle case where NodeIdentityService isn't fully ready yet
    }
  }, 5000); // Broadcast every 5 seconds
}

/**
 * Returns a list of currently discovered peers.
 * @returns {Array} Array of peer objects {nodeId, ip}
 */
function getDiscoveredPeers() {
  return Array.from(peers.values());
}

module.exports = {
  initialize,
  startBroadcasting,
  getDiscoveredPeers
};
