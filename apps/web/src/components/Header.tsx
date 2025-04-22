// src/components/Header.tsx
import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { RocketIcon, Columns2Icon, GalleryVerticalEndIcon, CogIcon } from 'lucide-react';
import ThemeSwitcher from '@prompt-booster/ui/components/ThemeSwitcher';
import MobileMenu, { TabItem } from './MobileMenu';
import reactLogo from '../assets/react.svg';

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
    const tabs = [
        { id: 'booster', icon: RocketIcon, label: '提示词增强', shortcut: '⌥+1' },
        { id: 'test', icon: Columns2Icon, label: '对比测试', shortcut: '⌥+2' },
        { id: 'history', icon: GalleryVerticalEndIcon, label: '历史记录', shortcut: '⌥+3' },
        { id: 'settings', icon: CogIcon, label: '模型设置', shortcut: '⌥+4' }
    ] as const;

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

    return (
        <>
            <header className={`sticky top-0 w-full z-40 ${isMobileMenuOpen ? 'border-b border-gray-200 dark:border-gray-800' : 'border-b border-gray-200 dark:border-gray-800'} bg-white dark:bg-gray-900 shadow-2xs`}>
                <div className="w-full max-w-(--breakpoint-2xl) mx-auto px-4 md:px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center min-w-24">
                            <img src={reactLogo} alt="React Logo" className="h-8 w-8 mr-2 logo-animation" />
                            <h1 className="text-xl sm:text-2xl font-bold whitespace-nowrap truncate text-sky-600 dark:text-gray-300">
                                提示词增强器
                            </h1>
                        </div>

                        <div className="flex items-center">
                            {/* 桌面端卡片导航 */}
                            <div className="hidden md:flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mr-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`py-2 px-4 rounded-md relative transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
                                                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                                                } min-w-0`}
                                            style={{
                                                transform: activeTab === tab.id ? '' : 'none'
                                            }}
                                            title={`${tab.shortcut}`}
                                        >
                                            <Icon size={18} />
                                            <span className="truncate overflow-hidden">{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            
                            {/* 主题切换按钮 - 使用断点控制内部渲染模式 */}
                            <ThemeSwitcher breakpoint="lg" />
                            
                            {/* 移动端菜单按钮 */}
                            <button
                                ref={menuButtonRef}
                                className="md:hidden ml-2 p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                aria-label={isMobileMenuOpen ? "关闭菜单" : "打开菜单"}
                                aria-expanded={isMobileMenuOpen}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
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
            </header>

            {/* 移动端菜单整合到Header组件中 */}
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
                tabs={menuTabs}
                activeTab={activeTab}
                onTabChange={(tabId) => setActiveTab(tabId as TabType)}
                toggleButtonRef={menuButtonRef}
            />
        </>
    );
};

export default Header;