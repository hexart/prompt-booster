// src/components/Header.tsx
import React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { RocketIcon, Columns2Icon, GalleryVerticalEndIcon, CogIcon } from 'lucide-react';
import ThemeSwitcher from '@prompt-booster/ui/components/ThemeSwitcher';
import MobileMenu, { TabItem } from './MobileMenu';
import logo from '../assets/logo.svg';
import { Tooltip } from '@prompt-booster/ui/components/Tooltip';
import { LanguageSwitcher } from '@prompt-booster/ui/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const tabs = [
        { id: 'booster', icon: RocketIcon, label: t('common.tabs.booster'), shortcut: '⌥+1' },
        { id: 'test', icon: Columns2Icon, label: t('common.tabs.test'), shortcut: '⌥+2' },
        { id: 'history', icon: GalleryVerticalEndIcon, label: t('common.tabs.history'), shortcut: '⌥+3' },
        { id: 'settings', icon: CogIcon, label: t('common.tabs.settings'), shortcut: '⌥+4' }
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

    // 为交互元素创建防止拖动传播的样式
    const nonDraggableStyle = { WebkitAppRegion: 'no-drag' as const };

    return (
        <>
            <header
                className="sticky top-0 w-full z-40 shadow-2xs header"
                style={{ WebkitAppRegion: 'drag' as const }}
            >
                <div className="w-full max-w-(--breakpoint-2xl) mx-auto px-4 md:px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center min-w-24">
                            <Tooltip text={t('common.wuKong')} position='bottom'>
                                <img
                                    src={logo}
                                    alt={t('common.wuKong')}
                                    className="h-8 w-8 mr-2"
                                    style={nonDraggableStyle}
                                />
                            </Tooltip>
                            <h1 className="text-xl sm:text-2xl font-bold whitespace-nowrap truncate title">
                                {t('common.appName')}
                            </h1>
                        </div>

                        <div className="flex items-center" style={nonDraggableStyle}>
                            {/* 桌面端卡片导航 */}
                            <div className="hidden md:flex tab-container rounded-lg p-1 mr-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <Tooltip key={tab.id} text={tab.shortcut} position='bottom'>
                                            <button
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`py-2 px-4 font-medium rounded-md relative transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
                                                    ? 'tab-active shadow-sm'
                                                    : 'tab-inactive'
                                                    } min-w-0`}
                                                style={{
                                                    transform: activeTab === tab.id ? '' : 'none',
                                                    WebkitAppRegion: 'no-drag'
                                                }}
                                            >
                                                <Icon size={18} />
                                                <span className="truncate overflow-hidden">{tab.label}</span>
                                            </button>
                                        </Tooltip>
                                    );
                                })}
                            </div>

                            {/* 主题切换按钮 - 使用断点控制内部渲染模式 */}
                            <ThemeSwitcher />

                            {/* 添加语言切换器 */}
                            <LanguageSwitcher />

                            {/* 移动端菜单按钮 */}
                            <div className='md:hidden ml-2 p-1 rounded-lg mobile-menu-button-container'>
                                <button
                                    ref={menuButtonRef}
                                    className="p-2 rounded-md mobile-menu-button"
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
            />
        </>
    );
};

export default Header;