// packages/ui/src/components/Dialog.tsx
import React, { useEffect, useRef } from 'react';
import { XIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  maxWidth?: string;
  showCloseButton?: boolean;
  clickOutside?: boolean;
}

// 创建一个上下文以便子组件可以访问对话框的容器引用
export const DialogContext = React.createContext<{
  containerRef: React.RefObject<HTMLDivElement | null>;
}>({
  containerRef: { current: null }
});

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
  maxWidth = 'max-w-[500px]',
  showCloseButton = true,
  clickOutside = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 当对话框打开时禁用主页面滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (clickOutside && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Dialog内容
  const dialogContent = (
    <DialogContext.Provider value={{ containerRef }}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            className="fixed inset-0 flex overflow-y-auto z-50 mask"
            ref={containerRef}
            onClick={handleClickOutside}
            style={{
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: '40px 0'
            }}
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <motion.div
              className={`p-6 rounded-3xl shadow-2xl dialog ${maxWidth} w-full mx-4 my-auto ${className}`}
              style={{
                marginTop: 'auto',
                marginBottom: 'auto'
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{
                type: "spring",
                damping: 20,
                stiffness: 300,
                duration: 0.4
              }}
            >
              {/* 固定标题栏 */}
              {(title || showCloseButton) && (
                <div className="mb-4 flex justify-between items-center">
                  {title && (
                    <h2 className="text-xl font-semibold dialog-title">
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <motion.button
                      onClick={onClose}
                      className="dialog-close-button"
                      whileHover={{
                        scale: 1.1,
                        rotate: 180
                      }}
                      whileTap={{ scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <XIcon size={20} />
                    </motion.button>
                  )}
                </div>
              )}

              <div className="py-6 dialog-content">
                {children}
              </div>

              {/* 对话框 footer 区域 */}
              {footer && (
                <div className="mt-4">
                  {footer}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );

  // 使用Portal渲染到body
  return typeof document === 'object' ? createPortal(dialogContent, document.body) : null;
};

export default Dialog;