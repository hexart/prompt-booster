import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

// 设置IPC处理程序
export function setupIpcHandlers() {
  // 获取应用版本
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // 保存文件
  ipcMain.handle('save-file', async (_, content: string, defaultFilename = 'prompt.txt') => {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: defaultFilename,
        filters: [
          { name: '文本文件', extensions: ['txt', 'json', 'md'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      });

      if (canceled || !filePath) {
        return null;
      }

      await writeFile(filePath, content, 'utf8');
      return filePath;
    } catch (error) {
      console.error('保存文件错误:', error);
      throw error;
    }
  });

  // 加载文件
  ipcMain.handle('load-file', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
          { name: '文本文件', extensions: ['txt', 'json', 'md'] },
          { name: '所有文件', extensions: ['*'] }
        ]
      });

      if (canceled || filePaths.length === 0) {
        return null;
      }

      const filePath = filePaths[0];
      const content = await readFile(filePath, 'utf8');

      return {
        content,
        filename: path.basename(filePath)
      };
    } catch (error) {
      console.error('加载文件错误:', error);
      throw error;
    }
  });

  // 响应菜单点击事件
  ipcMain.handle('handle-menu-action', async (_event, action: string) => {
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (!mainWindow) return null;

    switch (action) {
      case 'new':
        // 发送消息到渲染进程
        mainWindow.webContents.send('menu-new-file');
        return { success: true, action: 'new' };

      case 'open':
        // 直接调用函数而不是通过handle
        try {
          const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openFile'],
            filters: [
              { name: '文本文件', extensions: ['txt', 'json', 'md'] },
              { name: '所有文件', extensions: ['*'] }
            ]
          });

          if (canceled || filePaths.length === 0) {
            return null;
          }

          const filePath = filePaths[0];
          const content = await readFile(filePath, 'utf8');

          const result = {
            content,
            filename: path.basename(filePath)
          };

          mainWindow.webContents.send('file-opened', result);
          return result;
        } catch (error) {
          console.error('加载文件错误:', error);
          return null;
        }

      case 'save':
        mainWindow.webContents.send('menu-save-file');
        return { success: true, action: 'save' };

      default:
        return null;
    }
  });
}