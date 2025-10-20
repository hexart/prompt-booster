// apps/web/src/components/ui/hooks/useAutoscroll.ts
import { useEffect, useRef, useState } from 'react';

interface UseAutoScrollOptions {
    // 是否启用自动滚动
    enabled?: boolean;

    // 是否处于流式内容模式（影响自动滚动行为，但不影响按钮显示）
    streaming?: boolean;

    // 检测是否接近底部的阈值（像素）
    threshold?: number;

    // 是否输出调试信息
    debug?: boolean;
}

/**
 * 自动滚动钩子函数
 * 用于自动将内容滚动到底部，并在用户手动滚动时暂停
 * 
 * @example
 * // 用于textarea
 * const { elementRef, shouldShowButton, scrollToBottom } = useAutoScroll<HTMLTextAreaElement>({
 *   threshold: 5, // 较小的容差值
 * });
 */
export function useAutoScroll<T extends HTMLElement = HTMLDivElement>({
    enabled = true,
    streaming = false,
    threshold = 5, // 默认使用较小的容差值
    debug = false,
}: UseAutoScrollOptions = {}) {
    const elementRef = useRef<T | null>(null);
    const [userScrolled, setUserScrolled] = useState(false);
    const [shouldShowButton, setShouldShowButton] = useState(false);
    const lastContentHeightRef = useRef<number>(0);

    // 检查是否接近底部
    const isNearBottom = () => {
        const element = elementRef.current;
        if (!element) return true;

        // 获取滚动相关属性
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;

        if (debug) {
            console.log('Scroll check:', { scrollTop, scrollHeight, clientHeight, threshold });
        }

        return scrollHeight - scrollTop - clientHeight <= threshold;
    };

    // 滚动到底部的函数
    const scrollToBottom = (smooth = true) => {
        const element = elementRef.current;
        if (!element) return;

        if (debug) {
            console.log('Scrolling to bottom:', {
                type: element.tagName,
                scrollHeight: element.scrollHeight,
                smooth
            });
        }

        try {
            // 尝试平滑滚动 (如果支持)
            if (smooth && 'scrollTo' in element && typeof element.scrollTo === 'function') {
                element.scrollTo({
                    top: element.scrollHeight,
                    behavior: 'smooth'
                });
            } else {
                // 回退到即时滚动
                element.scrollTop = element.scrollHeight;
            }

            // 重置状态
            setUserScrolled(false);
            setShouldShowButton(false);
        } catch (error) {
            console.error('Error scrolling:', error);
        }
    };

    // 强制滚动到底部的函数
    const forceScrollToBottom = () => {
        if (debug) {
            console.log('Force scrolling to bottom');
        }

        scrollToBottom(false);
        setUserScrolled(false);
        setShouldShowButton(false);
    };

    // 检查是否应该显示滚动按钮 - 简化逻辑
    const checkShouldShowButton = () => {
        // 简化显示逻辑：只要不在底部，就显示按钮
        const nearBottom = isNearBottom();
        const shouldShow = !nearBottom;

        if (debug) {
            console.log('Button visibility check:', { nearBottom, shouldShow });
        }

        setShouldShowButton(shouldShow);
    };

    // 处理滚动事件
    const handleScroll = () => {
        // 检查是否接近底部
        if (isNearBottom()) {
            if (debug) {
                console.log('User scrolled to bottom, resuming auto-scroll');
            }
            setShouldShowButton(false);
            setUserScrolled(false);
        } else {
            if (debug) {
                console.log('User scrolled away from bottom');
            }
            setUserScrolled(true);
            setShouldShowButton(true);
        }
    };

    // 监听内容变化时自动滚动
    useEffect(() => {
        const element = elementRef.current;
        if (!element || !enabled) return;

        // 检查内容高度是否增加
        const currentHeight = element.scrollHeight;
        const previousHeight = lastContentHeightRef.current;
        const heightIncreased = currentHeight > previousHeight;

        if (debug && heightIncreased) {
            console.log('Content height increased:', { previous: previousHeight, current: currentHeight });
        }

        lastContentHeightRef.current = currentHeight;

        // 如果内容增加且用户没有手动滚动，或者要求始终滚动
        if ((heightIncreased && !userScrolled) || (streaming && !userScrolled)) {
            scrollToBottom(false);
        } else if (heightIncreased && userScrolled) {
            // 内容增加但用户已手动滚动，检查是否应该显示按钮
            checkShouldShowButton();
        }
    });

    // 添加滚动事件监听
    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        if (debug) {
            console.log('Setting up scroll listener on:', element.tagName);
        }

        const handleScrollEvent = () => handleScroll();
        element.addEventListener('scroll', handleScrollEvent);

        return () => {
            element.removeEventListener('scroll', handleScrollEvent);
        };
    }, [elementRef.current]);

    // 提供一个函数，用于手动通知内容变化
    const onContentChange = () => {
        if (debug) {
            console.log('Content change notified');
        }

        // 在下一个事件循环中检查高度变化
        setTimeout(() => {
            const element = elementRef.current;
            if (!element) return;

            const currentHeight = element.scrollHeight;
            const previousHeight = lastContentHeightRef.current;

            if (currentHeight !== previousHeight) {
                if (debug) {
                    console.log('Height changed after content update:', {
                        from: previousHeight,
                        to: currentHeight
                    });
                }

                lastContentHeightRef.current = currentHeight;

                if (!userScrolled) {
                    scrollToBottom(false);
                } else {
                    // 用户已经滚动查看内容，检查是否应该显示按钮
                    checkShouldShowButton();
                }
            }
        }, 0);
    };

    return {
        elementRef,
        scrollToBottom,
        forceScrollToBottom,
        isNearBottom,
        userScrolled,
        shouldShowButton,
        onContentChange
    };
}