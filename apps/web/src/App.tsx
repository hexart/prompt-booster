// apps/web/src/App.tsx
import { useState, useEffect, useRef } from 'react';
import { RefreshDetector } from './components/RefreshDetector';
import { PromptBooster } from './components/PromptBooster';
import { TestResult } from './components/TestResult';
import { ModelSettings } from './components/ModelSettings';
import { PromptHistory } from './components/PromptHistory';
import Header, { TabType } from './components/Header';
import { ThemeProvider } from '@prompt-booster/ui/components/ThemeContext';
import { Toaster } from '@prompt-booster/ui';

// 添加 Electron window 类型声明
declare global {
  interface Window {
    electronPlatform: string; // 移除可选标记，因为我们已确保在 preload 中设置
    electron?: {
      sendMessage: (channel: string, data: any) => void;
      receiveMessage: (channel: string, func: (...args: any[]) => void) => void;
    };
  }
}

// 添加 CSS 属性类型声明
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}

// 创建一个独立的 MacOSTitleBar 组件
const MacOSTitleBar = () => {
  if (window.electronPlatform !== 'darwin') return null;

  return (
    <div
      className="fixed top-0 left-0 w-full h-[28px] z-[9999]"
      style={{
        WebkitAppRegion: 'drag'
      }}
    />
  );
};

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('booster');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // 检测窗口大小变化以适应响应式布局
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 导航到优化页面的回调函数
  const navigateToEditor = () => {
    setActiveTab('booster');
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="my-app-theme">
      <RefreshDetector />
      {/* 添加 macOS Electron 客户端标题栏 */}
      <MacOSTitleBar />
      <div className="min-h-screen antialiased">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          menuButtonRef={menuButtonRef}
        />

        <main className="w-full h-auto md:h-[calc(100vh-126px)] overflow-y-auto md:overflow-hidden max-w-(--breakpoint-2xl) mx-auto p-2 md:px-6 md:py-4">
          <Toaster />
          {/* 内容区域 */}
          <div className="flex flex-col flex-grow rounded-lg shadow p-4 md:p-6 w-full h-full main-container" aria-hidden="false">
            {activeTab === 'booster' && <PromptBooster />}
            {activeTab === 'test' && <TestResult />}
            {activeTab === 'history' && <PromptHistory onNavigateToEditor={navigateToEditor} />}
            {activeTab === 'settings' && <ModelSettings />}
          </div>
        </main>

        <footer className="mt-auto footer">
          <div className="w-full max-w-(--breakpoint-2xl) mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-3">
            <div className="text-center text-sm flex items-center justify-center space-x-3">
              <span>
                Hexart Studio © 2025 ·{" "}
                <a href="LICENSE" className="hover:underline">MIT/Apache</a>
              </span>
              <a href="https://hits.sh/hexart.github.io/prompt-booster/">
                <img alt="Hits" src="https://hits.sh/hexart.github.io/prompt-booster.svg?color=1196cc" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}

export default App;