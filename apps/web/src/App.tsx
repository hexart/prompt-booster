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
            <div className="text-center text-sm">
              <div>Hexart Studio © 2025 Licensed under <a href="LICENSE-MIT" className="hover:underline">MIT</a> or <a href="LICENSE-APACHE" className="hover:underline">Apache-2.0</a></div>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}

export default App;