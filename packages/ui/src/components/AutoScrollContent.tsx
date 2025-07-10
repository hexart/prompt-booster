// packages/ui/src/components/AutoScrollContent.tsx
import React, { useEffect, useState, useRef, CSSProperties } from 'react';
import { useAutoScroll } from '../hooks/useAutoscroll';
import { ArrowDownIcon } from 'lucide-react';
import { ActionButtons } from './ActionButtons';
import { Markdown } from './Markdown';

/**
 * 自动滚动内容显示组件
 * 
 * 用于显示可能包含HTML或Markdown的只读内容，带自动滚动功能
 */
interface AutoScrollContentProps {
  // 显示的内容
  content: string;

  // 是否解析Markdown
  renderMarkdown?: (text: string) => string;

  // 自定义CSS类
  className?: string;

  // 自定义内联样式
  style?: React.CSSProperties;

  // 高度
  height?: string | number;

  // 是否处于内容流式生成状态
  streaming?: boolean;

  // 按钮文本
  buttonText?: string;

  // 阈值
  threshold?: number;

  // 是否允许HTML
  allowHtml?: boolean;

  // 是否允许Markdown
  enableMarkdown?: boolean;

  // 占位文本，当content为空时显示
  placeholder?: string;

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

  /** 是否为RTL语言 */
  isRTL?: boolean;

  /** 是否已被用户取消 */
  isCancelled?: boolean;
}

export const AutoScrollContent: React.FC<AutoScrollContentProps> = ({
  content,
  className = '',
  style = {},
  streaming = false,
  buttonText,
  threshold = 5,
  allowHtml = false,
  enableMarkdown = true,
  placeholder = '',
  showCopyButton = true,
  filename = 'content',
  showDownloadMd = true,
  showDownloadDocx = true,
  buttonPosition = 'top-right',
  isRTL = false,
  isCancelled = false,
}) => {
  const {
    elementRef,
    scrollToBottom,
    shouldShowButton,
    onContentChange
  } = useAutoScroll<HTMLDivElement>({
    streaming,
    threshold
  });


  const contentRef = useRef(content);
  // 添加状态来控制按钮显示，防止闪烁
  const [isButtonVisible, setIsButtonVisible] = useState(shouldShowButton);
  const [isScrollingProgrammatically, setIsScrollingProgrammatically] = useState(false);

  // 监控内容变化
  useEffect(() => {
    if (contentRef.current !== content) {
      contentRef.current = content;
      onContentChange();
    }
  }, [content, onContentChange]);

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

  // 合并样式 - 修复类型问题
  const containerStyle: React.CSSProperties = {
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    minHeight: 0,
    ...(style as CSSProperties)
  };

  // 处理滚动
  const handleScrollToBottom = () => {
    setIsScrollingProgrammatically(true);
    setIsButtonVisible(false);
    scrollToBottom(true);
    setTimeout(() => {
      setIsScrollingProgrammatically(false);
    }, 300);
  };

  // 检查内容是否为空
  const isEmpty = !content || content.trim() === '';

  // 悬停状态
  const [isHovered, setIsHovered] = useState(false);

  // 确定按钮形状的类名，使用纯 Tailwind 类名，并自定义弹跳动画速度
  const buttonClassName = `absolute z-10 bottom-4 left-1/2 -translate-x-1/2 bg-blue-500/80 backdrop-blur-xs text-white shadow-md hover:bg-blue-600/80 transition-all duration-1000 ease-in-out flex items-center gap-1 animate-bounce motion-reduce:animate-none ${buttonText ? 'px-4 py-2 rounded-full' : 'p-2 rounded-full aspect-square'} [animation-duration:1500ms]`;

  return (
    <div
      className="flex flex-grow relative w-full h-full"
      style={{ flex: '1 1 auto', minHeight: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={elementRef}
        className={`w-full h-auto overflow-auto ${className}
                ${isHovered
            ? 'autoscroll-border-hover'
            : 'autoscroll-border'
          }`}
        style={containerStyle}
      >
        {isEmpty && placeholder ? (
          // 显示占位文本
          <div className="w-full h-full flex items-center justify-center italic autoscroll-placeholder">
            {placeholder}
          </div>
        ) : enableMarkdown ? (
          <Markdown
            content={content}
            allowHtml={allowHtml}
            streaming={streaming}
            isRTL={isRTL}
            isCancelled={isCancelled}
          />
        ) : (
          // 纯文本模式 - 只处理换行
          <div className="whitespace-pre-wrap break-words">
            {content.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {isButtonVisible && (
        <button
          onClick={handleScrollToBottom}
          className={buttonClassName}
        >
          <ArrowDownIcon size={16} />
          {buttonText && <span>{buttonText}</span>}
        </button>
      )}

      {/* 复制按钮 - 仅在悬停且有内容时显示 */}
      <ActionButtons
        content={content}
        filename={filename}
        showCopy={showCopyButton}
        showDownloadMd={showDownloadMd}
        showDownloadDocx={showDownloadDocx}
        position={buttonPosition}
        isHovered={isHovered}  // 传递悬停状态
        streaming={streaming}
      />
    </div>
  );
};