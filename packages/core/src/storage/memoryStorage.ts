// packages/core/src/storage/memoryStorage.ts
import { createWithEqualityFn } from 'zustand/traditional';
import { persist } from 'zustand/middleware';
import { createStorage, StorageType } from './storageService';

interface MemoryState {
    originalPrompt: string;
    optimizedPrompt: string;
    userTestPrompt: string;
    originalResponse: string;
    optimizedResponse: string;
    isLoadingFromHistory: boolean; // 新增状态，用于跟踪是否从历史记录加载

    setOriginalPrompt: (prompt: string) => void;
    setOptimizedPrompt: (prompt: string) => void;
    setUserTestPrompt: (prompt: string) => void;
    setOriginalResponse: (response: string | ((prev: string) => string)) => void;
    setOptimizedResponse: (response: string | ((prev: string) => string)) => void;
    setIsLoadingFromHistory: (isLoading: boolean) => void; // 新增方法

    clearAll: () => void;
}

// 创建内存存储，确保使用内存存储而不是会话存储
const memoryStorage = createStorage({
    type: StorageType.MEMORY,  // 使用内存存储，页面刷新时自动清除
    key: 'MEMORY_STORE'
});

export const useMemoryStore = createWithEqualityFn<MemoryState>()(
    persist(
        (set) => ({
            originalPrompt: '',
            optimizedPrompt: '',
            userTestPrompt: '',
            originalResponse: '',
            optimizedResponse: '',
            isLoadingFromHistory: false, // 初始化为false

            setOriginalPrompt: (prompt: string) => set({ originalPrompt: prompt }),
            setOptimizedPrompt: (prompt: string) => set({ optimizedPrompt: prompt }),
            setUserTestPrompt: (prompt: string) => set({ userTestPrompt: prompt }),
            setOriginalResponse: (response) => set(state => ({
                originalResponse: typeof response === 'function'
                    ? response(state.originalResponse)
                    : response
            })),
            setOptimizedResponse: (response) => set(state => ({
                optimizedResponse: typeof response === 'function'
                    ? response(state.optimizedResponse)
                    : response
            })),
            setIsLoadingFromHistory: (isLoading: boolean) => set({ isLoadingFromHistory: isLoading }),

            clearAll: () => set({
                originalPrompt: '',
                optimizedPrompt: '',
                userTestPrompt: '',
                originalResponse: '',
                optimizedResponse: '',
                isLoadingFromHistory: false
            }),
        }),
        memoryStorage
    ),
    Object.is
);

setTimeout(() => {
    const state = useMemoryStore.getState();
    // 只在需要时更新初始状态
    if (state.originalPrompt === '' && 
        state.optimizedPrompt === '' && 
        state.userTestPrompt === '' && 
        state.originalResponse === '' && 
        state.optimizedResponse === '') {
        useMemoryStore.setState({
            ...state
        });
    }
}, 0);