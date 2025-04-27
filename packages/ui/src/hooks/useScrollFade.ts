// packages/ui/src/hooks/useScrollFade.ts
import { useEffect, useRef } from 'react';

/**
 * 滚动淡出钩子 - 在滚动时显示滚动条，然后自动隐藏
 * 
 * @param ref - 滚动元素的引用（可选，如果不提供则自动处理）
 * @param options - 配置选项
 * @returns 包含处理函数的对象
 */
interface ScrollFadeOptions {
    /** 滚动条消失的延迟时间（毫秒） */
    timeout?: number;
    /** 是否在鼠标悬停时显示滚动条 */
    showOnHover?: boolean;
    /** 是否监听滚动事件 */
    listenToScroll?: boolean;
    /** 用于识别滚动元素的选择器 */
    selector?: string;
}

export function useScrollFade(
    ref?: React.RefObject<HTMLElement>,
    options: ScrollFadeOptions = {}
) {
    const {
        timeout = 2000,
        showOnHover = true,
        listenToScroll = true,
        selector = 'div[style*="overflow"], div[style*="overflow-y"], textarea, .scrollable'
    } = options;

    const timerRef = useRef<number | null>(null);

    // 处理单个元素的滚动事件
    const handleElementScroll = (element: HTMLElement) => {
        if (!element) return;

        // 添加滚动中的类
        element.classList.add('is-scrolling');

        // 清除之前的定时器
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // 设置新的定时器，在指定时间后移除类
        timerRef.current = setTimeout(() => {
            element.classList.remove('is-scrolling');
        }, timeout);
    };

    // 处理特定元素的鼠标进入/离开事件
    const setupHoverEvents = (element: HTMLElement) => {
        if (!element || !showOnHover) return;

        const mouseEnterHandler = () => {
            // 仅当元素有滚动内容时才添加类
            if (element.scrollHeight > element.clientHeight) {
                element.classList.add('is-scrolling');
            }
        };

        const mouseLeaveHandler = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }

            timerRef.current = setTimeout(() => {
                element.classList.remove('is-scrolling');
            }, timeout / 2); // 鼠标离开时使用更短的延迟
        };

        element.addEventListener('mouseenter', mouseEnterHandler);
        element.addEventListener('mouseleave', mouseLeaveHandler);

        // 返回清理函数
        return () => {
            element.removeEventListener('mouseenter', mouseEnterHandler);
            element.removeEventListener('mouseleave', mouseLeaveHandler);
        };
    };

    // 处理单个元素的所有事件
    const setupElement = (element: HTMLElement) => {
        if (!element) return () => { };

        // 添加滚动监听
        const scrollHandler = () => handleElementScroll(element);

        if (listenToScroll) {
            element.addEventListener('scroll', scrollHandler);
        }

        // 设置悬停事件
        const cleanupHover = setupHoverEvents(element);

        // 返回清理函数
        return () => {
            if (listenToScroll) {
                element.removeEventListener('scroll', scrollHandler);
            }
            if (cleanupHover) cleanupHover();
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    };

    // 针对特定引用的元素
    useEffect(() => {
        if (ref && ref.current) {
            return setupElement(ref.current);
        }
    }, [ref]);

    // 全局应用 - 处理符合选择器的所有元素
    const applyToAll = () => {
        const elements = document.querySelectorAll<HTMLElement>(selector);
        const cleanupFunctions: Array<() => void> = [];

        elements.forEach(element => {
            const cleanup = setupElement(element);
            if (cleanup) cleanupFunctions.push(cleanup);
        });

        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    };

    // 观察 DOM 变化，为新添加的可滚动元素添加事件
    const observeDOMChanges = () => {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // 元素节点
                            // 检查子元素
                            const newScrollables = (node as Element).querySelectorAll<HTMLElement>(selector);
                            newScrollables.forEach(setupElement);

                            // 检查节点本身
                            if ((node as Element).matches(selector)) {
                                setupElement(node as HTMLElement);
                            }
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        return () => observer.disconnect();
    };

    // 导出函数，可在组件外部调用
    return {
        applyToAll,
        observeDOMChanges,
        handleScroll: (element: HTMLElement) => handleElementScroll(element)
    };
}