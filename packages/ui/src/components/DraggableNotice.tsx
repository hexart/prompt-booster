import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquareWarningIcon, XIcon } from 'lucide-react';

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
    portalTarget?: HTMLElement; // 可选的Portal渲染目标
}

export const DraggableNotice: React.FC<DraggableNoticeProps> = ({
    items,
    title = "需要完成",
    onClose,
    initialPosition = { x: 'auto', y: 'auto' },
    className = '',
    portalTarget
}) => {
    const [position, setPosition] = useState<{ x: string; y: string }>(initialPosition);
    const [hasBeenDragged, setHasBeenDragged] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isClosing, setIsClosing] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    
    // 用于保存悬浮窗引用
    const floatingRef = useRef<HTMLDivElement>(null);
    
    // 组件挂载时添加淡入效果
    useEffect(() => {
        // 初始状态设为不可见
        setIsVisible(false);
        
        // 使用 setTimeout 实现淡入效果
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 50); // 短暂延迟以确保CSS过渡效果正常工作
        
        return () => clearTimeout(timer);
    }, []);

    // 处理关闭按钮点击
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
        }, 500); // 500ms 后执行实际关闭
    };

    // 鼠标按下事件处理
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        // 如果点击的是关闭按钮，不启动拖动
        if (e.target instanceof Element && e.target.closest('.close-button')) {
            return;
        }
        
        if (floatingRef.current) {
            setIsDragging(true);

            // 计算鼠标与窗口左上角的偏移量
            const rect = floatingRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });

            // 防止文本选择等默认行为
            e.preventDefault();
        }
    };

    // 触摸开始事件处理
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        // 如果触摸的是关闭按钮，不启动拖动
        if (e.target instanceof Element && e.target.closest('.close-button')) {
            return;
        }
        
        if (floatingRef.current) {
            setIsDragging(true);

            // 计算触摸点与窗口左上角的偏移量
            const rect = floatingRef.current.getBoundingClientRect();
            const touch = e.touches[0];
            
            setDragOffset({
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            });

            // 防止默认行为（如滚动）
            e.preventDefault();
        }
    };

    // 鼠标移动处理函数
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging && floatingRef.current) {
            // 计算新位置
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            // 设置新位置
            setPosition({
                x: `${newX}px`,
                y: `${newY}px`
            });

            // 标记窗口已被拖动过
            setHasBeenDragged(true);
        }
    }, [isDragging, dragOffset]);

    // 触摸移动处理函数
    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (isDragging && floatingRef.current) {
            const touch = e.touches[0];
            
            // 计算新位置
            const newX = touch.clientX - dragOffset.x;
            const newY = touch.clientY - dragOffset.y;

            // 设置新位置
            setPosition({
                x: `${newX}px`,
                y: `${newY}px`
            });

            // 标记窗口已被拖动过
            setHasBeenDragged(true);
            
            // 防止页面滚动
            e.preventDefault();
        }
    }, [isDragging, dragOffset]);

    // 处理鼠标松开
    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // 处理触摸结束
    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // 添加和移除事件监听器
    useEffect(() => {
        if (isDragging) {
            // 鼠标事件
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            
            // 触摸事件
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd);
            window.addEventListener('touchcancel', handleTouchEnd);
        } else {
            // 移除鼠标事件
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            
            // 移除触摸事件
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchEnd);
        }

        return () => {
            // 清理所有事件监听器
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchEnd);
        };
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

    // 只显示那些isNeeded为true的项目
    const filteredItems = items.filter(item => item.isNeeded);

    // 如果没有需要显示的项目，返回null
    if (filteredItems.length === 0) return null;
    
    // 淡入淡出动画类
    const animationClass = isClosing 
        ? 'fade-out' 
        : isVisible 
            ? 'fade-in' 
            : 'fade-hidden';
    
    // 弹窗内容
    const noticeContent = (
        <div
            ref={floatingRef}
            className={`fixed z-50 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${className} ${animationClass}`}
            style={hasBeenDragged ? {
                // 如果已经被拖动过，使用绝对像素位置
                left: position.x,
                top: position.y,
                right: 'auto'
            } : {
                // 如果未被拖动过，保持与右侧的相对距离
                right: '80px',
                top: '110px',
                left: 'auto'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            <div className="flex justify-between items-center dragable-notice-header">
                <div className="flex items-center p-3 gap-2">
                    <MessageSquareWarningIcon size={20} className='dragable-notice-header-icon'/>
                    <h3 className="text-sm font-medium dragable-notice-header-title">{title}</h3>
                </div>
                <button
                    onClick={handleClose}
                    className="close-button p-2 m-1 transition-transform duration-300 hover:rotate-180 dragable-notice-header-close"
                >
                    <XIcon size={16} />
                </button>
            </div>
            <div className="p-3 text-sm space-y-2">
                {filteredItems.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                        <span className="h-2 w-2 rounded-full mt-1.5 flex-shrink-0 dragable-notice-content-icon"></span>
                        <span className="dragable-notice-content">{item.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return typeof document === 'object' 
        ? createPortal(noticeContent, portalTarget || document.body) 
        : null;
};