const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Expose APIs for local server communication
  ping: () => ipcRenderer.invoke('ping'),
  invokeApi: (endpoint, options) => ipcRenderer.invoke('api-request', { endpoint, options }),
  
  // Phase 6: Expose listener for real-time UI sync
  onSyncUpdate: (callback) => ipcRenderer.on('sync-update', (_event, payload) => callback(payload))
});
