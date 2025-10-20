// packages/ui/src/components/ThemeSwitcher.tsx
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';
import { Moon, Sun, MonitorCog } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { Tooltip } from './Tooltip';

// 支持的提示框位置类型
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';
import { useTranslation } from 'react-i18next';

// 主题类型
type ThemeType = 'light' | 'dark' | 'system';

// 样式类名
const THEME_CLASSES = {
  container: 'theme-container',
  button: 'w-10 h-10 theme-button',
  dropdownContainer: 'theme-dropdown-container',
  light: {
    active: 'theme-light-active',
    inactive: 'theme-light-inactive'
  },
  dark: {
    active: 'theme-dark-active',
    inactive: 'theme-dark-inactive'
  }
};

interface ThemeSwitcherProps {
  /**
   * 图标大小
   * @default 19
   */
  iconSize?: number;

  /**
   * 是否启用快捷键
   * @default true
   */
  enableHotkeys?: boolean;

  /**
   * 小屏幕下主按钮的Tooltip位置
   * @default 'left'
   */
  mobileTooltipPosition?: TooltipPosition;

  /**
   * 小屏幕下菜单按钮的Tooltip位置
   * @default 'left'
   */
  mobileMenuTooltipPosition?: TooltipPosition;

  /**
   * 大屏幕下按钮的Tooltip位置
   * @default 'bottom'
   */
  desktopTooltipPosition?: TooltipPosition;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  iconSize = 19,
  enableHotkeys = true,
  mobileTooltipPosition = 'left',
  mobileMenuTooltipPosition = 'left',
  desktopTooltipPosition = 'bottom'
}) => {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 主题配置
  const themeConfig: Record<ThemeType, {
    icon: React.ComponentType<{ size?: number }>,
    label: string,
    getStyleType: (isDarkMode: boolean) => 'light' | 'dark',
    shortcut: string,
    hotkey: string
  }> = {
    light: {
      icon: Sun,
      label: t('common.theme.light'),
      getStyleType: () => 'light',
      shortcut: '⇧+L',
      hotkey: 'shift+l'
    },
    dark: {
      icon: Moon,
      label: t('common.theme.dark'),
      getStyleType: () => 'dark',
      shortcut: '⇧+D',
      hotkey: 'shift+d'
    },
    system: {
      icon: MonitorCog,
      label: t('common.theme.system'),
      getStyleType: (isDarkMode) => isDarkMode ? 'dark' : 'light',
      shortcut: '⇧+S',
      hotkey: 'shift+s'
    }
  };

  // 检测当前是否处于暗色模式
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // 初始检测
    if (typeof window !== 'undefined') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // 设置快捷键
  if (enableHotkeys) {
    Object.entries(themeConfig).forEach(([themeKey, config]) => {
      useHotkeys(config.hotkey, (event) => {
        event.preventDefault();
        setTheme(themeKey as ThemeType);
      }, { enableOnFormTags: true }, [setTheme]);
    });
  }

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    // 添加监听
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleChange);
    }

    // 清理监听
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // 兼容旧版浏览器
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // 获取当前主题的样式类
  const getButtonStyle = (themeType: ThemeType) => {
    const styleType = themeConfig[themeType].getStyleType(isDarkMode);
    const isActive = theme === themeType;

    return isActive
      ? THEME_CLASSES[styleType].active
      : THEME_CLASSES[styleType].inactive;
  };

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

  // 处理主题切换并关闭下拉菜单
  const handleThemeChange = (newTheme: ThemeType) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  // 渲染主题按钮
  const renderThemeButton = (themeType: ThemeType, tooltipPosition: TooltipPosition) => {
    const { icon: Icon, label, shortcut } = themeConfig[themeType];
    const tooltipText = enableHotkeys ? `${label}\n(${shortcut})` : label;

    return (
      <Tooltip text={tooltipText} position={tooltipPosition} key={themeType}>
        <button
          onClick={() => handleThemeChange(themeType)}
          className={`${THEME_CLASSES.button} ${getButtonStyle(themeType)}`}
          aria-label={label}
        >
          <Icon size={iconSize} />
        </button>
      </Tooltip>
    );
  };

  // 获取当前主题图标和标签
  const CurrentThemeIcon = themeConfig[theme as ThemeType]?.icon || Sun;
  const currentThemeLabel = themeConfig[theme as ThemeType]?.label || '切换主题';
  const currentShortcut = enableHotkeys ? themeConfig[theme as ThemeType]?.shortcut : '';
  const tooltipText = enableHotkeys && currentShortcut ? `${currentThemeLabel}\n(${currentShortcut})` : currentThemeLabel;

  // 下拉菜单切换按钮样式
  const dropdownButtonStyle = isOpen
    ? 'theme-dropdown-active'
    : 'theme-dropdown-inactive';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* 大屏幕按钮组 */}
      <div className={`hidden lg:!flex gap-1 ${THEME_CLASSES.container}`}>
        {Object.keys(themeConfig).map(key =>
          renderThemeButton(key as ThemeType, desktopTooltipPosition)
        )}
      </div>

      {/* 小屏幕菜单 */}
      <div className="lg:hidden">
        <div className={THEME_CLASSES.container}>
          <Tooltip text={tooltipText} position={mobileTooltipPosition}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`${THEME_CLASSES.button} ${dropdownButtonStyle}`}
              aria-expanded={isOpen}
              aria-haspopup="true"
              aria-label="切换主题"
            >
              <CurrentThemeIcon size={iconSize} />
            </button>
          </Tooltip>
        </div>

        {/* 下拉菜单 - 添加动画 */}
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
              className={`${THEME_CLASSES.dropdownContainer} ${THEME_CLASSES.container}`}
            >
              <motion.div className="flex flex-col gap-1">
                {Object.keys(themeConfig).map((key, index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.05,
                      ease: "easeOut"
                    }}
                  >
                    {renderThemeButton(key as ThemeType, mobileMenuTooltipPosition)}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ThemeSwitcher;
export { ThemeSwitcher };