// "模块用于控制应用程序生命周期并创建原生浏览器窗口。"
const { app, BrowserWindow, Menu, dialog, Notification } = require('electron')
const path = require('node:path')
const packageInfo = require('./package.json')
const electronLog = require('electron-log')
const fs = require('fs');

// 引入 autoUpdater 用于手动检查
const { autoUpdater } = require('electron-updater');

// 使用通知系统进行更新检查状态显示，使用对话框显示结果
function checkForUpdates() {
  // 确保在打包版本中运行
  if (!app.isPackaged) {
    dialog.showMessageBox({
      type: 'info',
      title: '检查更新',
      message: '开发模式下更新检查已禁用',
      buttons: ['确定']
    });
    return;
  }

  // 显示"正在检查"通知
  const checkingNotification = new Notification({
    title: '检查更新',
    body: '正在检查可用更新...',
    silent: true  // 不发出声音
  });
  checkingNotification.show();

  // 检查更新
  autoUpdater.checkForUpdates().then(result => {
    // 关闭"正在检查"通知
    checkingNotification.close();

    if (result && result.updateInfo.version !== app.getVersion()) {
      // 使用对话框显示"有更新"结果
      dialog.showMessageBox({
        type: 'info',
        title: '更新可用',
        message: `发现新版本: ${result.updateInfo.version}`,
        detail: '新版本将在后台下载，下载完成后将通知您安装',
        buttons: ['确定']
      });
    } else {
      // 使用对话框显示"没有更新"结果
      dialog.showMessageBox({
        type: 'info',
        title: '检查更新',
        message: '您已经使用的是最新版本',
        buttons: ['确定']
      });
    }
  }).catch(error => {
    // 关闭"正在检查"通知
    checkingNotification.close();

    // 使用对话框显示错误
    dialog.showMessageBox({
      type: 'error',
      title: '更新检查失败',
      message: '检查更新时出现错误',
      detail: error.toString(),
      buttons: ['确定']
    });

    // 记录错误
    electronLog.error('更新检查失败:', error);
  });
}

// 配置 autoUpdater 额外的事件监听
autoUpdater.logger = electronLog;
autoUpdater.on('error', (error) => {
  electronLog.error('更新错误:', error);
});

// 监听更新下载完成事件
autoUpdater.on('update-downloaded', (info) => {
  // 创建一个通知，告知用户更新已准备就绪
  const updateReadyNotification = new Notification({
    title: '更新已准备就绪',
    body: `新版本 ${info.version} 已下载完成，您可以在方便时重启应用安装更新`,
    silent: false  // 播放声音提醒
  });

  // 点击通知时显示对话框，询问是否立即重启
  updateReadyNotification.on('click', () => {
    dialog.showMessageBox({
      type: 'info',
      title: '安装更新',
      message: `新版本 ${info.version} 已准备就绪`,
      detail: '是否现在重启应用来安装更新？\n\n注意：您当前的工作可能不会被保存。',
      buttons: ['立即重启', '稍后重启'],
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true); // 静默关闭并安装
      }
    });
  });

  updateReadyNotification.show();
});

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
          label: '检查更新',
          click: checkForUpdates
        },
        { type: 'separator' },
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

// 为Linux平台自动添加no-sandbox参数，解决AppImage沙箱问题
if (process.platform === 'linux') {
  // 检查是否在AppImage环境中运行
  if (process.env.APPIMAGE || process.env.APPDIR) {
    app.commandLine.appendSwitch('no-sandbox');
    app.commandLine.appendSwitch('disable-dev-shm-usage');
    console.log('检测到AppImage环境，已自动添加--no-sandbox参数');
  }
}

// 当 Electron 完成初始化并准备创建浏览器窗口时，将调用此方法。
// 某些 API 只能在此事件发生后使用。
app.whenReady().then(() => {
  createWindow()

  // 在应用启动后延迟检查更新
  if (app.isPackaged) {
    setTimeout(() => {
      // 配置文件路径
      const lastCheckFilePath = path.join(app.getPath('userData'), 'last-update-check.txt');

      // 读取上次检查时间
      let lastCheckDate = null;
      try {
        if (fs.existsSync(lastCheckFilePath)) {
          lastCheckDate = fs.readFileSync(lastCheckFilePath, 'utf8');
        }
      } catch (err) {
        electronLog.error('读取更新检查记录失败:', err);
      }

      const today = new Date().toDateString();

      // 如果今天还没检查过，或者没有记录，则检查更新
      if (!lastCheckDate || lastCheckDate !== today) {
        autoUpdater.checkForUpdates().then(result => {
          if (result && result.updateInfo.version !== app.getVersion()) {
            // 使用通知而不是对话框，减少对用户的打扰
            const newUpdateNotification = new Notification({
              title: '发现新版本',
              body: `${result.updateInfo.version} 可用，将在后台下载`,
              silent: false
            });

            newUpdateNotification.on('click', () => {
              dialog.showMessageBox({
                type: 'info',
                title: '更新可用',
                message: `发现新版本: ${result.updateInfo.version}`,
                detail: '新版本将在后台下载，下载完成后将通知您安装',
                buttons: ['确定']
              });
            });

            newUpdateNotification.show();
          }

          // 记录今天已经检查过
          try {
            fs.writeFileSync(lastCheckFilePath, today, 'utf8');
          } catch (err) {
            electronLog.error('保存更新检查记录失败:', err);
          }
        }).catch(error => {
          electronLog.error('自动更新检查失败:', error);
          // 记录今天已检查
          try {
            fs.writeFileSync(lastCheckFilePath, today, 'utf8');
          } catch (err) {
            electronLog.error('保存更新检查记录失败:', err);
          }
        });
      }
    }, 10000);  // 延迟10秒
  }

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