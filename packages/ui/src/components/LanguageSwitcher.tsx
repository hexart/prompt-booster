// packages/ui/src/components/LanguageSwitcher.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useHotkeys } from 'react-hotkeys-hook';
import { Tooltip } from './Tooltip';
import type { i18n as I18nextInstance } from 'i18next';

// 支持的提示框位置类型
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
import { useTheme } from './ThemeContext';

// 语言类型
type LanguageCode = 'zh-CN' | 'zh-Hant' | 'en-US' | 'ja-JP' | 'ko-KR' | 'de-DE' | 'tr-TR' | 'ru-RU' | 'es-ES' | 'fr-FR' | 'ar-SA' | 'pt-BR' | 'hi-IN' | 'it-IT' | 'id-ID' | 'ur-PK' | 'fa-IR';

// 语言配置
const languageConfig: Record<LanguageCode, {
  icon: string,
  label: string,
  shortcut: string,
  hotkey: string,
  display: boolean
}> = {
  'zh-CN': {
    icon: '🇨🇳',
    label: '中文',
    shortcut: '⌥+C',
    hotkey: 'alt+c',
    display: true
  },
  'zh-Hant': {
    icon: '🇨🇳',
    label: '繁體中文',
    shortcut: '⌥+T',
    hotkey: 'alt+t',
    display: true
  },
  'en-US': {
    icon: '🇺🇸',
    label: 'English',
    shortcut: '⌥+E',
    hotkey: 'alt+e',
    display: true
  },
  'hi-IN': {
    icon: '🇮🇳',
    label: 'हिन्दी',
    shortcut: '⌥+H',
    hotkey: 'alt+h',
    display: true
  },
  'es-ES': {
    icon: '🇪🇸',
    label: 'Español',
    shortcut: '⌥+S',
    hotkey: 'alt+s',
    display: true
  },
  'ar-SA': {
    icon: '🇸🇦',
    label: 'العربية',
    shortcut: '⌥+A',
    hotkey: 'alt+a',
    display: true
  },
  'pt-BR': {
    icon: '🇧🇷',
    label: 'Português',
    shortcut: '⌥+P',
    hotkey: 'alt+p',
    display: true
  },
  'ru-RU': {
    icon: '🇷🇺',
    label: 'Русский',
    shortcut: '⌥+R',
    hotkey: 'alt+r',
    display: true
  },
  'ja-JP': {
    icon: '🇯🇵',
    label: '日本語',
    shortcut: '⌥+J',
    hotkey: 'alt+j',
    display: true
  },
  'de-DE': {
    icon: '🇩🇪',
    label: 'Deutsch',
    shortcut: '⌥+G',
    hotkey: 'alt+g',
    display: true
  },
  'fr-FR': {
    icon: '🇫🇷',
    label: 'Français',
    shortcut: '⌥+F',
    hotkey: 'alt+f',
    display: true
  },
  'ko-KR': {
    icon: '🇰🇷',
    label: '한국어',
    shortcut: '⌥+K',
    hotkey: 'alt+k',
    display: true
  },
  'tr-TR': {
    icon: '🇹🇷',
    label: 'Türkçe',
    shortcut: '⌥+Y',
    hotkey: 'alt+y',
    display: true
  },
  'it-IT': {
    icon: '🇮🇹',
    label: 'Italiano',
    shortcut: '⌥+I',
    hotkey: 'alt+i',
    display: true
  },
  'id-ID': {
    icon: '🇮🇩',
    label: 'Bahasa Indonesia',
    shortcut: '⌥+N',
    hotkey: 'alt+n',
    display: true
  },
  'ur-PK': {
    icon: '🇵🇰',
    label: 'اردو',
    shortcut: '⌥+U',
    hotkey: 'alt+u',
    display: true
  },
  'fa-IR': {
    icon: '🇮🇷',
    label: 'فارسی',
    shortcut: '⌥+V',
    hotkey: 'alt+v',
    display: true
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

  /**
   * 主按钮的Tooltip位置
   * @default 'left'
   */
  tooltipPosition?: TooltipPosition;

  /**
   * 菜单按钮的Tooltip位置
   * @default 'left'
   */
  menuTooltipPosition?: TooltipPosition;

  /**
   * 可选的外部 i18n 实例，用于解决跨 chunk 的兼容性问题
   * 当组件库独立打包时，可以通过此 prop 传入主应用的 i18n 实例
   */
  i18nInstance?: I18nextInstance;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  enableHotkeys = true,
  tooltipPosition = 'left',
  menuTooltipPosition = 'left',
  i18nInstance // 新增：外部传入的 i18n 实例
}) => {
  // 始终调用 hooks（遵循 Hooks 规则）
  const hookResult = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // 优先使用外部传入的 i18n 实例，否则使用 hook 返回的实例
  const i18n = i18nInstance || hookResult.i18n;
  const t = hookResult.t;

  // 检查 i18n 实例是否可用 - 这是关键的兼容性检查
  const isI18nReady = Boolean(
    i18n &&
    i18n.isInitialized &&
    typeof i18n.changeLanguage === 'function' &&
    i18n.language
  );

  // 检测当前是否为暗色模式
  const isDarkMode = theme === 'dark' || (theme === 'system' &&
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches);

  // 获取当前语言代码 - 使用 useCallback 优化性能
  const getCurrentLangCode = useCallback((): LanguageCode => {
    if (!isI18nReady) return 'zh-CN';
    const lang = (i18n.language || 'zh-CN').toLowerCase();

    if (lang.includes('zh-tw') || lang.includes('zh-hk') || lang.includes('zh-mo') || lang.includes('hant') || lang === 'zh-hant') {
      return 'zh-Hant';
    }
    if (lang.includes('zh-cn') || lang.includes('zh-sg') || lang.includes('hans') || lang === 'zh-hans' || lang === 'zh') {
      return 'zh-CN';
    }
    if (lang.includes('ja'))
      return 'ja-JP';
    if (lang.includes('ko'))
      return 'ko-KR';
    if (lang.includes('de'))
      return 'de-DE';
    if (lang.includes('tr'))
      return 'tr-TR';
    if (lang.includes('ru'))
      return 'ru-RU';
    if (lang.includes('es'))
      return 'es-ES';
    if (lang.includes('fr'))
      return 'fr-FR';
    if (lang.includes('ar'))
      return 'ar-SA';
    if (lang.includes('pt'))
      return 'pt-BR';
    if (lang.includes('hi'))
      return 'hi-IN';
    if (lang.includes('it'))
      return 'it-IT';
    if (lang.includes('id'))
      return 'id-ID';
    if (lang.includes('ur'))
      return 'ur-PK';
    if (lang.includes('fa'))
      return 'fa-IR';
    return 'en-US';
  }, [i18n?.language, isI18nReady]);

  // 获取可显示的语言数量
  const getDisplayableLanguagesCount = useCallback((): number => {
    return Object.values(languageConfig).filter(config => config.display).length;
  }, []);

  // 安全的语言切换函数
  const handleChangeLang = useCallback((langCode: string) => {
    if (!isI18nReady) {
      console.warn('i18n is not ready, cannot change language');
      return;
    }

    try {
      i18n.changeLanguage(langCode);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [i18n, isI18nReady]);

  // 设置快捷键 - 修复 Hooks 规则违反问题
  // 必须在组件顶层调用，不能在 useEffect 中调用
  Object.entries(languageConfig).forEach(([langCode, config]) => {
    useHotkeys(
      config.hotkey,
      (event) => {
        if (!enableHotkeys || !isI18nReady) return;
        event.preventDefault();
        handleChangeLang(langCode);
      },
      {
        enableOnFormTags: true,
        enabled: enableHotkeys && isI18nReady // 使用 enabled 选项来控制是否启用
      },
      [enableHotkeys, isI18nReady, handleChangeLang]
    );
  });

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

  // 渲染下拉菜单中的语言选项
  const renderLanguageOption = useCallback((langCode: LanguageCode) => {
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
      <Tooltip key={langCode} text={tooltipText} position={menuTooltipPosition}>
        <button
          onClick={() => handleChangeLang(langCode)}
          className={`lang-button ${buttonStyle} flex justify-center`}
          aria-label={label}
        >
          <span>{icon}</span>
        </button>
      </Tooltip>
    );
  }, [getCurrentLangCode, isDarkMode, enableHotkeys, menuTooltipPosition, handleChangeLang]);

  // 如果 i18n 未准备好，不渲染任何内容（但所有 Hooks 都已调用）
  if (!isI18nReady) {
    return null;
  }

  // 如果没有可显示的语言或只有一种语言，则不显示语言切换器
  if (getDisplayableLanguagesCount() <= 1) {
    return null;
  }

  // 获取当前语言代码和配置
  const currentLangCode = getCurrentLangCode();
  const currentLangConfig = languageConfig[currentLangCode];

  // 下拉菜单切换按钮样式
  const dropdownButtonStyle = isOpen
    ? 'theme-dropdown-active'
    : 'theme-dropdown-inactive';

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <div className="theme-container">
        <Tooltip
          text={enableHotkeys
            ? `${currentLangConfig.label}\n(${currentLangConfig.shortcut})`
            : currentLangConfig.label
          }
          position={tooltipPosition}
        >
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lang-button ${dropdownButtonStyle}`}
            aria-expanded={isOpen}
            aria-haspopup="true"
            aria-label={t('aria.switchLanguage') || 'Switch Language'}
          >
            <span>{currentLangConfig.icon}</span>
          </button>
        </Tooltip>
      </div>

      {/* 下拉菜单结构 - 添加动画 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.85,
              y: -8
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.85,
              y: -8
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut"
            }}
            style={{
              transformOrigin: 'top center'
            }}
            className="theme-dropdown-container theme-container"
          >
            <motion.div className="flex flex-col gap-1">
              {Object.keys(languageConfig)
                .filter(key => languageConfig[key as LanguageCode].display)
                .map((key, index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.03,
                      ease: "easeOut"
                    }}
                  >
                    {renderLanguageOption(key as LanguageCode)}
                  </motion.div>
                ))
              }
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;