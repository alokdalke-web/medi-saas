const path = require('path');
const fs = require('fs');

// 1. Mock Electron for Headless Node.js execution
const mockUserData = path.join(__dirname, 'test-data');
if (!fs.existsSync(mockUserData)) fs.mkdirSync(mockUserData);

const electronMock = {
  app: {
    getPath: (name) => name === 'userData' ? mockUserData : __dirname,
    isPackaged: false
  },
  BrowserWindow: class {
    static getAllWindows() { return []; }
  },
  ipcMain: { handle: () => {} }
};

// Intercept 'electron' requires
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function() {
  if (arguments[0] === 'electron') return electronMock;
  return originalRequire.apply(this, arguments);
};

// 2. Import Services (now safely mocked)
const dbService = require('../electron/desktop/database/DatabaseService.cjs');
const nodeIdentityService = require('../electron/desktop/services/NodeIdentityService.cjs');
const eventStoreService = require('../electron/desktop/services/EventStoreService.cjs');
const syncService = require('../electron/desktop/sync/SyncService.cjs');
const discoveryService = require('../electron/desktop/discovery/DiscoveryService.cjs');
const auditService = require('../electron/desktop/services/AuditService.cjs');
const peerApi = require('../electron/desktop/api/PeerApi.cjs');
const dataMigrationTool = require('../electron/desktop/tools/DataMigrationTool.cjs');

// 3. Initialize Runtime
dbService.initialize();
nodeIdentityService.initialize();
const nodeId = nodeIdentityService.getNodeId();
dataMigrationTool.runMigration(nodeId);
eventStoreService.initialize(nodeId);
syncService.initialize();
peerApi.initialize();
syncService.startPolling();
discoveryService.initialize();
auditService.initialize(nodeId);

console.log(`[HeadlessNode] Started Node: ${nodeId} | DB: ${process.env.DB_NAME} | Port: ${process.env.PEER_PORT}`);

// 4. Listen for IPC Commands from Test Runner
process.on('message', (msg) => {
  if (msg.type === 'CREATE_CLINIC') {
    const id = 'test-clinic-' + Date.now();
    eventStoreService.saveEvent('ClinicCreated', 'clinics', id, { name: 'E2E Sync Clinic' }, 0, 'test_runner');
    process.send({ type: 'CLINIC_CREATED', id });
  }
  
  if (msg.type === 'CHECK_CLINIC') {
    const db = dbService.getDb();
    const clinic = db.prepare('SELECT * FROM clinics WHERE id = ?').get(msg.id);
    process.send({ type: 'CLINIC_RESULT', clinic });
  }

  if (msg.type === 'SHUTDOWN') {
    console.log(`[HeadlessNode] Shutting down Node: ${nodeId}`);
    process.exit(0);
  }
});
