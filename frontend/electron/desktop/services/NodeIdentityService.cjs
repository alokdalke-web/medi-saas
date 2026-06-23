const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

let nodeId = null;
let cloudUrl = null;
let configPath = '';

function initialize() {
    try {
      // app.getPath('userData') provides a safe, writable directory across all OS
      // Windows: C:\Users\<User>\AppData\Roaming\<AppName>
      const userDataPath = app.getPath('userData');
      const configDir = path.join(userDataPath, 'config');
      configPath = path.join(configDir, 'node.json');

      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      if (fs.existsSync(configPath)) {
        const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        nodeId = data.nodeId;
        cloudUrl = data.cloudUrl || null;
        console.log(`[NodeIdentityService] Loaded existing Node ID: ${nodeId}`);
      } else {
        nodeId = `node-${crypto.randomUUID()}`;
        cloudUrl = null;
        fs.writeFileSync(configPath, JSON.stringify({ nodeId: nodeId, cloudUrl: cloudUrl }, null, 2), 'utf8');
        console.log(`[NodeIdentityService] Generated new Node ID: ${nodeId}`);
      }
    } catch (error) {
      console.error('[NodeIdentityService] Failed to initialize node identity:', error);
      // Fallback in case of catastrophic file system failure
      nodeId = `node-fallback-${Date.now()}`;
    }
  }

function getNodeId() {
  if (!nodeId) {
    throw new Error('NodeIdentityService not initialized. Call initialize() first.');
  }
  return nodeId;
}

function getCloudUrl() {
  return cloudUrl;
}

function setCloudUrl(url) {
  cloudUrl = url;
  const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  data.cloudUrl = url;
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  initialize,
  getNodeId,
  getCloudUrl,
  setCloudUrl
};
