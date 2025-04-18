import { app, BrowserWindow, shell, Menu, ipcMain } from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipc-handlers.js';

// 避免重复声明 __dirname
const currentDir = __dirname;

// 禁用生产环境警告
if (process.env.NODE_ENV === 'production') {
  app.disableHardwareAcceleration();
}

// 防止多个实例运行
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let mainWindow: BrowserWindow | null = null;

// 为macOS创建应用菜单
function createMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    // 应用菜单 (macOS only)
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // 文件菜单
    {
      label: '文件',
      submenu: [
        {
          label: '打开文件...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            mainWindow?.webContents.send('menu-open-file');
          }
        },
        {
          label: '保存文件...',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu-save-file');
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // 编辑菜单 
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: '语音',
            submenu: [
              { role: 'startSpeaking' },
              { role: 'stopSpeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    // 视图菜单
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    // 窗口菜单
    {
      label: '窗口',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [
          { role: 'close' }
        ])
      ]
    },
    // 帮助菜单
    {
      role: 'help',
      submenu: [
        {
          label: '了解更多',
          click: async () => {
            await shell.openExternal('https://github.com/yourusername/prompt-booster');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);
}

// 窗口控制相关的IPC处理
function setupWindowControlHandlers() {
  ipcMain.on('window-control', (_, command) => {
    if (!mainWindow) return;

    switch (command) {
      case 'minimize':
        mainWindow.minimize();
        break;
      case 'maximize-restore':
        if (mainWindow.isMaximized()) {
          mainWindow.restore();
          mainWindow.webContents.send('window-state-changed', 'normal');
        } else {
          mainWindow.maximize();
          mainWindow.webContents.send('window-state-changed', 'maximized');
        }
        break;
      case 'close':
        mainWindow.close();
        break;
    }
  });
}

async function createWindow() {
  const isMac = process.platform === 'darwin';
  

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: '#1a1a1a',
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(currentDir, 'preload.js'),
      webSecurity: true
    },
  });

  // 设置内容安全策略
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline';"]
      }
    });
  });

  // 监听窗口最大化事件
  mainWindow.on('maximize', () => {
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('window-state-changed', 'maximized');
    }
  });

  // 监听窗口恢复事件
  mainWindow.on('unmaximize', () => {
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('window-state-changed', 'normal');
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  // 打开外部链接在默认浏览器中打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 加载应用
  if (process.env.NODE_ENV === 'development') {
    // 开发环境下从开发服务器加载
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境下从构建目录加载
    try {
      // 使用 process.resourcesPath 获取资源目录
      const resourcesPath = process.resourcesPath;
      console.log('资源路径:', resourcesPath);

      // 加载从 extraResources 复制来的文件
      const indexPath = path.join(resourcesPath, 'app', 'renderer', 'index.html');
      console.log('尝试加载:', indexPath);

      await mainWindow.loadFile(indexPath);
    } catch (error) {
      console.error('加载HTML失败:', error);
      // 显示错误信息
      mainWindow.webContents.loadURL('data:text/html,<html><body><h1>加载失败</h1><p>' + error + '</p></body></html>');
    }
  }
}

app.whenReady().then(() => {
  // 设置macOS应用菜单
  createMenu();

  // 设置IPC处理程序
  setupIpcHandlers();
  setupWindowControlHandlers();

  createWindow();


  app.on('activate', () => {
    // 在macOS上，当点击dock图标且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 除了macOS外，当所有窗口都被关闭的时候退出程序
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 在第二个实例启动时聚焦到主窗口
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// 导出一个空对象以确保这是一个模块
export { };