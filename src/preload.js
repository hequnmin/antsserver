const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron
});

contextBridge.exposeInMainWorld('serviceAPI', {
    start: (args) => ipcRenderer.invoke('service-start', args),   //渲染器进程到主进程（双向）
    stop: (args) => ipcRenderer.invoke('service-stop', args),
    message: (callback) => ipcRenderer.on('message', callback),
    error: (callback, args) => ipcRenderer.on('error', callback, args)
})

