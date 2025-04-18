// packages/ui/src/components/Tooltip.tsx
/**
 * Tooltip 组件
 * 
 * 使用说明：
 * 1. 将需要显示提示的元素包裹在 Tooltip 组件中
 * 2. 提供必要的属性，如提示文本
 * 
 * 支持的属性：
 * - text: string - 提示文本内容 (必填)
 * - position: 'top' | 'bottom' | 'left' | 'right' - 提示框位置 (默认: 'top')
 * - theme: string - 提示框主题，通常传入当前应用的主题值或 resolvedTheme (默认: 'light')
 * - shadowClass: string - 完整的 Tailwind 阴影大小类名 (例如: 'shadow-lg', 'shadow-xl', 'shadow-none'，默认: 'shadow-md')
 * - shadowColor: string - 完整的 Tailwind 阴影颜色类名 (例如: 'shadow-blue-500/50', 'shadow-teal-900/30')
 * - duration: 0 | 150 | 200 | 300 | 500 | 700 | 1000 - 过渡动画持续时间，单位毫秒 (默认: 300，0表示无动画)
 * - children: React.ReactNode - 触发提示的子元素 (必填)
 * 
 * 示例:
 * ```tsx
 * // 基本用法
 * <Tooltip text="提示文本">
 *   <button>悬停显示提示</button>
 * </Tooltip>
 * 
 * // 指定位置
 * <Tooltip text="底部提示" position="bottom">
 *   <button>悬停显示底部提示</button>
 * </Tooltip>
 * 
 * // 指定主题 (从 ThemeContext 获取)
 * const { resolvedTheme } = useTheme();
 * <Tooltip text="跟随应用主题" theme={resolvedTheme}>
 *   <button>当前主题的提示</button>
 * </Tooltip>
 * 
 * // 同时指定阴影大小和颜色
 * <Tooltip 
 *   text="自定义阴影" 
 *   shadowClass="shadow-xl" 
 *   shadowColor="shadow-blue-500/50"
 * >
 *   <button>悬停显示自定义阴影提示</button>
 * </Tooltip>
 * 
 * // 无阴影
 * <Tooltip text="无阴影提示" shadowClass="shadow-none">
 *   <button>悬停显示无阴影提示</button>
 * </Tooltip>
 * 
 * // 自定义过渡动画时间
 * <Tooltip text="立即显示/隐藏" duration={0}>
 *   <button>无过渡动画</button>
 * </Tooltip>
 * 
 * <Tooltip text="快速过渡" duration={150}>
 *   <button>快速显示/隐藏</button>
 * </Tooltip>
 * 
 * <Tooltip text="慢速过渡" duration={700}>
 *   <button>缓慢显示/隐藏</button>
 * </Tooltip>
 * ```
 */
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import { createPortal } from 'react-dom';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
    text: string;
    position?: TooltipPosition;
    theme?: string;
    shadowClass?: string;
    shadowColor?: string;
    duration?: 0 | 150 | 200 | 300 | 500 | 700 | 1000;
    children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({
    text,
    position = 'top',
    theme,
    shadowClass = 'shadow-md',
    shadowColor = '',
    duration = 300,
    children
}) => {
    // 获取主题上下文
    const themeContext = useTheme();
    // 引用子元素和提示框
    const childRef = useRef<HTMLDivElement>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [isVisible, setIsVisible] = useState(false);

    // 判断传入的theme是否为'system'，如果是，则使用resolvedTheme
    const currentTheme = theme === 'system'
        ? themeContext.resolvedTheme
        : (theme || themeContext.resolvedTheme);

    // 计算提示框位置
    useEffect(() => {
        if (!childRef.current || !isVisible) return;

        const childRect = childRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (position) {
            case 'top':
                top = childRect.top - 8; // 上方留出一些间距
                left = childRect.left + childRect.width / 2;
                break;
            case 'bottom':
                top = childRect.bottom + 8; // 下方留出一些间距
                left = childRect.left + childRect.width / 2;
                break;
            case 'left':
                top = childRect.top + childRect.height / 2;
                left = childRect.left - 8; // 左侧留出一些间距
                break;
            case 'right':
                top = childRect.top + childRect.height / 2;
                left = childRect.right + 8; // 右侧留出一些间距
                break;
        }

        setTooltipPosition({ top, left });
    }, [position, isVisible]);

    // 获取过渡相关类
    const durationClass = (() => {
        switch (duration) {
            case 0: return 'duration-0'; // 立即显示/隐藏，无过渡效果
            case 150: return 'duration-150';
            case 200: return 'duration-200';
            case 300: return 'duration-300';
            case 500: return 'duration-500';
            case 700: return 'duration-700';
            case 1000: return 'duration-1000';
            default: return 'duration-300';
        }
    })();

    const transitionClass = duration === 0 ? '' : 'transition-opacity';

    // Apply theme-based classes
    const themeClasses = currentTheme === 'dark'
        ? 'bg-gray-800 text-gray-200 border-gray-700'
        : 'bg-white text-gray-700 border-gray-200';

    // Portal target
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        // 设置 portal 目标为 document.body
        setPortalTarget(document.body);
    }, []);

    // 计算箭头位置及样式
    const getArrowStyle = () => {
        switch (position) {
            case 'top':
                return {
                    style: { bottom: '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' },
                    className: 'border-r border-b'
                };
            case 'bottom':
                return {
                    style: { top: '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' },
                    className: 'border-l border-t'
                };
            case 'left':
                return {
                    style: { right: '-5px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' },
                    className: 'border-r border-t'
                };
            case 'right':
                return {
                    style: { left: '-5px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' },
                    className: 'border-l border-b'
                };
            default:
                return {
                    style: { bottom: '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' },
                    className: 'border-r border-b'
                };
        }
    };

    const arrowInfo = getArrowStyle();

    // 获取提示框样式
    const getTooltipStyle = () => {
        const style: React.CSSProperties = {
            position: 'fixed',
            zIndex: 9999,
            ...tooltipPosition
        };

        // 根据位置调整定位
        switch (position) {
            case 'top':
                style.transform = 'translate(-50%, -100%)';
                break;
            case 'bottom':
                style.transform = 'translate(-50%, 0)';
                break;
            case 'left':
                style.transform = 'translate(-100%, -50%)';
                break;
            case 'right':
                style.transform = 'translate(0, -50%)';
                break;
        }

        return style;
    };

    return (
        <div
            ref={childRef}
            className="inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onFocus={() => setIsVisible(true)}
            onBlur={() => setIsVisible(false)}
        >
            {children}

            {portalTarget && isVisible && createPortal(
                <div
                    role="tooltip"
                    style={getTooltipStyle()}
                    className={`px-2 py-1 text-xs font-medium ${themeClasses} rounded-md ${shadowClass} ${shadowColor} border ${transitionClass} ${durationClass} pointer-events-none`}
                >
                    {text}
                    <div
                        style={arrowInfo.style}
                        className={`absolute w-2 h-2 ${themeClasses} ${arrowInfo.className}`}
                    ></div>
                </div>,
                portalTarget
            )}
        </div>
    );
};