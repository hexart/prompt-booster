// apps/web/src/components/ui/components/ThemeContext.tsx
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

// 获取系统主题
const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// 应用主题到DOM
const applyTheme = (theme: 'light' | 'dark') => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 移除dark类
  root.classList.remove('dark');

  // 只在暗色模式时添加dark类 - 这是关键改变
  if (theme === 'dark') {
    root.classList.add('dark');
  }

  // 设置data-theme属性
  root.setAttribute('data-theme', theme);

  // 设置color-scheme
  root.style.colorScheme = theme;

  // 触发主题变更事件
  window.dispatchEvent(new Event('theme-changed'));
};

function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
  ...props
}: ThemeProviderProps) {
  // 从本地存储中获取初始主题
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    return (localStorage.getItem(storageKey) as ThemeMode) || defaultTheme;
  });

  // 计算当前实际的解析主题
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(
    theme === 'system' ? getSystemTheme() : theme
  );

  // 更新解析后的主题
  useEffect(() => {
    const newResolvedTheme = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(newResolvedTheme);
  }, [theme]);

  // 应用主题
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  // 监听系统主题变化
  useEffect(() => {
    if (typeof window === 'undefined' || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      const systemTheme = getSystemTheme();
      setResolvedTheme(systemTheme);
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