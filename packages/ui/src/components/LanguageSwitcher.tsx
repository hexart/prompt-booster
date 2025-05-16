// packages/ui/src/components/LanguageSwitcher.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useHotkeys } from 'react-hotkeys-hook';
import { Tooltip } from './Tooltip';
import { useTheme } from './ThemeContext';

// 语言类型
type LanguageCode = 'zh-CN' | 'zh-Hant' | 'en-US' | 'ja-JP' | 'ko-KR' | 'de-DE';

// 语言配置
const languageConfig: Record<LanguageCode, {
    icon: string,
    label: string,
    shortcut: string,
    hotkey: string
}> = {
    'zh-CN': {
        icon: '🇨🇳',
        label: '中文',
        shortcut: '⌥+C',
        hotkey: 'alt+c'
    },
    'zh-Hant': {
        icon: '🇨🇳',
        label: '繁體中文',
        shortcut: '⌥+H',
        hotkey: 'alt+h'
    },
    'en-US': {
        icon: '🇺🇸',
        label: 'English',
        shortcut: '⌥+E',
        hotkey: 'alt+e'
    },
    'ja-JP': {
        icon: '🇯🇵',
        label: '日本語',
        shortcut: '⌥+J',
        hotkey: 'alt+j'
    },
    'ko-KR': {
        icon: '🇰🇷',
        label: '한국어',
        shortcut: '⌥+K',
        hotkey: 'alt+k'
    },
    'de-DE': {
        icon: '🇩🇪',
        label: 'Deutsch',
        shortcut: '⌥+D',
        hotkey: 'alt+d'
    }
};

export interface LanguageSwitcherProps {
    /**
     * 自定义CSS类名
     */
    className?: string;
    
    /**
     * 是否启用快捷键
     * @default true
     */
    enableHotkeys?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
    className = '',
    enableHotkeys = true
}) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    
    // 检测当前是否为暗色模式
    const isDarkMode = theme === 'dark' || (theme === 'system' && 
        typeof window !== 'undefined' && 
        window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // 获取当前语言代码
    const getCurrentLangCode = (): LanguageCode => {
        const lang = i18n.language || 'zh-CN';
        
        if (lang.includes('zh-CN') || lang === 'zh-Hans' || (lang === 'zh' && !lang.includes('TW') && !lang.includes('HK') && !lang.includes('Hant'))) 
            return 'zh-CN';
        if (lang.includes('zh-TW') || lang.includes('zh-HK') || lang.includes('zh-Hant') || lang === 'zh-Hant') 
            return 'zh-Hant';
        if (lang.includes('ja')) 
            return 'ja-JP';
        if (lang.includes('ko')) 
            return 'ko-KR';
        if (lang.includes('de')) 
            return 'de-DE';
        return 'en-US';
    };
    
    // 设置快捷键
    if (enableHotkeys) {
        Object.entries(languageConfig).forEach(([langCode, config]) => {
            useHotkeys(config.hotkey, (event) => {
                event.preventDefault();
                i18n.changeLanguage(langCode);
            }, { enableOnFormTags: true }, [i18n]);
        });
    }
    
    // 关闭下拉菜单的点击外部处理
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    // 处理语言切换并关闭下拉菜单
    const handleChangeLang = (langCode: string) => {
        i18n.changeLanguage(langCode);
        setIsOpen(false);
    };
    
    // 渲染下拉菜单中的语言选项
    const renderLanguageOption = (langCode: LanguageCode) => {
        const config = languageConfig[langCode];
        const { icon, label, shortcut } = config;
        const currentLangCode = getCurrentLangCode();
        
        // 根据当前主题使用相应的样式类
        const buttonStyle = langCode === currentLangCode
            ? (isDarkMode ? 'theme-dark-active' : 'theme-light-active')
            : (isDarkMode ? 'theme-dark-inactive' : 'theme-light-inactive');
            
        // 工具提示文本
        const tooltipText = enableHotkeys ? `${label}\n(${shortcut})` : label;

        return (
            <Tooltip key={langCode} text={tooltipText} position="left">
                <button
                    onClick={() => handleChangeLang(langCode)}
                    className={`lang-button ${buttonStyle} flex justify-center`}
                    aria-label={label}
                >
                    <span className="">{icon}</span>
                </button>
            </Tooltip>
        );
    };
    
    // 获取当前语言代码
    const currentLangCode = getCurrentLangCode();
    const currentLangConfig = languageConfig[currentLangCode];
    
    // 下拉菜单切换按钮样式
    const dropdownButtonStyle = isOpen
        ? 'theme-dropdown-active'
        : 'theme-dropdown-inactive';
    
    return (
        <div className={`ml-2 relative inline-block ${className}`} ref={dropdownRef}>
            <div className="theme-container">
                <Tooltip 
                    text={enableHotkeys 
                        ? `${currentLangConfig.label}\n(${currentLangConfig.shortcut})` 
                        : currentLangConfig.label
                    } 
                    position="left"
                >
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`lang-button ${dropdownButtonStyle}`}
                        aria-expanded={isOpen}
                        aria-haspopup="true"
                        aria-label="切换语言"
                    >
                        <span className="">{currentLangConfig.icon}</span>
                    </button>
                </Tooltip>
            </div>
            
            {/* 下拉菜单结构 */}
            {isOpen && (
                <div className="theme-dropdown-container theme-container">
                    <div className="flex flex-col gap-1">
                        {Object.keys(languageConfig).map(key =>
                            renderLanguageOption(key as LanguageCode)
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;