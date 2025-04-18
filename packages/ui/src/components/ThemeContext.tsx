// packages/ui/src/ThemeContext.tsx
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';

// 定义主题类型
type ThemeMode = 'light' | 'dark' | 'system';

// 上下文接口
interface ThemeContextType {
    theme: ThemeMode;
    resolvedTheme: 'light' | 'dark';
    setTheme: (theme: ThemeMode) => void;
}

// 创建默认上下文值
const initialState: ThemeContextType = {
    theme: "system",
    resolvedTheme: "light", // 默认值
    setTheme: () => null,
};

// 创建上下文
const ThemeContext = createContext<ThemeContextType>(initialState);

interface ThemeProviderProps {
    children: ReactNode;
    defaultTheme?: ThemeMode;
    storageKey?: string;
}

// 使用命名函数声明组件，而不是箭头函数
function ThemeProvider({ 
    children, 
    defaultTheme = 'system',
    storageKey = 'theme',
    ...props
}: ThemeProviderProps) {
    // 从本地存储中获取初始主题，如果没有则使用传入的 defaultTheme
    const [theme, setThemeState] = useState<ThemeMode>(
        () => (localStorage.getItem(storageKey) as ThemeMode) || defaultTheme
    );

    // 计算当前实际的解析主题
    const resolvedTheme: 'light' | 'dark' = theme === 'system' 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;

    // 应用主题类
    useEffect(() => {
        if (typeof document === 'undefined') return;
        
        const root = document.documentElement;
        
        // 移除所有可能的主题类
        root.classList.remove('light', 'dark');
        
        // 设置 data-theme 属性以支持 CSS 变量
        root.setAttribute('data-theme', resolvedTheme);
        
        // 应用主题类
        root.classList.add(resolvedTheme);
    }, [theme, resolvedTheme]);

    // 监听系统主题变化
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = () => {
            if (theme === 'system') {
                const root = document.documentElement;
                root.classList.remove('light', 'dark');
                
                const systemTheme = mediaQuery.matches ? 'dark' : 'light';
                root.classList.add(systemTheme);
                root.setAttribute('data-theme', systemTheme);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // 设置主题并保存到本地存储
    const setTheme = (newTheme: ThemeMode) => {
        localStorage.setItem(storageKey, newTheme);
        setThemeState(newTheme);
    };

    // 创建上下文值
    const value = {
        theme,
        resolvedTheme,
        setTheme,
    };

    return (
        <ThemeContext.Provider {...props} value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// 使用命名函数声明钩子
function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export { ThemeProvider, useTheme };