// packages/ui/src/components/AutoScrollTextarea.tsx
import React, { TextareaHTMLAttributes, useState, useEffect, useRef } from 'react';
import { useAutoScroll } from '../hooks/useAutoscroll';
import { ArrowDownIcon, CopyIcon, CheckIcon } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { toast } from 'sonner';

/**
 * 自动滚动文本输入区组件
 * 
 * 专为textarea设计，自动处理输入时的滚动行为
 */
interface AutoScrollTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    // 是否处于内容流式生成状态
    streaming?: boolean;

    // 按钮文本
    buttonText?: string;

    // 检测滚动到底部的阈值
    threshold?: number;

    // 是否显示空状态时的垂直居中占位符
    centerPlaceholder?: boolean;

    // 是否显示复制按钮
    showCopyButton?: boolean;
}

export const AutoScrollTextarea: React.FC<AutoScrollTextareaProps> = ({
    streaming = false,
    buttonText,
    threshold = 5,
    className = '',
    onChange,
    centerPlaceholder = false,
    placeholder,
    value = '',
    style,
    showCopyButton = true,
    ...restProps
}) => {
    const {
        elementRef,
        scrollToBottom,
        shouldShowButton,
        onContentChange
    } = useAutoScroll<HTMLTextAreaElement>({
        streaming,
        threshold
    });

    // 添加状态来控制按钮显示，防止闪烁
    const [isButtonVisible, setIsButtonVisible] = useState(shouldShowButton);
    const [isScrollingProgrammatically, setIsScrollingProgrammatically] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [copied, setCopied] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // 检查是否为空状态
    const isEmpty = value === undefined || value === null || String(value).trim() === '';
    const showCenteredPlaceholder = isEmpty && centerPlaceholder;

    // 处理文本复制
    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();

        const textValue = String(value);
        if (!textValue.trim()) return; // 如果没有内容则不复制

        // 复制文本到剪贴板
        navigator.clipboard.writeText(textValue)
            .then(() => {
                setCopied(true);
                // 显示提示消息
                toast.success('文本已复制到剪贴板');
                // 2秒后重置复制状态
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => {
                console.error('无法复制文本: ', err);
            });
    };

    // 监控shouldShowButton变化，但添加防抖动逻辑
    useEffect(() => {
        // 如果是程序控制的滚动，则不立即响应shouldShowButton的变化
        if (isScrollingProgrammatically) return;

        // 仅在shouldShowButton为true时立即显示按钮
        if (shouldShowButton && !isButtonVisible) {
            setIsButtonVisible(true);
        }
        // 当shouldShowButton为false时，延迟隐藏按钮，防止闪烁
        else if (!shouldShowButton && isButtonVisible) {
            const timer = setTimeout(() => {
                setIsButtonVisible(false);
            }, 200); // 添加200ms延迟
            return () => clearTimeout(timer);
        }
    }, [shouldShowButton, isButtonVisible, isScrollingProgrammatically]);

    // 处理onChange事件，增加滚动处理
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (onChange) {
            onChange(e);
        }
        // 内容变化时通知滚动系统
        onContentChange();
    };

    // 包装scrollToBottom函数，添加防闪烁逻辑
    const handleScrollToBottom = () => {
        // 标记为程序控制的滚动
        setIsScrollingProgrammatically(true);
        // 隐藏按钮
        setIsButtonVisible(false);

        // 执行滚动
        scrollToBottom(true);

        // 300ms后恢复正常状态监控
        setTimeout(() => {
            setIsScrollingProgrammatically(false);
        }, 300);
    };

    // 确定按钮形状的类名
    const buttonClassName = `absolute z-10 bg-blue-500/80 backdrop-blur-xs text-white shadow-md hover:bg-blue-600/80 transition-all duration-600 ease-in-out flex items-center gap-1 bottom-4 left-1/2 -translate-x-1/2 animate-bounce motion-reduce:animate-none ${buttonText ? 'px-4 py-2 rounded-full' : 'p-2 rounded-full aspect-square'}`;

    // 带有悬停状态的textarea类名
    const textareaClassName = `w-full scrollable rounded-md p-3 border outline-none transition-colors duration-200 
    ${isHovered
            ? 'border-gray-300 dark:border-gray-500'
            : 'border-gray-200 dark:border-gray-600'
        }
    focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${className}`;

    return (
        <div
            className="flex flex-grow relative w-full"
            ref={containerRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {showCenteredPlaceholder ? (
                <div className="relative w-full h-full flex-grow min-h-[380px] md:min-h-0">
                    {/* 背景textarea，透明但可以接收焦点 */}
                    <textarea
                        ref={elementRef}
                        className={`w-full h-full absolute inset-0 opacity-0 ${className}`}
                        onChange={handleChange}
                        value={value as string}
                        {...restProps}
                    />

                    {/* 居中的占位符文本 - 使用Tailwind类名 */}
                    <div
                        className={`w-full h-full absolute inset-0 flex items-center justify-center text-center italic opacity-60 pointer-events-none ${className}`}
                        style={style}
                    >
                        {placeholder}
                    </div>
                </div>
            ) : (
                <textarea
                    ref={elementRef}
                    className={textareaClassName}
                    onChange={handleChange}
                    placeholder={placeholder as string}
                    value={value as string}
                    style={style}
                    {...restProps}
                />
            )}

            {isButtonVisible && (
                <button
                    onClick={handleScrollToBottom}
                    className={buttonClassName}
                >
                    <ArrowDownIcon size={16} />
                    {buttonText && <span>&nbsp;{buttonText}</span>}
                </button>
            )}

            {/* 复制按钮 - 仅在悬停且有内容时显示 */}
            {showCopyButton && isHovered && !isEmpty && (
                <Tooltip text="复制" position="bottom">
                    <button
                        className="absolute top-2 right-2 p-2 rounded-md bg-white/80 text-blue-500 hover:bg-blue-50 dark:bg-gray-800/60 dark:text-blue-400 dark:hover:bg-gray-800"
                        onClick={handleCopy}
                        title="复制文本"
                    >
                        {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
                    </button>
                </Tooltip>
            )}
        </div>
    );
};