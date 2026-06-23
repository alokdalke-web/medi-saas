const { BrowserWindow } = require('electron');

/**
 * Safely sends an IPC message to the main React window.
 * @param {string} channel - The IPC channel name (e.g., 'sync-update')
 * @param {any} payload - The data to send
 */
function notifyFrontend(channel, payload) {
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    windows[0].webContents.send(channel, payload);
  }
}

module.exports = {
  notifyFrontend
};
