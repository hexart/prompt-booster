import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquareWarningIcon, XIcon, AlertTriangleIcon } from 'lucide-react';

interface RequirementItem {
  text: string;
  isNeeded: boolean;
}

interface DraggableNoticeProps {
  items: RequirementItem[];
  title?: string;
  onClose: () => void;
  initialPosition?: { x: string; y: string };
  className?: string;
  isRTL?: boolean;
}

export const DraggableNotice: React.FC<DraggableNoticeProps> = ({
  items,
  title = "需要完成",
  onClose,
  initialPosition = { x: '20px', y: '20px' },
  className = '',
  isRTL = false
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasBeenDragged, setHasBeenDragged] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasValidParent, setHasValidParent] = useState(true);

  const floatingRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // 检查父容器定位并启动组件
  useEffect(() => {
    const timer = setTimeout(() => {
      if (floatingRef.current?.parentElement) {
        const parentStyle = window.getComputedStyle(floatingRef.current.parentElement);
        const pos = parentStyle.position;
        setHasValidParent(['relative', 'absolute', 'fixed'].includes(pos));
        
        if (!['relative', 'absolute', 'fixed'].includes(pos)) {
          console.warn('DraggableNotice: 父容器需要设置 position: relative/absolute/fixed');
        }
      }
      // 启动淡入动画
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // 统一的位置约束和设置
  const constrainAndSetPosition = useCallback((x: number, y: number) => {
    if (!floatingRef.current?.offsetParent) return;

    const container = floatingRef.current.offsetParent as HTMLElement;
    const elementRect = floatingRef.current.getBoundingClientRect();
    const containerStyle = window.getComputedStyle(container);
    
    const padding = {
      left: parseInt(containerStyle.paddingLeft) || 0,
      top: parseInt(containerStyle.paddingTop) || 0,
      right: parseInt(containerStyle.paddingRight) || 0,
      bottom: parseInt(containerStyle.paddingBottom) || 0
    };

    const maxX = container.offsetWidth - padding.left - padding.right - elementRect.width;
    const maxY = container.offsetHeight - padding.top - padding.bottom - elementRect.height;

    const constrainedX = Math.max(padding.left, Math.min(x, maxX + padding.left));
    const constrainedY = Math.max(padding.top, Math.min(y, maxY + padding.top));

    // 只有当位置真正改变时才更新，避免不必要的重渲染
    const newPosition = { x: `${Math.round(constrainedX)}px`, y: `${Math.round(constrainedY)}px` };
    setPosition(prev => {
      if (prev.x === newPosition.x && prev.y === newPosition.y) {
        return prev; // 位置未变化，不触发更新
      }
      return newPosition;
    });
  }, []);

  // 统一的拖拽开始处理
  const handleDragStart = (clientX: number, clientY: number) => {
    if (!floatingRef.current) return;
    
    setIsDragging(true);
    const rect = floatingRef.current.getBoundingClientRect();
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
  };

  // 统一的拖拽移动处理
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !floatingRef.current?.offsetParent) return;

    const containerRect = floatingRef.current.offsetParent.getBoundingClientRect();
    const rawX = clientX - containerRect.left - dragOffset.x;
    const rawY = clientY - containerRect.top - dragOffset.y;

    constrainAndSetPosition(rawX, rawY);
    setHasBeenDragged(true);
  }, [isDragging, dragOffset, constrainAndSetPosition]);

  // 响应容器大小变化
  useEffect(() => {
    if (!floatingRef.current?.offsetParent || !hasValidParent || !hasBeenDragged) return;

    const parentElement = floatingRef.current.offsetParent as HTMLElement;
    let timeoutId: number | null = null;

    resizeObserverRef.current = new ResizeObserver(() => {
      // 防抖处理，避免频繁调整
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!isDragging) { // 只在非拖拽状态下调整位置
          const currentX = parseFloat(position.x) || 0;
          const currentY = parseFloat(position.y) || 0;
          constrainAndSetPosition(currentX, currentY);
        }
      }, 100); // 100ms 防抖
    });

    resizeObserverRef.current.observe(parentElement);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      resizeObserverRef.current?.disconnect();
    };
  }, [hasValidParent, hasBeenDragged, position, constrainAndSetPosition, isDragging]);

  // 事件监听器
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const handleEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
    window.addEventListener('touchcancel', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [isDragging, handleDragMove]);

  // 处理拖拽开始事件
  const onPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as Element).closest('.close-button')) return;
    
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    handleDragStart(clientX, clientY);
  };

  // 过滤需要显示的项目
  const filteredItems = items.filter(item => item.isNeeded);
  if (filteredItems.length === 0) return null;

  // 动画类
  const animationClass = isClosing 
    ? 'fade-out' 
    : isVisible 
      ? 'fade-in' 
      : 'fade-hidden';

  // 处理关闭动画
  const handleClose = () => {
    setIsClosing(true);
    // 等待淡出动画完成后再执行关闭回调
    setTimeout(() => {
      onClose();
    }, 500); // 与CSS动画时长保持一致
  };

  // 统一的内容渲染
  const renderContent = (isWarning = false) => {
    const contentItems = isWarning 
      ? [{ text: `请为父容器添加 position: relative 样式以启用拖拽功能。` }]
      : filteredItems;

    return (
      <>
        <div className="flex justify-between items-center dragable-notice-header">
          <div className="flex items-center p-3 gap-2">
            {isWarning ? (
              <AlertTriangleIcon size={20} className='dragable-notice-header-icon' />
            ) : (
              <MessageSquareWarningIcon size={20} className='dragable-notice-header-icon' />
            )}
            <h3 className="text-sm font-medium dragable-notice-header-title">
              {isWarning ? '配置提示' : title}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="close-button p-2 m-1 transition-transform duration-300 hover:rotate-180 dragable-notice-header-close"
          >
            <XIcon size={16} />
          </button>
        </div>
        <div className="p-3 text-sm space-y-2">
          {contentItems.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0 dragable-notice-content-icon"></span>
              <span className="dragable-notice-content">{item.text}</span>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div
      ref={floatingRef}
      className={`absolute z-50 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className} ${animationClass}`}
      style={hasBeenDragged ? {
        left: position.x,
        top: position.y
      } : {
        ...(hasValidParent ? {
          [isRTL ? 'left' : 'right']: initialPosition.x,
          top: initialPosition.y
        } : {
          left: '30px',
          top: '80px',
          maxWidth: '300px'
        })
      }}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
    >
      {renderContent(!hasValidParent)}
    </div>
  );
};