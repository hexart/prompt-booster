// preload.ts
(() => {
    const electronModule = require('electron');
    const contextBridge = electronModule.contextBridge;
    const ipcRenderer = electronModule.ipcRenderer;

    // 确定图标路径
    const iconPath = process.env.NODE_ENV === 'development' 
        ? './icon.png'  // 开发环境中使用相对路径
        : './icon.png'; // 生产环境也使用相对路径，我们会在 CSP 中处理

    const electronAPI = {
        // 应用信息
        getAppVersion: () => ipcRenderer.invoke('get-app-version'),
        
        // 添加图标路径
        getIconPath: () => iconPath,

        // 文件操作
        saveFile: (content: string, filename: string) => {
            return ipcRenderer.invoke('save-file', content, filename);
        },

        loadFile: () => {
            return ipcRenderer.invoke('load-file');
        },

        // 窗口控制
        minimizeWindow: () => ipcRenderer.send('window-control', 'minimize'),
        maximizeRestoreWindow: () => ipcRenderer.send('window-control', 'maximize-restore'),
        closeWindow: () => ipcRenderer.send('window-control', 'close'),
        
        // 监听窗口状态变化
        onWindowStateChange: (callback: (state: string) => void) => {
            const listener = (_: any, state: string) => callback(state);
            ipcRenderer.on('window-state-changed', listener);
            return () => {
                ipcRenderer.removeListener('window-state-changed', listener);
            };
        },

        // 监听菜单事件
        onNewFile: (callback: () => void) => {
            ipcRenderer.on('menu-new-file', callback);
            return () => {
                ipcRenderer.removeAllListeners('menu-new-file');
            };
        },

        onOpenFile: (callback: () => void) => {
            const openHandler = () => {
                ipcRenderer.invoke('load-file').then((result: { content?: string, filename?: string } | null) => {
                    if (result) {
                        callback();
                        ipcRenderer.send('file-opened', result);
                    }
                });
            };
            ipcRenderer.on('menu-open-file', openHandler);
            return () => {
                ipcRenderer.removeListener('menu-open-file', openHandler);
            };
        },

        onSaveFile: (callback: () => void) => {
            ipcRenderer.on('menu-save-file', callback);
            return () => {
                ipcRenderer.removeAllListeners('menu-save-file');
            };
        },

        // 文件内容监听
        onFileOpened: (callback: (data: { content?: string, filename?: string }) => void) => {
            const fileOpenedHandler = (_: any, data: { content?: string, filename?: string }) => callback(data);
            ipcRenderer.on('file-opened', fileOpenedHandler);
            return () => {
                ipcRenderer.removeListener('file-opened', fileOpenedHandler);
            };
        }
    };

    // 使用 contextBridge 暴露 API
    contextBridge.exposeInMainWorld('electronAPI', electronAPI);

    // 安全地通知渲染进程应用环境信息
    contextBridge.exposeInMainWorld('appInfo', {
        isElectron: true,
        platform: process.platform
    });
})();