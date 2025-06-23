// packages/core/src/prompt/hooks/usePrompt.ts

/**
 * 提示词管理Hook
 * 提供对提示词服务的React集成
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { promptService } from '../services/promptService';
import { useMemoryStore } from '../../storage/memoryStorage';
import { 
  PromptGroup, 
  PromptVersion,
  EnhancePromptParams,
  IteratePromptParams 
} from '../models/prompt';
import { ErrorType } from '../../model/models/config';

export interface UsePromptResult {
  // 状态
  activeGroup: PromptGroup | null;
  activeVersion: PromptVersion | null;
  isProcessing: boolean;
  error: string | null;
  errorType?: ErrorType;
  
  // 组操作
  groups: PromptGroup[];
  deleteGroup: (groupId: string) => void;
  selectGroup: (groupId: string) => void;  // 添加这个方法
  
  // 版本操作
  versions: PromptVersion[];
  switchVersion: (groupId: string, versionNumber: number) => void;
  selectVersion: (versionNumber: number) => void;  // 添加这个方法
  
  // 增强操作
  enhancePrompt: (params: EnhancePromptParams) => Promise<void>;
  iteratePrompt: (params: IteratePromptParams) => Promise<void>;
  saveUserModification: (groupId: string, modifiedPrompt: string) => Promise<void>;
  
  // 直接获取内容
  originalPrompt: string;
  optimizedPrompt: string;

  // 会话管理
  resetSession: () => void;
  
  // 历史记录
  loadFromHistory: (groupId: string, versionNumber?: number) => void;
  
  // 获取组版本
  getGroupVersions: (groupId: string) => PromptVersion[];
}

export function usePrompt(): UsePromptResult {
  const [state, setState] = useState(promptService.getState());

  // 订阅状态变化
  useEffect(() => {
    const unsubscribe = promptService.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  // 直接从 service 获取当前内容
  const currentContent = useMemo(() => {
    return promptService.getCurrentDisplayContent();
  }, [state.activeGroupId, state.activeVersionNumber, state.versions]);


  // 获取当前组和版本
  const activeGroup = state.activeGroupId ? state.groups[state.activeGroupId] : null;
  
  // 获取当前版本
  const activeVersion = (() => {
    if (!activeGroup || !state.activeVersionNumber || !state.activeGroupId) {
      return null;
    }
    const versions = state.versions[state.activeGroupId];
    if (!versions) {
      return null;
    }
    return versions.find((v: PromptVersion) => v.number === state.activeVersionNumber) || null;
  })();

  // 获取所有组
  const groups = Object.values(state.groups);

  // 获取当前组的版本
  const versions = state.activeGroupId ? (state.versions[state.activeGroupId] || []) : [];

  // 获取指定组的版本
  const getGroupVersions = useCallback((groupId: string): PromptVersion[] => {
    return promptService.getGroupVersions(groupId);
  }, []);

  // 增强提示词
  const enhancePrompt = useCallback(async (params: EnhancePromptParams) => {
    try {
      await promptService.enhancePrompt(params);
    } catch (error) {
      console.error('Enhance prompt failed:', error);
      // throw error;
    }
  }, []);

  // 迭代提示词
  const iteratePrompt = useCallback(async (params: IteratePromptParams) => {
    try {
      await promptService.iteratePrompt(params);
    } catch (error) {
      console.error('Iterate prompt failed:', error);
      // throw error;
    }
  }, []);

  // 保存用户修改
  const saveUserModification = useCallback(async (groupId: string, modifiedPrompt: string) => {
    try {
      await promptService.saveUserModification(groupId, modifiedPrompt);
    } catch (error) {
      console.error('Save user modification failed:', error);
      throw error;
    }
  }, []);

  // 从历史记录加载
  const loadFromHistory = useCallback((groupId: string, versionNumber?: number) => {
    try {
      promptService.loadFromHistory(groupId, versionNumber);
      
      // 只设置加载标志
      const memoryStore = useMemoryStore.getState();
      memoryStore.setIsLoadingFromHistory(true);
      
      setTimeout(() => {
        memoryStore.setIsLoadingFromHistory(false);
      }, 500);
    } catch (error) {
      console.error('Load from history failed:', error);
    }
  }, []);

  // 选择组 - 添加这个方法
  const selectGroup = useCallback((groupId: string) => {
    loadFromHistory(groupId);
  }, [loadFromHistory]);

  // 选择版本 - 添加这个方法
  const selectVersion = useCallback((versionNumber: number) => {
    if (state.activeGroupId) {
      loadFromHistory(state.activeGroupId, versionNumber);
    }
  }, [state.activeGroupId, loadFromHistory]);

  // 切换版本
  const switchVersion = useCallback((groupId: string, versionNumber: number) => {
    promptService.switchVersion(groupId, versionNumber);
  }, []);

  // 删除组
  const deleteGroup = useCallback((groupId: string) => {
    promptService.deleteGroup(groupId);
  }, []);

  // 重置会话
  const resetSession = useCallback(() => {
    promptService.resetSession();
    const memoryStore = useMemoryStore.getState();
    memoryStore.clearAll();
  }, []);

  return {
    // 状态
    activeGroup,
    activeVersion,
    isProcessing: state.isProcessing,
    error: state.error,
    errorType: state.errorType,
    
    // 组操作
    groups,
    deleteGroup,
    selectGroup,  // 添加导出
    
    // 版本操作  
    versions,
    switchVersion,
    selectVersion,  // 添加导出
    
    // 增强操作
    enhancePrompt,
    iteratePrompt,
    saveUserModification,

    // 直接获取内容的属性
    originalPrompt: currentContent.originalPrompt,
    optimizedPrompt: currentContent.optimizedPrompt,
    
    // 会话管理
    resetSession,
    
    // 历史记录
    loadFromHistory,
    
    // 工具函数
    getGroupVersions
  };
}

// 导出服务实例，以便在非React环境中使用
export { promptService };