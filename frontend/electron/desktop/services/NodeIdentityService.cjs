const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

class NodeIdentityService {
  constructor() {
    this.nodeId = null;
    this.cloudUrl = null;
    this.configPath = '';
  }

  initialize() {
    try {
      // app.getPath('userData') provides a safe, writable directory across all OS
      // Windows: C:\Users\<User>\AppData\Roaming\<AppName>
      const userDataPath = app.getPath('userData');
      const configDir = path.join(userDataPath, 'config');
      this.configPath = path.join(configDir, 'node.json');

      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      if (fs.existsSync(this.configPath)) {
        const data = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.nodeId = data.nodeId;
        this.cloudUrl = data.cloudUrl || null;
        console.log(`[NodeIdentityService] Loaded existing Node ID: ${this.nodeId}`);
      } else {
        this.nodeId = `node-${crypto.randomUUID()}`;
        this.cloudUrl = null;
        fs.writeFileSync(this.configPath, JSON.stringify({ nodeId: this.nodeId, cloudUrl: this.cloudUrl }, null, 2), 'utf8');
        console.log(`[NodeIdentityService] Generated new Node ID: ${this.nodeId}`);
      }
    } catch (error) {
      console.error('[NodeIdentityService] Failed to initialize node identity:', error);
      // Fallback in case of catastrophic file system failure
      this.nodeId = `node-fallback-${Date.now()}`;
    }
  }

  getNodeId() {
    if (!this.nodeId) {
      throw new Error('NodeIdentityService not initialized. Call initialize() first.');
    }
    return this.nodeId;
  }

  getCloudUrl() {
    return this.cloudUrl;
  }

  setCloudUrl(url) {
    this.cloudUrl = url;
    const data = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    data.cloudUrl = url;
    fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2), 'utf8');
  }
}

// Export as singleton
module.exports = new NodeIdentityService();
