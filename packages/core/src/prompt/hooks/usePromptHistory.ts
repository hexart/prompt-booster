// packages/core/src/hooks/usePromptHistory.ts
import { useState, useCallback } from 'react';
import { usePromptGroup } from './usePrompt';
import { useMemoryStore } from '../../storage/memoryStorage';
import { PromptGroup } from '../../prompt/models/prompt';
import { promptGroupService } from '../../prompt/services/promptService';

export interface UsePromptHistoryResult {
    // 展开/收起状态
    expandedGroupId: string | null;
    selectedVersions: Record<string, number>;

    // 操作函数
    toggleExpand: (groupId: string) => void;
    handleSelectVersion: (groupId: string, version: number) => void;
    loadGroup: (group: PromptGroup, onNavigateToEditor?: () => void) => void;
    loadVersion: (groupId: string, versionNumber: number, onNavigateToEditor?: () => void) => void;
}

export function usePromptHistory(): UsePromptHistoryResult {
    // 使用提示词组钩子
    const {
        loadFromHistory,
        activeGroup,
        getGroupVersions
    } = usePromptGroup();

    // 状态
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
    const [selectedVersions, setSelectedVersions] = useState<Record<string, number>>({});

    // 切换展开/收起
    const toggleExpand = useCallback((groupId: string) => {
        setExpandedGroupId(prev => prev === groupId ? null : groupId);
    }, []);

    // 选择版本
    const handleSelectVersion = useCallback((groupId: string, version: number) => {
        setSelectedVersions(prev => ({
            ...prev,
            [groupId]: version
        }));
    }, []);

    // 加载提示词组
    const loadGroup = useCallback((group: PromptGroup, onNavigateToEditor?: () => void) => {
        // 添加检查，防止重复加载
        if (activeGroup && group.id === activeGroup.id) {
            console.warn('当前已是该提示词组');

            // 即使是当前提示词组，也跳转到编辑器
            if (onNavigateToEditor) {
                onNavigateToEditor();
            }
            return;
        }

        // 获取内存存储
        const memoryStore = useMemoryStore.getState();
        const versions = getGroupVersions(group.id);
        const versionToLoad = versions.find(v => v.number === group.currentVersionNumber);

        if (!versionToLoad) {
            console.error('无法加载提示词组：版本不存在');
            return;
        }

        // 先设置加载标志
        memoryStore.setIsLoadingFromHistory(true);

        // 设置内容
        memoryStore.setOriginalPrompt(group.originalPrompt);
        memoryStore.setOptimizedPrompt(versionToLoad.optimizedPrompt);

        // 加载提示词组
        loadFromHistory(group.id, group.currentVersionNumber);

        // 提示加载成功
        console.log('已加载提示词组');

        // 延迟重置加载标志
        setTimeout(() => {
            memoryStore.setIsLoadingFromHistory(false);
        }, 500);

        if (onNavigateToEditor) {
            onNavigateToEditor();
        }
    }, [activeGroup, getGroupVersions, loadFromHistory]);

    // 加载特定版本
    const loadVersion = useCallback((groupId: string, versionNumber: number, onNavigateToEditor?: () => void) => {
        // 获取内存存储
        const memoryStore = useMemoryStore.getState();

        try {
            // 获取版本内容
            const versions = getGroupVersions(groupId);
            const displayVersion = versions.find(version => version.number === versionNumber);

            if (!displayVersion) {
                console.error('无法加载：版本不存在');
                return;
            }

            // 先设置加载标志
            memoryStore.setIsLoadingFromHistory(true);

            // 从 service 中直接获取组信息，而不依赖 activeGroup
            const groups = promptGroupService.getState().groups;
            const group = groups[groupId];

            if (!group) {
                console.error('无法加载：提示词组不存在');
                memoryStore.setIsLoadingFromHistory(false);
                return;
            }

            // 直接设置内容
            memoryStore.setOriginalPrompt(group.originalPrompt);
            memoryStore.setOptimizedPrompt(displayVersion.optimizedPrompt);

            // 加载特定版本
            loadFromHistory(groupId, displayVersion.number);

            console.log('已加载提示词版本');

            // 延迟重置加载标志
            setTimeout(() => {
                memoryStore.setIsLoadingFromHistory(false);
            }, 500);

            if (onNavigateToEditor) {
                onNavigateToEditor();
            }
        } catch (error) {
            memoryStore.setIsLoadingFromHistory(false);
            console.error('加载版本失败:', error);
        }
    }, [getGroupVersions, loadFromHistory]);

    return {
        expandedGroupId,
        selectedVersions,
        toggleExpand,
        handleSelectVersion,
        loadGroup,
        loadVersion
    };
}