// apps/web/src/core/storage/memoryStorage.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createStorage, StorageType } from './storageService';

interface MemoryState {
  userTestPrompt: string;
  originalResponse: string;
  optimizedResponse: string;
  isLoadingFromHistory: boolean;

  setUserTestPrompt: (prompt: string) => void;
  setOriginalResponse: (response: string | ((prev: string) => string)) => void;
  setOptimizedResponse: (response: string | ((prev: string) => string)) => void;
  setIsLoadingFromHistory: (isLoading: boolean) => void;

  clearAll: () => void;
}

// 创建内存存储，确保使用内存存储而不是会话存储
const memoryStorage = createStorage({
    type: StorageType.MEMORY,  // 使用内存存储，页面刷新时自动清除
    key: 'MEMORY_STORE'
});

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set) => ({
      userTestPrompt: '',
      originalResponse: '',
      optimizedResponse: '',
      isLoadingFromHistory: false,

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
        userTestPrompt: '',
        originalResponse: '',
        optimizedResponse: '',
        isLoadingFromHistory: false
      }),
    }),
    memoryStorage
  )
);

setTimeout(() => {
    const state = useMemoryStore.getState();
    // 只检查存在的属性
    if (state.userTestPrompt === '' &&
        state.originalResponse === '' &&
        state.optimizedResponse === '') {
        useMemoryStore.setState({
            ...state
        });
    }
}, 0);