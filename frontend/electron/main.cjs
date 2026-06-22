const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Local Runtime Layer Services
const dbService = require('./desktop/database/DatabaseService.cjs');
const nodeIdentityService = require('./desktop/services/NodeIdentityService.cjs');
const eventStoreService = require('./desktop/services/EventStoreService.cjs');
const discoveryService = require('./desktop/discovery/DiscoveryService.cjs');
const syncService = require('./desktop/sync/SyncService.cjs');
const cloudSyncService = require('./desktop/services/CloudSyncService.cjs');
const auditService = require('./desktop/services/AuditService.cjs');
const localApi = require('./desktop/api/LocalApi.cjs');
const peerApi = require('./desktop/api/PeerApi.cjs');
const dataMigrationTool = require('./desktop/tools/DataMigrationTool.cjs');

// Determine if we are in development mode based on whether the app is packaged
// or by explicitly checking for an environment variable if provided by concurrently.
// A simpler check for electron app:
const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Check if we have a DEV_URL to load from Vite server
  if (process.env.VITE_DEV_SERVER_URL || isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Always enable inspect mode (DevTools)
  win.webContents.openDevTools();

  // Intercept frontend console logs and print them to the terminal
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Frontend] ${message}`);
  });
}

app.whenReady().then(() => {
  // 1. Initialize Local Runtime Layer
  try {
    dbService.initialize();
    
    // Phase 3: Initialize Node Identity
    nodeIdentityService.initialize();
    const nodeId = nodeIdentityService.getNodeId();
    
    // Phase 11: Migrate Legacy Data
    dataMigrationTool.runMigration(nodeId);
    
    // TEMPORARY: Reset cloud sync status to push all historic events to the new backend
    dbService.getDb().prepare('UPDATE events SET cloud_synced = 0').run();

    eventStoreService.initialize(nodeId);
    syncService.initialize();
    
    // Phase 4: Start Peer API Server and Sync Polling
    peerApi.initialize();
    syncService.startPolling();
    discoveryService.initialize();
    auditService.initialize(nodeId);
    // 5. Start Background Cloud Sync
    cloudSyncService.start();

    console.log('[App] All backend services started successfully!');
  } catch (err) {
    console.error('[Main] Failed to initialize Local Runtime Layer:', err);
  }

  // 2. Setup IPC API Bridge
  ipcMain.handle('api-request', async (event, args) => {
    return await localApi.handleRequest(args.endpoint, args.options);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
