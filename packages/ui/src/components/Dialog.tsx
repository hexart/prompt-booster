// packages/ui/src/components/Dialog.tsx
import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

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

    const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
        if (clickOutside && e.target === e.currentTarget) {
            onClose();
        }
    };

    // Dialog内容
    const dialogContent = (
        <DialogContext.Provider value={{ containerRef }}>
            <div
                className={`fixed inset-0 flex overflow-y-auto z-50 transition-opacity duration-300 mask ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                ref={containerRef}
                onClick={handleClickOutside}
                style={{
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    padding: '40px 0'
                }}
                onTransitionEnd={() => {
                    if (!isOpen) {
                        setAnimationState('none');
                    }
                }}
            >
                <div
                    className={`p-6 rounded-2xl shadow-2xl shadow-black/30 dialog ${maxWidth} w-full mx-4 my-auto ${className} transition-all duration-300`}
                    style={{
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
                                <h2 className="text-xl font-semibold dialog-title">
                                    {title}
                                </h2>
                            )}
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="dialog-close-button"
                                >
                                    <X size={20} className="transition-transform duration-300 hover:rotate-180" />
                                </button>
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
                </div>
            </div>
        </DialogContext.Provider>
    );

    // 使用Portal渲染到body
    return typeof document === 'object' ? createPortal(dialogContent, document.body) : null;
};

export default Dialog;