const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Expose APIs for local server communication in the future
  ping: () => ipcRenderer.invoke('ping')
});
