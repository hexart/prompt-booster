// packages/ui/src/components/AutoScrollTextarea.tsx
import React, { TextareaHTMLAttributes, useState, useEffect, useRef } from 'react';
import { useAutoScroll } from '../hooks/useAutoscroll';
import { ArrowDownIcon } from 'lucide-react';
import { ActionButtons } from './ActionButtons';

/**
 * 自动滚动文本输入区组件
 * 
 * 专为textarea设计，自动处理输入时的滚动行为
 */
interface AutoScrollTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id?: string;
  // 是否处于内容流式生成状态
  streaming?: boolean;

  // 自定义CSS类
  className?: string;

  // 按钮文本
  buttonText?: string;

  // 检测滚动到底部的阈值
  threshold?: number;

  // 是否显示空状态时的垂直居中占位符
  centerPlaceholder?: boolean;

  // 是否显示复制按钮
  showCopyButton?: boolean;

  /** 文件名前缀（用于下载） */
  filename?: string;

  /** 是否显示下载MD按钮 */
  showDownloadMd?: boolean;

  /** 是否显示下载DOCX按钮 */
  showDownloadDocx?: boolean;

  /** 按钮位置 */
  buttonPosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

export const AutoScrollTextarea: React.FC<AutoScrollTextareaProps> = ({
  id,
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
  filename = 'content',
  showDownloadMd = true,
  showDownloadDocx = true,
  buttonPosition = 'top-right',
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
  const containerRef = useRef<HTMLDivElement>(null);

  // 检查是否为空状态
  const isEmpty = value === undefined || value === null || String(value).trim() === '';
  const showCenteredPlaceholder = isEmpty && centerPlaceholder;

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

  // 自动滚动按钮类名
  const buttonClassName = `absolute z-10 backdrop-blur-xs shadow-md text-white bg-blue-500/80 hover:bg-blue-600/80 transition-all duration-1000 ease-in-out flex items-center gap-1 bottom-4 left-1/2 -translate-x-1/2 animate-bounce motion-reduce:animate-none ${buttonText ? 'px-4 py-2 rounded-full' : 'p-2 rounded-full aspect-square'}`;

  return (
    <div
      className="flex flex-grow relative w-full"
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showCenteredPlaceholder ? (
        <div className="relative w-full h-full flex-grow min-h-[380px] md:min-h-0">
          {/* 背景textarea */}
          <textarea
            ref={elementRef}
            id={id}
            disabled
            className={`w-full h-full absolute inset-0 input-textarea ${className}
                        ${isHovered
                ? 'autoscroll-border-hover'
                : 'autoscroll-border'
              }`}
            onChange={handleChange}
            value={value as string}
            {...restProps}
          />

          {/* 居中的占位符文本 - 使用Tailwind类名 */}
          <div
            className={`w-full h-full absolute inset-0 flex items-center justify-center text-center italic pointer-events-none autoscroll-placeholder`}
            style={style}
          >
            {placeholder}
          </div>
        </div>
      ) : (
        // 正常有内容的textarea
        <textarea
          ref={elementRef}
          id={id}
          className={`w-full scrollable rounded-md p-3 transition-colors duration-200 input-textarea ${className}
                    ${isHovered
              ? 'autoscroll-border-hover'
              : 'autoscroll-border'
            }`}
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
      <ActionButtons
        content={String(value || '')}
        filename={filename}
        showCopy={showCopyButton}
        showDownloadMd={showDownloadMd}
        showDownloadDocx={showDownloadDocx}
        position={buttonPosition}
        isHovered={isHovered}
        showOnHover={true}
        streaming={streaming}
      />
    </div>
  );
};