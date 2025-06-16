import React, { useState, useRef, useEffect } from 'react';
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
  const constraintsRef = useRef<HTMLElement>(null);

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

  // 过滤需要显示的项目
  const filteredItems = items.filter(item => item.isNeeded);
  if (filteredItems.length === 0) return null;

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

    // 反向定位逻辑：LTR 从右侧开始，RTL 从左侧开始
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

  // 处理关闭动画
  const handleClose = () => {
    onClose();
  };

  // 统一的内容渲染
  const renderContent = (isWarning = false) => {
    const contentItems = isWarning 
      ? [{ text: `请为容器 "#${constraintsId}" 添加 position: relative 样式以启用拖拽功能。` }]
      : filteredItems;

    return (
      <>
        <div className="flex justify-between items-center dragable-notice-header">
          <div className={`flex items-center p-3 gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
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
            className="close-button p-2 m-1 transition-transform duration-300 hover:rotate-180 dragable-notice-header-close"
            whileHover={{ rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <XIcon size={16} />
          </motion.button>
        </div>
        <div className={`p-3 text-sm space-y-2 ${isRTL ? 'text-right' : 'text-left'}`}>
          {contentItems.map((item, index) => (
            <motion.div 
              key={index} 
              className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              initial={{ opacity: 0, x: isRTL ? 10 : -10 }} // RTL 时从右侧滑入
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
    <AnimatePresence>
      {isVisible && (
        <motion.div
          drag={hasValidParent} // 只有在有效容器时才允许拖拽
          dragConstraints={hasValidParent ? constraintsRef : undefined}
          dragElastic={0.1}
          dragMomentum={false}
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
            position: 'absolute', // 使用 absolute 定位相对于父容器
            zIndex: 50,
            cursor: hasValidParent ? 'grab' : 'default',
            maxWidth: hasValidParent ? 'none' : '300px',
            direction: isRTL ? 'rtl' : 'ltr', // 设置文本方向
            // 应用计算出的初始样式
            ...getInitialStyle()
          }}
          className={`${className}`}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 300
          }}
        >
          {renderContent(!hasValidParent)}
        </motion.div>
      )}
    </AnimatePresence>
  );
};