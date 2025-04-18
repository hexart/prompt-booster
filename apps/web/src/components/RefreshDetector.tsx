// apps/web/src/components/RefreshDetector.tsx
import React, { useEffect } from 'react';
import { useMemoryStore } from '@prompt-booster/core/storage/memoryStorage';
import { usePromptGroup } from '@prompt-booster/core/prompt/hooks/usePrompt';
// import { toast } from '@prompt-booster/ui';
export const RefreshDetector: React.FC = () => {
    const { resetSession } = usePromptGroup();
    
    useEffect(() => {
        // 使用sessionStorage实现更可靠的刷新检测
        const PAGE_LOAD_KEY = 'prompt_optimizer_page_load';
        
        // 获取当前记录
        const pageLoadFlag = sessionStorage.getItem(PAGE_LOAD_KEY);
        
        if (!pageLoadFlag) {
            // 第一次加载页面 - 标记页面已加载
            console.log('页面初次加载，设置标记');
            sessionStorage.setItem(PAGE_LOAD_KEY, 'loaded');
        } else {
            // 页面已经加载过，这是一个刷新
            console.log('检测到页面刷新，正在重置状态...');
                        
            // 安全调用重置函数，使用setTimeout避免在渲染周期中触发状态更新
            setTimeout(() => {
                try {
                    // 重置会话状态
                    resetSession();
                    
                    // 清除内存存储
                    useMemoryStore.getState().clearAll();

                    // toast.info('已重置工作区');
                    console.log('状态重置完成');
                } catch (error) {
                    console.error('重置状态时出错:', error);
                }
            }, 0);
        }
        
        // 组件卸载时不需要清理，因为我们希望保持sessionStorage状态
    }, []); // 空依赖数组确保效果只运行一次

    return null;
};