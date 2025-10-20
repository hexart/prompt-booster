import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  constraintsId: string; // 必需：指定约束容器的 ID
}

export const DraggableNotice: React.FC<DraggableNoticeProps> = ({
  items,
  title = "需要完成",
  onClose,
  initialPosition = { x: '20px', y: '20px' },
  className = '',
  isRTL = false,
  constraintsId // 必需：约束容器 ID
}) => {
  const [hasValidParent, setHasValidParent] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef<HTMLElement>(null);

  // 处理拖拽开始
  const handleDragStart = () => {
    setIsDragging(true);
    document.body.classList.add('dragging-active');
  };

  // 处理拖拽结束
  const handleDragEnd = () => {
    setIsDragging(false);
    document.body.classList.remove('dragging-active');
  };

  // 处理关闭动画
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      document.body.classList.remove('dragging-active');
    };
  }, []);

  // 检查指定容器并启动组件
  useEffect(() => {
    const timer = setTimeout(() => {
      // 查找指定的约束容器
      const targetContainer = document.getElementById(constraintsId);

      if (targetContainer) {
        const containerStyle = window.getComputedStyle(targetContainer);
        const position = containerStyle.position;

        if (['relative', 'absolute', 'fixed'].includes(position)) {
          // 容器有定位，设置为约束容器
          constraintsRef.current = targetContainer;
          setHasValidParent(true);
        } else {
          // 容器没有定位，显示警告
          setHasValidParent(false);
          console.warn(`DraggableNotice: 容器 "#${constraintsId}" 需要设置 position: relative/absolute/fixed，当前为: ${position}`);
        }
      } else {
        // 找不到指定容器
        setHasValidParent(false);
        console.warn(`DraggableNotice: 找不到 ID 为 "${constraintsId}" 的容器`);
      }

      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, [constraintsId]);

  // 键盘事件监听
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          handleClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, handleClose]);

  // 计算初始样式（用于CSS定位）
  const getInitialStyle = () => {
    if (!hasValidParent) {
      return {
        position: 'fixed' as const,
        left: isRTL ? '30px' : 'auto',
        right: isRTL ? 'auto' : '30px',
        top: '80px'
      };
    }

    // 解析传入的位置值，不使用默认值
    const baseX = parseFloat(initialPosition.x);
    const baseY = parseFloat(initialPosition.y);

    if (isRTL) {
      // RTL 模式：从左侧开始定位
      return {
        left: `${baseX}px`,
        top: `${baseY}px`,
        right: 'auto'
      };
    } else {
      // LTR 模式：从右侧开始定位
      return {
        right: `${baseX}px`,
        top: `${baseY}px`,
        left: 'auto'
      };
    }
  };

  // 过滤需要显示的项目
  const filteredItems = items.filter(item => item.isNeeded);
  if (filteredItems.length === 0) return null;

  // 统一的内容渲染
  const renderContent = (isWarning = false) => {
    const contentItems = isWarning
      ? [{ text: `请为容器 "#${constraintsId}" 添加 position: relative 样式以启用拖拽功能。` }]
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
          <motion.button
            onClick={handleClose}
            className="close-button p-2 m-1 dragable-notice-header-close"
            whileHover={{
              scale: 1.1,
              rotate: 180
            }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <XIcon size={16} />
          </motion.button>
        </div>
        <div className="p-3 me-2 text-sm space-y-2">
          {contentItems.map((item, index) => (
            <motion.div
              key={index}
              className="flex items-start gap-2"
              initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              <span className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0 dragable-notice-content-icon"></span>
              <span className="dragable-notice-content">{item.text}</span>
            </motion.div>
          ))}
        </div>
      </>
    );
  };

  return (
    <>
      {/* 全局样式注入 */}
      <style>{`
        body.dragging-active {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
          cursor: grabbing !important;
        }
        body.dragging-active * {
          cursor: grabbing !important;
        }
      `}</style>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            drag={hasValidParent}
            dragConstraints={hasValidParent ? constraintsRef : undefined}
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            initial={{
              opacity: 0,
              scale: 0.8
            }}
            animate={{
              opacity: 1,
              scale: 1
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
              transition: { duration: 0.3 }
            }}
            whileDrag={{
              scale: 1.05,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              cursor: "grabbing"
            }}
            style={{
              position: 'absolute',
              zIndex: 50,
              cursor: hasValidParent ? 'grab' : 'default',
              maxWidth: hasValidParent ? 'none' : '300px',
              direction: isRTL ? 'rtl' : 'ltr',
              ...getInitialStyle()
            }}
            className={`${className} ${isDragging ? 'is-dragging' : ''}`}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 300
            }}
            // 阻止拖拽元素内部的文本选择
            onMouseDown={(e) => {
              if (hasValidParent) {
                e.preventDefault();
              }
            }}
          >
            {renderContent(!hasValidParent)}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};