// packages/ui/src/components/Dialog.tsx
import React, { useEffect, useRef, useState } from 'react';
import { XIcon } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';

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
  enableMouseTilt?: boolean;
}

// 创建一个上下文以便子组件可以访问对话框的容器引用
export const DialogContext = React.createContext<{
  containerRef: React.RefObject<HTMLDivElement | null>;
}>({
  containerRef: { current: null }
});

// 倾斜效果配置
const TILT_CONFIG = {
  maxTiltAngle: 10,        // 最大倾斜角度（度）
  maxMouseRange: 0.5,      // 鼠标移动范围 [-0.5, 0.5]
  scaleIntensity: 0.05,    // 缩放强度
  translateZIntensity: 20, // Z轴位移强度
  shadowIntensity: {       // 阴影强度
    base: 0.2,
    multiplier: 0.3,
    blur: 50,
    spread: 25
  },
  springConfig: {          // 弹性动画配置
    stiffness: 300,
    damping: 30,
    mass: 0.8
  }
};

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
  enableMouseTilt = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  
  // Motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  
  // 平滑动画值
  const smoothX = useSpring(targetX, TILT_CONFIG.springConfig);
  const smoothY = useSpring(targetY, TILT_CONFIG.springConfig);
  
  // 变换效果
  const rotateX = useTransform(smoothY, [-TILT_CONFIG.maxMouseRange, TILT_CONFIG.maxMouseRange], [TILT_CONFIG.maxTiltAngle, -TILT_CONFIG.maxTiltAngle]);
  const rotateY = useTransform(smoothX, [-TILT_CONFIG.maxMouseRange, TILT_CONFIG.maxMouseRange], [-TILT_CONFIG.maxTiltAngle, TILT_CONFIG.maxTiltAngle]);
  
  const scale = useTransform([smoothX, smoothY], ([x, y]: number[]) => {
    const distance = Math.sqrt(x * x + y * y);
    return 1 - distance * TILT_CONFIG.scaleIntensity;
  });
  
  const translateZ = useTransform([smoothX, smoothY], ([x, y]: number[]) => {
    const distance = Math.sqrt(x * x + y * y);
    return distance * TILT_CONFIG.translateZIntensity;
  });
  
  const shadowFilter = useTransform([smoothX, smoothY], ([x, y]: number[]) => {
    const distance = Math.sqrt(x * x + y * y);
    const intensity = TILT_CONFIG.shadowIntensity.base + distance * TILT_CONFIG.shadowIntensity.multiplier;
    return `drop-shadow(0 ${intensity * TILT_CONFIG.shadowIntensity.spread}px ${intensity * TILT_CONFIG.shadowIntensity.blur}px rgba(0,0,0,${intensity}))`;
  });
  
  // 同步目标值
  useEffect(() => {
    const updateTarget = () => {
      if (isHovering) {
        targetX.set(0);
        targetY.set(0);
      } else {
        targetX.set(mouseX.get());
        targetY.set(mouseY.get());
      }
    };
    
    updateTarget();
    
    const unsubscribeX = mouseX.on("change", () => !isHovering && targetX.set(mouseX.get()));
    const unsubscribeY = mouseY.on("change", () => !isHovering && targetY.set(mouseY.get()));
    
    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [isHovering, mouseX, mouseY, targetX, targetY]);
  
  // 禁用滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [isOpen]);

  const handleContainerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableMouseTilt || !dialogRef.current) return;
    
    const rect = dialogRef.current.getBoundingClientRect();
    const x = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
    const y = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
    
    // 使用配置的最大范围限制
    mouseX.set(Math.max(-TILT_CONFIG.maxMouseRange, Math.min(TILT_CONFIG.maxMouseRange, x)));
    mouseY.set(Math.max(-TILT_CONFIG.maxMouseRange, Math.min(TILT_CONFIG.maxMouseRange, y)));
  };

  const handleContainerMouseLeave = () => {
    if (!enableMouseTilt) return;
    mouseX.set(0);
    mouseY.set(0);
  };

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
            onMouseMove={handleContainerMouseMove}
            onMouseLeave={handleContainerMouseLeave}
            style={{
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: '40px 0',
              perspective: 1200,
              perspectiveOrigin: '50% 50%',
            }}
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <motion.div
              ref={dialogRef}
              className={`p-6 rounded-3xl shadow-2xl dialog ${maxWidth} w-full mx-4 my-auto ${className}`}
              onMouseEnter={() => enableMouseTilt && setIsHovering(true)}
              onMouseLeave={() => enableMouseTilt && setIsHovering(false)}
              style={{
                marginTop: 'auto',
                marginBottom: 'auto',
                ...(enableMouseTilt && {
                  rotateX,
                  rotateY,
                  scale,
                  translateZ,
                  transformStyle: 'preserve-3d',
                  transformOrigin: '50% 50%',
                  filter: shadowFilter,
                })
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
                      className="dialog-close-button p-1"
                      whileHover={{ scale: 1.1, rotate: 180 }}
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

  return typeof document === 'object' ? createPortal(dialogContent, document.body) : null;
};

export default Dialog;