const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronPlatform', process.platform);
contextBridge.exposeInMainWorld('electron', {
  sendMessage: (channel, data) => {
    ipcRenderer.send(channel, data)
  },
  receiveMessage: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args))
  }
})