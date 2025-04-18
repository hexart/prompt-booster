// packages/ui/src/components/Dialog.tsx
import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export interface DialogProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    maxWidth?: string;
    showCloseButton?: boolean;
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
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [animationState, setAnimationState] = useState<'none' | 'opening' | 'closing'>('none');

    // 当对话框打开时禁用主页面滚动
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setAnimationState('opening');
        } else {
            document.body.style.overflow = 'auto';
            if (animationState !== 'none') {
                setAnimationState('closing');
            }
        }

        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen, animationState]);

    if (!isOpen && animationState === 'none') return null;

    return (
        <DialogContext.Provider value={{ containerRef }}>
            <div
                className={`fixed inset-0 bg-black/30 backdrop-blur-xs flex overflow-y-auto z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                ref={containerRef}
                style={{
                    // 移除align-items: center，改为顶部对齐并添加padding
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    padding: '0' // 上下添加padding，确保有滚动空间
                }}
                onTransitionEnd={() => {
                    if (!isOpen) {
                        setAnimationState('none');
                    }
                }}
            >
                <div
                    className={`p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-black/30 ${maxWidth} w-full mx-4 my-auto border border-gray-200 dark:border-gray-700 ${className} transition-all duration-300`}
                    style={{
                        // 当窗口足够高时，仍然实现垂直居中
                        marginTop: 'auto',
                        marginBottom: 'auto',
                        transform: animationState === 'opening' ? 'translateY(-20px)' :
                            (animationState === 'closing' ? 'translateY(20px)' : 'translateY(0)'),
                        opacity: isOpen ? 1 : 0
                    }}
                >
                    {/* 固定标题栏 */}
                    {(title || showCloseButton) && (
                        <div className="mb-4 flex justify-between items-center">
                            {title && (
                                <h2 className="text-xl font-semibold text-gray-600 dark:text-white">
                                    {title}
                                </h2>
                            )}
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <X size={20} />
                                </button>
                            )}
                        </div>
                    )}
                    <div className="py-6">
                        {children}
                    </div>
                    {/* 对话框 footer 区域 */}
                    {footer && (
                        <div className="mt-4">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </DialogContext.Provider>
    );
};

export default Dialog;