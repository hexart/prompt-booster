// "模块用于控制应用程序生命周期并创建原生浏览器窗口。"
const { app, BrowserWindow, Menu, dialog } = require('electron')
const path = require('node:path')
const packageInfo = require('./package.json')

let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: path.join(__dirname, 'build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  const firstMenuItem = {
    label: process.platform === 'darwin' ? app.name : '文件',
    submenu: [
      // macOS 特有菜单项
      ...(process.platform === 'darwin' ? [
        { role: 'hide', label: '隐藏' },
        { role: 'hideOthers', label: '隐藏其他' },
        { role: 'unhide', label: '取消隐藏' },
        { type: 'separator' },
      ] : []),

      // 共有菜单项
      { role: 'quit', label: '退出' }
    ]
  };

  const template = [
    firstMenuItem,
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'toggledevtools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'zoom', label: '缩放' },
        { role: 'close', label: '关闭窗口' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 Prompt Booster',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: '关于 Prompt Booster',
              message: `Prompt Booster\n版本：${packageInfo.version}\n版权所有 © 2025 Hexart Studio\n保留所有权利。`,
              buttons: ['确定']
            });
          }
        }
      ]
    }
  ];

  // 应用该菜单
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // 加载 web 项目的 index.html
  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL(`file://${path.join(__dirname, '../web/dist/index.html')}`);
  } else {
    mainWindow.loadURL(`file://${path.join(__dirname, 'web/index.html')}`);
  }

  // 打开开发者工具（可选）
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }
}

// 当 Electron 完成初始化并准备创建浏览器窗口时，将调用此方法。
// 某些 API 只能在此事件发生后使用。
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 在所有窗口都关闭时退出，但在 macOS 上除外。
// 在 macOS 上，应用程序及其菜单栏通常保持活动状态，直到用户使用 Cmd + Q 明确退出。
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});