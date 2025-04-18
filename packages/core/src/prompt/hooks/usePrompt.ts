// packages/core/src/hooks/usePromptGroup.ts
import { useState, useEffect, useCallback } from 'react';
import { promptGroupService } from '../services/promptService';
import {
    PromptGroup,
    PromptVersion,
    EnhancePromptParams,
    EnhanceResult,
    IteratePromptParams,
    IterateResult,
    PromptGroupServiceState
} from '../models/prompt';
import { useMemoryStore } from '../../storage';

/**
 * 提示词组钩子的返回值接口
 */
export interface UsePromptGroupResult {
    // 状态
    activeGroup: PromptGroup | null;
    activeVersion: PromptVersion | null;
    activeVersionNumber: number | null;
    isProcessing: boolean;
    error: string | null;

    // 组操作
    getAllGroups: () => PromptGroup[];
    setActiveGroup: (groupId: string) => void;
    deleteGroup: (groupId: string) => void;
    findGroupByContent: (content: string) => PromptGroup | null;

    // 版本操作
    getGroupVersions: (groupId: string) => PromptVersion[];
    switchVersion: (groupId: string, versionNumber: number) => void;

    // LLM 操作
    enhancePrompt: (params: EnhancePromptParams) => Promise<EnhanceResult>;
    iteratePrompt: (params: IteratePromptParams) => Promise<IterateResult>;

    // 会话管理
    resetSession: () => void;
    loadFromHistory: (groupId: string, versionNumber?: number) => void;

    // 同步操作
    syncToMemoryStore: () => void;
}

/**
 * 提示词组钩子，提供对提示词组服务的便捷访问
 */
export function usePromptGroup(): UsePromptGroupResult {
    // 获取内存存储
    const memoryStore = useMemoryStore.getState();

    // 从服务获取初始状态
    const initialState = promptGroupService.getState();

    // 本地状态
    const [state, setState] = useState<PromptGroupServiceState>(initialState);

    // 更新本地状态的回调
    const handleStateChange = useCallback((newState: PromptGroupServiceState) => {
        setState(newState);
    }, []);

    // 订阅服务状态变更
    useEffect(() => {
        const unsubscribe = promptGroupService.subscribe(handleStateChange);
        return unsubscribe;
    }, [handleStateChange]);

    // 获取当前活跃的组和版本
    const activeGroup = state.activeGroupId ? state.groups[state.activeGroupId] : null;
    const activeVersion = useCallback(() => {
        if (!state.activeGroupId || !state.activeVersionNumber) return null;

        const versions = state.versions[state.activeGroupId] || [];
        return versions.find(v => v.number === state.activeVersionNumber) || null;
    }, [state.activeGroupId, state.activeVersionNumber, state.versions]);

    // 获取所有组
    const getAllGroups = useCallback((): PromptGroup[] => {
        return Object.values(state.groups);
    }, [state.groups]);

    // 设置活跃组
    const setActiveGroup = useCallback((groupId: string): void => {
        promptGroupService.setActivePromptGroup(groupId);
    }, []);

    // 删除组
    const deleteGroup = useCallback((groupId: string): void => {
        promptGroupService.deletePromptGroup(groupId);
    }, []);

    /**
     * 查找组
     * @param content 组内容
     * @returns 组对象
     * @deprecated
     */
    const findGroupByContent = useCallback((content: string): PromptGroup | null => {
        return promptGroupService.findPromptGroupByContent(content);
    }, []);

    // 获取组的所有版本
    const getGroupVersions = useCallback((groupId: string): PromptVersion[] => {
        return promptGroupService.getGroupVersions(groupId);
    }, []);

    // 切换版本
    const switchVersion = useCallback((groupId: string, versionNumber: number): void => {
        promptGroupService.switchVersion(groupId, versionNumber);
    }, []);

    // 增强提示词
    const enhancePrompt = useCallback(async (params: EnhancePromptParams): Promise<EnhanceResult> => {
        return promptGroupService.enhancePrompt(params);
    }, []);

    // 迭代提示词
    const iteratePrompt = useCallback(async (params: IteratePromptParams): Promise<IterateResult> => {
        return promptGroupService.iteratePrompt(params);
    }, []);

    // 重置会话
    const resetSession = useCallback((): void => {
        promptGroupService.resetActiveSession();

        // 同时重置内存存储
        memoryStore.setOriginalPrompt('');
        memoryStore.setOptimizedPrompt('');
        memoryStore.setIsLoadingFromHistory(false);
    }, [memoryStore]);

    // 从历史记录加载
    const loadFromHistory = useCallback((groupId: string, versionNumber?: number): void => {
        promptGroupService.loadFromHistory(groupId, versionNumber);

        // 同步到内存存储
        syncToMemoryStore();
    }, []);

    // 同步到内存存储
    // 优化同步函数
    const syncToMemoryStore = useCallback(() => {
        const currentVersion = activeVersion();
        // 只有当版本不同或内容不同时才更新
        if (currentVersion &&
            (currentVersion.originalPrompt !== memoryStore.originalPrompt ||
                currentVersion.optimizedPrompt !== memoryStore.optimizedPrompt)) {

            memoryStore.setOriginalPrompt(currentVersion.originalPrompt);
            memoryStore.setOptimizedPrompt(currentVersion.optimizedPrompt);
        }
    }, [activeVersion, memoryStore]);

    // 确保状态一致性
    useEffect(() => {
        promptGroupService.ensureValidState();
    }, []);

    // 在活跃组或版本变化时同步到内存存储
    useEffect(() => {
        if (state.activeGroupId && state.activeVersionNumber) {
            syncToMemoryStore();
        }
    }, [state.activeGroupId, state.activeVersionNumber, syncToMemoryStore]);

    return {
        activeGroup,
        activeVersion: activeVersion(),
        activeVersionNumber: state.activeVersionNumber,
        isProcessing: state.isProcessing,
        error: state.error,

        getAllGroups,
        setActiveGroup,
        deleteGroup,
        findGroupByContent,

        getGroupVersions,
        switchVersion,

        enhancePrompt,
        iteratePrompt,

        resetSession,
        loadFromHistory,

        syncToMemoryStore,
    };
}

// 导出单例服务，以便在非React上下文中使用
export { promptGroupService };