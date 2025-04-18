interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  saveFile: (content: string, filename: string) => Promise<string | null>;
  loadFile: () => Promise<{ content: string; filename: string } | null>;
  getIconPath: () => string;
  
  // 窗口控制
  minimizeWindow: () => void;
  maximizeRestoreWindow: () => void;
  closeWindow: () => void;
  onWindowStateChange: (callback: (state: string) => void) => (() => void);
  
  // 菜单事件
  onNewFile: (callback: () => void) => (() => void);
  onOpenFile: (callback: () => void) => (() => void);
  onSaveFile: (callback: () => void) => (() => void);
  onFileOpened: (callback: (data: any) => void) => (() => void);
}

interface AppInfo {
  isElectron: boolean;
  platform: string;
}

// 扩展Window接口以添加Electron特有功能
interface Window {
  electronAPI?: ElectronAPI;
  appInfo?: AppInfo;
  // 添加一些方便的全局函数，让web组件可以直接调用
  saveFileToLocal?: (content: string, filename: string) => Promise<string | null>;
  loadFileFromLocal?: () => Promise<{ content: string; filename: string } | null>;
}