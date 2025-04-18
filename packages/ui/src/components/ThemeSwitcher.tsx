// packages/ui/src/components/ThemeSwitcher.tsx
import React from 'react';
import { useTheme } from './ThemeContext';
import { Moon, Sun, MonitorCog } from 'lucide-react';
import { Tooltip } from './Tooltip';

export const ThemeSwitcher: React.FC = () => {
    const { theme, setTheme } = useTheme();

    return (
        <div className="relative inline-block">
            <div className="flex gap-1 bg-gray-100/60 dark:bg-gray-700/60 p-1 rounded-lg">
                {/* Light mode button */}
                <Tooltip text="亮色模式" position="bottom">
                    <button
                        onClick={() => setTheme('light')}
                        className={`p-[10px] rounded-md transition-all ${theme === 'light'
                            ? 'bg-white text-blue-600 shadow-2xs'
                            : 'bg-gray-100 text-gray-500 dark:text-gray-300 hover:bg-white dark:bg-gray-800 dark:hover:bg-gray-700'
                            }`}
                        aria-label="亮色模式"
                    >
                        <Sun size={19} />
                    </button>
                </Tooltip>

                {/* Dark mode button */}
                <Tooltip text="暗色模式" position="bottom">
                    <button
                        onClick={() => setTheme('dark')}
                        className={`p-[10px] rounded-md transition-all ${theme === 'dark'
                            ? 'dark:bg-gray-700 text-blue-400 shadow-2xs'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        aria-label="暗色模式"
                    >
                        <Moon size={19} />
                    </button>
                </Tooltip>

                {/* System settings button */}
                <Tooltip text="跟随系统" position="bottom">
                    <button
                        onClick={() => setTheme('system')}
                        className={`p-[10px] rounded-md transition-all ${theme === 'system'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                            : 'bg-gray-100 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
                            }`}
                        aria-label="跟随系统"
                    >
                        <MonitorCog size={19} />
                    </button>
                </Tooltip>
            </div>
        </div>
    );
};