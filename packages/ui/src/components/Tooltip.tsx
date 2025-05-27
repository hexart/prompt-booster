import React, { useState, useRef, useEffect, cloneElement, ReactNode } from 'react';
import { useTheme } from './ThemeContext';
import { createPortal } from 'react-dom';

// 支持的提示框位置
type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Tooltip 组件 props：
 * @param content - 提示内容，支持字符串或React节点，允许手动换行
 * @param text - 提示文本内容
 * @param position - 提示框位置，支持 'top' | 'bottom' | 'left' | 'right'
 * @param theme - 主题模式，可传 'light' | 'dark' | 'system'
 * @param shadowClass - Tailwind 阴影强度类，例如 'shadow-md'、'shadow-lg'，控制提示框的阴影大小和模糊程度
 * @param shadowColor - Tailwind 阴影颜色类，例如 'shadow-blue-500/50'、'shadow-gray-700/30'，用于自定义阴影的颜色或透明度
 * @param duration - 过渡动画持续时间，单位毫秒，支持 0、150、200、300、500、700、1000
 * @param disabled - 是否禁用tooltip，设为true时不显示提示框
 */
interface TooltipProps {
    content?: ReactNode;
    text?: string;
    position?: TooltipPosition;
    theme?: string;
    shadowClass?: string;
    shadowColor?: string;
    duration?: 0 | 150 | 200 | 300 | 500 | 700 | 1000;
    disabled?: boolean;
    children: React.ReactElement<React.HTMLAttributes<HTMLElement>>; // 只包裹单个原生元素
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    text,
    position = 'top',
    theme,
    shadowClass = 'shadow-md',
    shadowColor = '',
    duration = 300,
    disabled = false,
    children,
}) => {
    // 获取主题上下文
    const themeContext = useTheme();
    // 引用子元素和提示框
    const triggerRef = useRef<HTMLElement | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    // 计算当前主题
    const currentTheme =
        theme === 'system'
            ? themeContext.resolvedTheme
            : theme || themeContext.resolvedTheme;

    // 设置 portal 目标
    useEffect(() => {
        setPortalTarget(document.body);
    }, []);

    // 计算提示框位置
    useEffect(() => {
        if (!triggerRef.current || !isVisible || disabled) return;
        const rect = triggerRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (position) {
            case 'top':
                top = rect.top - 8;
                left = rect.left + rect.width / 2;
                break;
            case 'bottom':
                top = rect.bottom + 8;
                left = rect.left + rect.width / 2;
                break;
            case 'left':
                top = rect.top + rect.height / 2;
                left = rect.left - 8;
                break;
            case 'right':
                top = rect.top + rect.height / 2;
                left = rect.right + 8;
                break;
        }

        setTooltipPosition({ top, left });
    }, [isVisible, position, disabled]);

    // 过渡类
    const durationClass = (() => {
        switch (duration) {
            case 0:
                return 'duration-0';
            case 150:
                return 'duration-150';
            case 200:
                return 'duration-200';
            case 300:
                return 'duration-300';
            case 500:
                return 'duration-500';
            case 700:
                return 'duration-700';
            case 1000:
                return 'duration-1000';
            default:
                return 'duration-300';
        }
    })();
    const transitionClass = duration === 0 ? '' : 'transition-opacity';

    // 主题样式
    const themeClasses =
        currentTheme === 'dark'
            ? 'bg-gray-800 text-gray-200 border-gray-700'
            : 'bg-white text-gray-700 border-gray-200';

    // 箭头样式和位置
    const getArrowInfo = () => {
        switch (position) {
            case 'top':
                return { style: { bottom: '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' }, className: 'border-r border-b' };
            case 'bottom':
                return { style: { top: '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' }, className: 'border-l border-t' };
            case 'left':
                return { style: { right: '-5px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' }, className: 'border-r border-t' };
            case 'right':
                return { style: { left: '-5px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' }, className: 'border-l border-b' };
            default:
                return { style: { bottom: '-5px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' }, className: 'border-r border-b' };
        }
    };
    const arrowInfo = getArrowInfo();

    // 构造触发元素 props
    type TriggerProps = React.RefAttributes<HTMLElement> & React.HTMLAttributes<HTMLElement>;
    const triggerProps: TriggerProps = {
        ref: (node) => {
            triggerRef.current = node;
            const childRef = (children as any).ref;
            if (typeof childRef === 'function') childRef(node);
            else if (childRef) (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
        },
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
            if (!disabled) setIsVisible(true);
            children.props.onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
            setIsVisible(false);
            children.props.onMouseLeave?.(e);
        },
        onFocus: (e: React.FocusEvent<HTMLElement>) => {
            if (!disabled) setIsVisible(true);
            children.props.onFocus?.(e);
        },
        onBlur: (e: React.FocusEvent<HTMLElement>) => {
            setIsVisible(false);
            children.props.onBlur?.(e);
        },
    };

    const trigger = cloneElement(children, triggerProps);

    // 计算 tooltip 样式
    const tooltipStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 9999,
        top: tooltipPosition.top,
        left: tooltipPosition.left,
        transform:
            position === 'top'
                ? 'translate(-50%, -100%)'
                : position === 'bottom'
                    ? 'translate(-50%, 0)'
                    : position === 'left'
                        ? 'translate(-100%, -50%)'
                        : 'translate(0, -50%)',
    };

    // 处理内容显示
    const tooltipContent = content || text || '';

    // 如果禁用或没有内容，不渲染tooltip
    const shouldRenderTooltip = !disabled && (!!tooltipContent) && portalTarget;

    return (
        <>
            {trigger}
            {shouldRenderTooltip &&
                createPortal(
                    <div
                        role="tooltip"
                        style={tooltipStyle}
                        className={`px-2 py-1 text-xs text-center font-medium ${themeClasses} rounded-md ${shadowClass} ${shadowColor} whitespace-pre-line border ${transitionClass} ${durationClass} ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    >
                        {tooltipContent}
                        <div style={arrowInfo.style} className={`absolute w-2 h-2 tooltip-arrow ${themeClasses} ${arrowInfo.className}`}></div>
                    </div>,
                    portalTarget
                )}
        </>
    );
};