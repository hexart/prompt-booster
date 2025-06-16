// apps/web/src/App.tsx
import { useState, useEffect, useRef } from 'react';
import { I18nextProvider } from 'react-i18next';
import { RefreshDetector } from './components/RefreshDetector';
import { PromptBooster } from './components/PromptBooster';
import { TestResult } from './components/TestResult';
import { ModelSettings } from './components/ModelSettings';
import { PromptHistory } from './components/PromptHistory';
import Header, { TabType } from './components/Header';
import { ThemeProvider } from '@prompt-booster/ui/components/ThemeContext';
import { Toaster } from '@prompt-booster/ui';
import { useTranslation } from 'react-i18next';
import { setDirectionByLanguage, getButtonPosition } from './rtl';
import { Tooltip } from '@prompt-booster/ui/components/Tooltip';

// 声明全局变量类型
declare global {
  const __APP_VERSION__: string;
}

function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('booster');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.title = t('common.appName');

    setDirectionByLanguage(i18n.language);
  }, [t, i18n.language]);

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

  // 根据RTL获取适当的Toast位置
  const toastPosition = getButtonPosition('top-right');

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider defaultTheme="system" storageKey="my-app-theme">
        <RefreshDetector />
        <div className="min-h-screen antialiased overflow-x-hidden">
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
            menuButtonRef={menuButtonRef}
          />

          <main className="w-full h-auto mac-top-margin md:h-[calc(100vh-126px)] overflow-y-auto md:overflow-hidden max-w-(--breakpoint-2xl) mx-auto p-2 md:px-6 md:py-4">
            <Toaster position={toastPosition} />
            {/* 内容区域 */}
            <div className="flex flex-col flex-grow rounded-3xl shadow p-4 md:p-6 w-full h-full main-container" aria-hidden="false">
              {activeTab === 'booster' && <PromptBooster />}
              {activeTab === 'test' && <TestResult />}
              {activeTab === 'history' && <PromptHistory onNavigateToEditor={navigateToEditor} />}
              {activeTab === 'settings' && <ModelSettings />}
            </div>
          </main>

          <footer className="mt-auto rounded-t-xl footer">
            <div className="w-full max-w-(--breakpoint-2xl) mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-3">
              <div className="flex text-center text-sm items-center justify-center gap-2">
                <span>
                  Hexart Studio © 2025
                </span>
                <Tooltip text={t('common.checkNewVersion')}>
                  <a
                    href="https://hexart.github.io/prompt-booster/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-1 py-0.5 rounded text-xs font-medium version-badge"
                  >
                    v{__APP_VERSION__}
                  </a>
                </Tooltip>

                <a href="https://hits.sh/hexart.github.io/prompt-booster/">
                  <img alt="Hits" src="https://hits.sh/hexart.github.io/prompt-booster.svg?color=1196cc" />
                </a>
              </div>
            </div>
          </footer>
        </div>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;