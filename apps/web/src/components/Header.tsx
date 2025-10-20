// src/components/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import { RocketIcon, BookOpenCheckIcon, GalleryVerticalEndIcon, CogIcon } from 'lucide-react';
import ThemeSwitcher from './ui/components/ThemeSwitcher';
import MobileMenu, { TabItem } from './MobileMenu';
import logo from '../assets/logo.svg';
import { Tooltip } from './ui/components/Tooltip';
import { LanguageSwitcher } from './ui/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { getTooltipPosition, isRTL } from '../rtl';

// 为 Electron 的拖动区域属性创建类型声明
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}

export type TabType = 'booster' | 'test' | 'history' | 'settings';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
}

const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  menuButtonRef
}) => {
  const { t, i18n } = useTranslation();


  const tabs = [
    { id: 'booster', icon: RocketIcon, label: t('common.tabs.booster'), shortcut: '⌥+1' },
    { id: 'test', icon: BookOpenCheckIcon, label: t('common.tabs.test'), shortcut: '⌥+2' },
    { id: 'history', icon: GalleryVerticalEndIcon, label: t('common.tabs.history'), shortcut: '⌥+3' },
    { id: 'settings', icon: CogIcon, label: t('common.tabs.settings'), shortcut: '⌥+4' }
  ] as const;

  // 在组件中添加状态来跟踪active tab的位置
  const [activeTabIndex, setActiveTabIndex] = useState(
    tabs.findIndex(tab => tab.id === activeTab)
  );
  const [tabDimensions, setTabDimensions] = useState<{ width: number; x: number }[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 计算每个 tab 的尺寸和位置
  useEffect(() => {
    const calculateDimensions = () => {
      const container = tabRefs.current[0]?.parentElement;
      if (!container) return;

      const measurements = tabRefs.current.map(ref => {
        if (!ref) return { width: 0, x: 0 };

        const refRect = ref.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // 直接计算相对位置，不需要减去 padding
        const x = refRect.left - containerRect.left;
        const width = refRect.width;

        return { width, x };
      });

      setTabDimensions(measurements);
    };

    // 使用 requestAnimationFrame 确保 DOM 已更新
    requestAnimationFrame(calculateDimensions);

    // 监听窗口大小变化
    window.addEventListener('resize', calculateDimensions);

    return () => {
      window.removeEventListener('resize', calculateDimensions);
    };
  }, [tabs, i18n.language, activeTab]);

  // 更新 activeTabIndex
  useEffect(() => {
    const index = tabs.findIndex(tab => tab.id === activeTab);
    setActiveTabIndex(index);
  }, [activeTab, tabs]);

  // 计算 Tooltip 位置的辅助函数
  const calculateTooltipPositions = () => ({
    mobile: getTooltipPosition('left'), // 使用自动镜像逻辑
    mobileMenu: getTooltipPosition('left')
  });

  // 使用状态管理 Tooltip 位置，确保能实时更新
  const [tooltipPositions, setTooltipPositions] = useState(calculateTooltipPositions);

  // 监听语言变化和初始化，自动更新 Tooltip 位置
  useEffect(() => {
    const updateTooltipPositions = () => {
      requestAnimationFrame(() => {
        setTooltipPositions(calculateTooltipPositions());
      });
    };

    // 初始化时也需要计算一次，以防页面加载时就是 RTL 语言
    updateTooltipPositions();

    // 监听语言变化
    i18n.on('languageChanged', updateTooltipPositions);

    return () => {
      i18n.off('languageChanged', updateTooltipPositions);
    };
  }, [i18n]);


  // 设置快捷键
  useHotkeys('alt+1', () => setActiveTab('booster'), { preventDefault: true });
  useHotkeys('alt+2', () => setActiveTab('test'), { preventDefault: true });
  useHotkeys('alt+3', () => setActiveTab('history'), { preventDefault: true });
  useHotkeys('alt+4', () => setActiveTab('settings'), { preventDefault: true });

  const menuTabs: TabItem[] = tabs.map(tab => ({
    id: tab.id,
    icon: tab.icon,
    label: tab.label,
    shortcut: tab.shortcut
  }));

  // 为交互元素创建防止拖动传播的样式
  const nonDraggableStyle = { WebkitAppRegion: 'no-drag' as const };

  return (
    <>
      <header
        className="sticky top-0 rounded-b-xl w-full z-40 shadow-2xs header"
        style={{ WebkitAppRegion: 'drag' as const }}
      >
        <div className="w-full max-w-(--breakpoint-2xl) mx-auto px-2 md:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center min-w-24">
              <Tooltip text={t('common.wuKong')} position='bottom'>
                <img
                  src={logo}
                  alt={t('common.wuKong')}
                  className="h-8 w-8 me-2"
                  style={nonDraggableStyle}
                />
              </Tooltip>
              <h1 className="text-xl sm:text-2xl font-bold whitespace-nowrap cursor-default select-none truncate title">
                {t('common.appName')}
              </h1>
            </div>

            <div className="flex items-center gap-2" style={nonDraggableStyle}>
              {/* 桌面端卡片导航 */}
              <div className="hidden md:flex tab-container rounded-2xl shadow-[inset_0_0_4px_rgba(0,0,0,0.05)] p-1 relative">
                {/* 滑动背景 */}
                {tabDimensions.length > 0 && activeTabIndex >= 0 && (
                  <motion.div
                    className="absolute top-1 tab-active rounded-xl shadow"
                    style={{
                      left: 0,
                      height: 'calc(100% - 8px)',  // 100% 减去 top-1 + bottom-1 的值
                      top: '4px'
                    }}
                    initial={false}
                    animate={{
                      x: tabDimensions[activeTabIndex]?.x || 0,
                      width: tabDimensions[activeTabIndex]?.width || 0
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}

                {tabs.map((tab, index) => {
                  const Icon = tab.icon;
                  return (
                    <Tooltip key={tab.id} text={`(${tab.shortcut})`} position='bottom'>
                      <button
                        ref={(el) => {
                          tabRefs.current[index] = el;
                        }}
                        onClick={() => setActiveTab(tab.id)}
                        className={`relative z-10 py-2 px-4 font-medium transition-colors duration-300 flex items-center gap-2 ${activeTab === tab.id ? 'tab-active' : 'tab-inactive'
                          }`}
                        style={{ WebkitAppRegion: 'no-drag' }}
                      >
                        <Icon size={18} />
                        <span className="truncate overflow-hidden">{tab.label}</span>
                      </button>
                    </Tooltip>
                  );
                })}
              </div>

              {/* 主题切换按钮 */}
              <ThemeSwitcher
                mobileTooltipPosition={tooltipPositions.mobile}
                mobileMenuTooltipPosition={tooltipPositions.mobileMenu}
                desktopTooltipPosition="bottom"
              />

              {/* 语言切换器 */}
              <LanguageSwitcher
                tooltipPosition={tooltipPositions.mobile}
                menuTooltipPosition={tooltipPositions.mobileMenu}
              />

              {/* 移动端菜单按钮 */}
              <div className={`md:hidden p-1 rounded-2xl mobile-menu-button-container`}>
                <button
                  ref={menuButtonRef}
                  className="w-10 h-10 p-2 rounded-md mobile-menu-button"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label={isMobileMenuOpen ? t('aria.closeMenu') : t('aria.openMenu')}
                  aria-expanded={isMobileMenuOpen}
                  style={nonDraggableStyle}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className=""
                  >
                    {isMobileMenuOpen ? (
                      <>
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </>
                    ) : (
                      <>
                        <line x1="4" y1="8" x2="20" y2="8" />
                        <line x1="4" y1="16" x2="20" y2="16" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 移动端菜单整合到Header组件中 */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        tabs={menuTabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabType)}
        toggleButtonRef={menuButtonRef}
        isRTL={isRTL()}
      />
    </>
  );
};

export default Header;