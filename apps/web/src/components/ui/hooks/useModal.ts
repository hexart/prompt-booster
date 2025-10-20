// apps/web/src/components/ui/hooks/useModal.ts
import { useState, useCallback } from 'react';

/**
 * 通用弹窗状态管理钩子
 * 提供弹窗的开关状态管理和数据存储
 */
export function useModal<T = any>() {
    // 弹窗是否打开
    const [isOpen, setIsOpen] = useState(false);
    // 弹窗是否正在关闭（用于动画）
    const [isClosing, setIsClosing] = useState(false);
    // 弹窗相关数据
    const [data, setData] = useState<T | null>(null);

    /**
     * 打开弹窗
     * @param modalData 弹窗相关数据
     */
    const openModal = useCallback((modalData: T) => {
        setData(modalData);
        setIsOpen(true);
    }, []);

    /**
     * 关闭弹窗
     * 会先触发关闭动画，然后在动画结束后清除数据
     */
    const closeModal = useCallback(() => {
        setIsOpen(false);
        setIsClosing(true);

        // 等待动画结束后清除数据
        setTimeout(() => {
            setData(null);
            setIsClosing(false);
        }, 350); // 与动画时长匹配
    }, []);

    return {
        isOpen,
        isClosing,
        data,
        openModal,
        closeModal,
        setData
    };
}

export default useModal;