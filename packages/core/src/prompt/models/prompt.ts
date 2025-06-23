// packages/core/src/models/promptGroup.ts
import { ErrorType } from './../../model/models/config';
/**
 * 提示词组和版本的数据模型定义
 */

// 提示词组状态
export type PromptGroupStatus = 'idle' | 'enhancing' | 'iterating' | 'completed' | 'error';

// 提示词版本
export interface PromptVersion {
    id: string;
    number: number;
    groupId: string;
    originalPrompt: string; // 版本基于的原始提示词
    optimizedPrompt: string; // 优化后的提示词
    reasoning?: string; // 优化理由
    iterationDirection?: string; // 迭代方向(v2+)
    modelId: string; // 使用的模型ID
    provider: string;
    modelName: string;
    status: 'pending' | 'completed' | 'error';
    timestamp: number;
    // 扩展字段，用于支持现有历史功能
    favorite?: boolean;
    tags?: string[];
}

// 提示词组
export interface PromptGroup {
    id: string;
    originalPrompt: string; // 最初的原始提示词
    currentVersionNumber: number;
    status: PromptGroupStatus;
    createdAt: number;
    updatedAt: number;
}

// 服务状态
export interface PromptGroupServiceState {
    groups: Record<string, PromptGroup>;
    versions: Record<string, PromptVersion[]>;
    activeGroupId: string | null;
    activeVersionNumber: number | null;
    isProcessing: boolean;
    error: string | null;
    errorType?: ErrorType;
}

// 提示词增强参数
export interface EnhancePromptParams {
    originalPrompt: string;
    templateId: string;
    modelId?: string;
    language?: string;
}

// 提示词增强结果
export interface EnhanceResult {
    groupId: string;
    versionId: string;
    enhancedPrompt: string;
    reasoning?: string;
}

// 提示词迭代参数
export interface IteratePromptParams {
    groupId: string;
    direction: string;
    templateId: string;
    modelId?: string;
    language?: string;
}

// 提示词迭代结果
export interface IterateResult {
    groupId: string;
    versionId: string;
    versionNumber: number;
    iteratedPrompt: string;
    reasoning?: string;
}

// LLM调用参数
export interface LLMCallParams {
    userMessage: string;
    systemMessage: string;
    modelId?: string;
    onData?: (chunk: string) => void;
    stream?: boolean;
    timeout?: number;
}