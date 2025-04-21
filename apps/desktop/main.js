// “模块用于控制应用程序生命周期并创建原生浏览器窗口。”
const { app, BrowserWindow } = require('electron')
const path = require('node:path')

let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    icon: path.join(__dirname, 'build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

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
app.whenReady().then(createWindow);

// 在所有窗口都关闭时退出，但在 macOS 上除外。
// 在 macOS 上，应用程序及其菜单栏通常保持活动状态，直到用户使用 Cmd + Q 明确退出。
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
