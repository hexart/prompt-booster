// packages/core/src/services/promptGroupService.ts
import {
    PromptGroup,
    PromptVersion,
    PromptGroupServiceState,
    EnhancePromptParams,
    EnhanceResult,
    IteratePromptParams,
    IterateResult,
    LLMCallParams
} from '../models/prompt';
import { useModelStore } from '../../model/store';
import { getTemplateContent } from './templateService';
import { createClient, StreamHandler } from '@prompt-booster/api';
import { ERROR_MESSAGES } from '../../config/constants';
import { generateId } from '../../utils';
import { createStorage, StorageType } from '../../storage';
import { useMemoryStore } from '../../storage/memoryStorage';

// 导出调用大模型的通用方法，同时给其他对话场景用
export async function callLLMWithCurrentModel(params: LLMCallParams): Promise<string> {
    const { userMessage, systemMessage, modelId, onData, stream = true } = params;
    const modelStore = useModelStore.getState();

    const { activeModel, configs, isCustomInterface, getCustomInterface } = modelStore;
    const modelKey = modelId || activeModel;

    let provider, apiKey, baseUrl, model, endpoint;

    if (isCustomInterface(modelKey)) {
        const customInterface = getCustomInterface(modelKey);
        if (!customInterface) throw new Error('未找到自定义接口配置');

        provider = customInterface.providerName || customInterface.id;
        apiKey = customInterface.apiKey;
        baseUrl = customInterface.baseUrl;
        model = customInterface.model;
        endpoint = customInterface.endpoint;
    } else {
        const modelConfig = configs[modelKey as keyof typeof configs];
        if (!modelConfig) throw new Error(ERROR_MESSAGES.INVALID_MODEL);

        provider = modelKey;
        apiKey = modelConfig.apiKey;
        baseUrl = modelConfig.baseUrl;
        model = modelConfig.model;
        endpoint = modelConfig.endpoint;
    }

    if (!apiKey) throw new Error(ERROR_MESSAGES.NO_API_KEY);

    const client = createClient({
        provider,
        apiKey,
        baseUrl,
        model,
        endpoints: {
            chat: endpoint,
            models: '/v1/models'
        }
    });

    const request = { userMessage, systemMessage, options: { temperature: 0.7 } };

    if (!stream) {
        const res = await client.chat(request);
        return res.data?.content || '';
    }

    let fullResponse = '';
    const handler: StreamHandler = {
        onData: (chunk: string) => {
            fullResponse += chunk;
            if (onData) onData(chunk);
        },
        onComplete: () => { },
        onError: (error: Error) => { throw error; }
    };

    await client.streamChat(request, handler);
    return fullResponse;
}

/**
 * 提示词组管理服务
 * 整合提示词组和版本的创建、管理和处理功能
 */
export class PromptGroupService {
    private state: PromptGroupServiceState = {
        groups: {},
        versions: {},
        activeGroupId: null,
        activeVersionNumber: null,
        isProcessing: false,
        error: null
    };

    private listeners: Array<(state: PromptGroupServiceState) => void> = [];
    private storage;

    private isStreamingResponse: boolean = false;

    constructor() {
        // 初始化存储
        this.storage = createStorage({
            type: StorageType.LOCAL,
            key: 'PROMPT_STORE',
            version: 1
        });

        // 从存储加载状态
        this.loadFromStorage();
    }

    /**
     * 获取当前状态
     */
    public getState(): PromptGroupServiceState {
        return { ...this.state };
    }

    /**
     * 从存储加载状态
     */
    private async loadFromStorage() {
        try {
            if (this.storage && this.storage.storage) {
                const storedData = await this.storage.storage.getItem('PROMPT_STORE');
                if (storedData !== null && storedData !== undefined) {
                    // 使用 JSON.parse 解析存储的字符串，添加类型断言
                    try {
                        // 先转为 unknown，再转为 string
                        const parsedData = JSON.parse(storedData as unknown as string);
                        if (parsedData) {
                            this.state = {
                                ...this.state,
                                ...parsedData
                            };
                            this._emitStateChange();
                        }
                    } catch (parseError) {
                        console.error('解析存储数据失败:', parseError);
                    }
                }
            }
        } catch (error) {
            console.error('加载提示词组状态失败:', error);
        }
    }

    /**
     * 保存状态到存储
     */
    private async saveToStorage() {
        try {
            if (this.storage && this.storage.storage) {
                const stateToSave = {
                    groups: this.state.groups,
                    versions: this.state.versions,
                    activeGroupId: this.state.activeGroupId,
                    activeVersionNumber: this.state.activeVersionNumber
                };

                // 将数据序列化为字符串
                const serializedData = JSON.stringify(stateToSave);

                // 存储数据，使用双重类型断言
                await this.storage.storage.setItem(
                    'PROMPT_STORE',
                    serializedData as unknown as Parameters<typeof this.storage.storage.setItem>[1]
                );
                console.log('持久化状态已保存, 组数量:', Object.keys(this.state.groups).length);
            }
        } catch (error) {
            console.error('保存提示词组状态失败:', error);
        }
    }

    /**
     * 订阅状态变更
     * @param listener 监听器函数
     * @returns 取消订阅的函数
     */
    public subscribe(listener: (state: PromptGroupServiceState) => void): () => void {
        this.listeners.push(listener);

        // 返回取消订阅函数
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // 节流函数
    private saveThrottled = (() => {
        let lastSave = 0;
        let pendingSave = false;
        const THROTTLE_DELAY = 3000; // 3秒钟节流

        return () => {
            const now = Date.now();
            if (now - lastSave > THROTTLE_DELAY) {
                // 可以立即保存
                lastSave = now;
                this.saveToStorage();
                pendingSave = false;
            } else if (!pendingSave) {
                // 设置延迟保存
                pendingSave = true;
                setTimeout(() => {
                    lastSave = Date.now();
                    this.saveToStorage();
                    pendingSave = false;
                }, THROTTLE_DELAY - (now - lastSave));
            }
        };
    })();

    /**
     * 发布状态变更事件
     * @private
     */
    private _emitStateChange() {
        const state = this.getState();
        this.listeners.forEach(listener => listener(state));

        // 仅在非流式响应时使用节流保存
        if (!this.isStreamingResponse) {
            this.saveThrottled();
        }
    }

    /**
     * 更新状态
     * @param updates 状态更新
     * @private
     */
    private _updateState(updates: Partial<PromptGroupServiceState>) {
        this.state = {
            ...this.state,
            ...updates
        };
        // 触发状态变更并保存
        this._emitStateChange();
    }

    /**
     * 创建提示词组
     * @param originalPrompt 原始提示词
     * @returns 创建的提示词组ID
     */
    public createPromptGroup(originalPrompt: string): string {
        const groupId = generateId();

        const newGroup: PromptGroup = {
            id: groupId,
            originalPrompt,
            currentVersionNumber: 0,
            status: 'idle',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this._updateState({
            groups: {
                ...this.state.groups,
                [groupId]: newGroup
            },
            versions: {
                ...this.state.versions,
                [groupId]: []
            }
        });

        return groupId;
    }

    /**
     * 根据内容查找提示词组
     * @param content 提示词内容
     * @returns 匹配的提示词组或null
     * @deprecated
     */
    public findPromptGroupByContent(content: string): PromptGroup | null {
        if (!content) return null;

        const groupIds = Object.keys(this.state.groups);
        for (const groupId of groupIds) {
            // 查找该组的所有版本
            const versions = this.state.versions[groupId] || [];

            // 检查是否有版本的优化提示词匹配
            const matchingVersion = versions.find(v => v.optimizedPrompt === content);
            if (matchingVersion) {
                return this.state.groups[groupId];
            }
        }

        return null;
    }

    /**
     * 获取活跃提示词组
     * @returns 活跃提示词组或null
     */
    public getActivePromptGroup(): PromptGroup | null {
        const { activeGroupId } = this.state;
        if (!activeGroupId) return null;

        return this.state.groups[activeGroupId] || null;
    }

    /**
     * 设置活跃提示词组
     * @param groupId 提示词组ID
     */
    public setActivePromptGroup(groupId: string): void {
        if (!this.state.groups[groupId]) {
            throw new Error(`提示词组 ${groupId} 不存在`);
        }

        const group = this.state.groups[groupId];

        this._updateState({
            activeGroupId: groupId,
            activeVersionNumber: group.currentVersionNumber
        });
    }

    /**
     * 删除提示词组
     * @param groupId 提示词组ID
     */
    public deletePromptGroup(groupId: string): void {
        if (!this.state.groups[groupId]) {
            throw new Error(`提示词组 ${groupId} 不存在`);
        }

        // 创建新的状态对象，移除指定组
        const { [groupId]: _, ...restGroups } = this.state.groups;
        const { [groupId]: __, ...restVersions } = this.state.versions;

        let updates: Partial<PromptGroupServiceState> = {
            groups: restGroups,
            versions: restVersions
        };

        // 如果删除的是当前活跃组，重置活跃状态
        if (this.state.activeGroupId === groupId) {
            updates.activeGroupId = null;
            updates.activeVersionNumber = null;
        }

        this._updateState(updates);
        this.saveToStorage();
    }

    /**
     * 获取提示词组的所有版本
     * @param groupId 提示词组ID
     * @returns 版本数组
     */
    public getGroupVersions(groupId: string): PromptVersion[] {
        if (!this.state.groups[groupId]) {
            return [];
        }

        return this.state.versions[groupId] || [];
    }

    /**
     * 获取当前活跃版本
     * @param groupId 可选的组ID，默认使用当前活跃组
     * @returns 活跃版本或null
     */
    public getActiveVersion(groupId?: string): PromptVersion | null {
        const targetGroupId = groupId || this.state.activeGroupId;
        if (!targetGroupId) return null;

        const group = this.state.groups[targetGroupId];
        if (!group) return null;

        const versions = this.state.versions[targetGroupId] || [];
        return versions.find(v => v.number === (this.state.activeVersionNumber || group.currentVersionNumber)) || null;
    }

    /**
     * 切换到指定版本
     * @param groupId 提示词组ID
     * @param versionNumber 版本号
     */
    public switchVersion(groupId: string, versionNumber: number): void {
        if (!this.state.groups[groupId]) {
            throw new Error(`提示词组 ${groupId} 不存在`);
        }

        const versions = this.state.versions[groupId] || [];
        const version = versions.find(v => v.number === versionNumber);

        if (!version) {
            throw new Error(`版本 ${versionNumber} 不存在于提示词组 ${groupId} 中`);
        }

        this._updateState({
            activeGroupId: groupId,
            activeVersionNumber: versionNumber
        });
    }

    /**
     * 创建新的空白版本（内部使用）
     * @param groupId 提示词组ID
     * @param modelId 可选的模型ID
     * @param iterationDirection 可选的迭代方向
     * @returns 新创建的版本
     * @private
     */
    private _createEmptyVersion(
        groupId: string,
        modelId?: string,
        iterationDirection?: string
    ): PromptVersion {
        if (!this.state.groups[groupId]) {
            throw new Error(`提示词组 ${groupId} 不存在`);
        }

        const group = this.state.groups[groupId];
        const versions = this.state.versions[groupId] || [];

        // 确定新版本号
        const nextVersionNumber = versions.length > 0
            ? Math.max(...versions.map(v => v.number)) + 1
            : 1;

        // 获取当前使用的模型
        const modelStore = useModelStore.getState();
        const modelIdToUse = modelId || modelStore.activeModel;

        // 新增：直接从 getEnabledModels 获取模型信息
        let provider = "";
        let modelName = "";

        // 获取所有启用的模型
        const enabledModels = modelStore.getEnabledModels();
        const modelInfo = enabledModels.find(m => m.id === modelIdToUse);

        if (modelInfo) {
            // modelInfo.name 格式为 "provider - modelName"
            const parts = modelInfo.name.split(' - ');
            if (parts.length === 2) {
                provider = parts[0];
                modelName = parts[1];
            } else {
                provider = modelIdToUse; // 回退到使用 modelId 作为 provider
                modelName = modelInfo.name;
            }
        }

        // 创建新版本
        const newVersion: PromptVersion = {
            id: generateId(),
            number: nextVersionNumber,
            groupId,
            originalPrompt: group.originalPrompt,
            optimizedPrompt: '优化中...',
            modelId: modelIdToUse,
            provider,
            modelName,
            iterationDirection,
            status: 'pending',
            timestamp: Date.now()
        };

        // 更新状态
        this._updateState({
            versions: {
                ...this.state.versions,
                [groupId]: [...versions, newVersion]
            },
            groups: {
                ...this.state.groups,
                [groupId]: {
                    ...group,
                    currentVersionNumber: nextVersionNumber,
                    updatedAt: Date.now(),
                    status: iterationDirection ? 'iterating' : 'enhancing'
                }
            },
            activeGroupId: groupId,
            activeVersionNumber: nextVersionNumber,
            isProcessing: true
        });

        return newVersion;
    }

    /**
     * 执行LLM调用（内部使用）
     * @param params LLM调用参数
     * @returns 响应内容
     * @private
     * @deprecated
     */
    private async _callLLM(params: LLMCallParams): Promise<string> {
        const { userMessage, systemMessage, onData } = params;

        // 获取模型配置
        const modelStore = useModelStore.getState();
        const { activeModel, configs, isCustomInterface, getCustomInterface } = modelStore;

        // 确定提供商和配置
        let provider, apiKey, baseUrl, model, endpoint;

        if (isCustomInterface(activeModel)) {
            const customInterface = getCustomInterface(activeModel);
            if (!customInterface) {
                throw new Error('未找到自定义接口配置');
            }

            provider = customInterface.providerName || customInterface.id;
            apiKey = customInterface.apiKey;
            baseUrl = customInterface.baseUrl;
            model = customInterface.model;
            endpoint = customInterface.endpoint;
        } else {
            const modelConfig = configs[activeModel as keyof typeof configs];
            if (!modelConfig) {
                throw new Error(ERROR_MESSAGES.INVALID_MODEL);
            }

            provider = activeModel;
            apiKey = modelConfig.apiKey;
            baseUrl = modelConfig.baseUrl;
            model = modelConfig.model;
            endpoint = modelConfig.endpoint;
        }

        // 检查API密钥
        if (!apiKey) {
            throw new Error(ERROR_MESSAGES.NO_API_KEY);
        }

        // 创建API客户端
        const apiClient = createClient({
            provider,
            apiKey,
            baseUrl,
            model,
            endpoints: {
                chat: endpoint,
                models: '/v1/models'
            }
        });

        // 完整响应
        let fullResponse = '';

        // 创建流处理器
        const streamHandler: StreamHandler = {
            onData: (chunk: string) => {
                fullResponse += chunk;
                if (onData) {
                    onData(chunk);
                }
            },
            onComplete: () => {
                console.log('流式响应完成');
            },
            onError: (error: Error) => {
                console.error('流式响应错误:', error);
                throw error;
            }
        };

        // 发送请求
        await apiClient.streamChat({
            userMessage,
            systemMessage,
            options: {
                temperature: 0.7,
                maxTokens: undefined
            }
        }, streamHandler);

        return fullResponse;
    }

    // @ts-ignore
    private isEnhancingRef = false;
    /**
     * 执行提示词优化
     * @param params 优化参数
     * @returns 优化结果
     */
    public async enhancePrompt(params: EnhancePromptParams): Promise<EnhanceResult> {

        const { originalPrompt, templateId, modelId } = params;

        if (!originalPrompt || !originalPrompt.trim()) {
            throw new Error(ERROR_MESSAGES.EMPTY_PROMPT);
        }

        // 将错误状态重置
        this._updateState({ error: null });

        try {
            this.isEnhancingRef = true;
            this.isStreamingResponse = true;
            // 获取系统提示词模板
            const systemPrompt = await getTemplateContent(templateId);
            if (!systemPrompt) {
                throw new Error(ERROR_MESSAGES.TEMPLATE_NOT_FOUND);
            }

            // 创建新的提示词组
            const groupId = this.createPromptGroup(originalPrompt);

            // 创建空白版本
            const newVersion = this._createEmptyVersion(groupId, modelId);

            // 手动触发一次完整保存
            this.saveToStorage();

            // 存储优化后的内容
            let optimizedPrompt = '';

            // 调用LLM进行优化
            await callLLMWithCurrentModel({
                userMessage: originalPrompt,
                systemMessage: systemPrompt,
                modelId,
                onData: (chunk) => {
                    // 累积优化后的内容
                    optimizedPrompt += chunk;

                    // 更新版本中的优化后提示词
                    const versions = this.state.versions[groupId] || [];
                    const updatedVersions = versions.map(v =>
                        v.id === newVersion.id
                            ? {
                                ...v,
                                optimizedPrompt: v.optimizedPrompt === '优化中...' ? chunk : v.optimizedPrompt + chunk,
                                status: v.status // 保持原状态，确保类型一致
                            }
                            : v
                    ) as PromptVersion[]; // 显式类型断言确保类型正确

                    this._updateState({
                        versions: {
                            ...this.state.versions,
                            [groupId]: updatedVersions
                        }
                    });

                    // 新增：直接更新 MemoryStore
                    const memoryStore = useMemoryStore.getState();
                    const currentVersionOptimizedPrompt = newVersion.optimizedPrompt;
                    if (currentVersionOptimizedPrompt === '优化中...') {
                        memoryStore.setOptimizedPrompt(chunk);
                    } else {
                        memoryStore.setOptimizedPrompt(memoryStore.optimizedPrompt + chunk);
                    }
                }

            });

            // 更新版本状态为已完成
            const versions = this.state.versions[groupId] || [];
            const updatedVersions = versions.map(v =>
                v.id === newVersion.id
                    ? { ...v, status: 'completed' as const, optimizedPrompt }
                    : v
            );

            // 更新组状态
            const updatedGroup = {
                ...this.state.groups[groupId],
                status: 'completed' as const
            };

            this._updateState({
                versions: {
                    ...this.state.versions,
                    [groupId]: updatedVersions
                },
                groups: {
                    ...this.state.groups,
                    [groupId]: updatedGroup
                },
                isProcessing: false
            });

            this.isStreamingResponse = false;

            // 完成后手动触发一次完整保存
            this.saveToStorage();

            return {
                groupId,
                versionId: newVersion.id,
                optimizedPrompt,
                reasoning: '' // 本次没有返回理由
            };
        } catch (error) {
            this.isEnhancingRef = false;
            this.isStreamingResponse = false;
            // 处理错误
            console.error('提示词优化失败:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);

            this._updateState({
                error: errorMessage,
                isProcessing: false
            });

            throw error;
        } finally {
            this.isEnhancingRef = false;
        }
    }

    /**
     * 执行提示词迭代
     * @param params 迭代参数
     * @returns 迭代结果
     */
    public async iteratePrompt(params: IteratePromptParams): Promise<IterateResult> {
        const { groupId, direction, templateId, modelId } = params;

        if (!this.state.groups[groupId]) {
            throw new Error(`提示词组 ${groupId} 不存在`);
        }

        if (!direction || !direction.trim()) {
            throw new Error('迭代方向不能为空');
        }

        // 将错误状态重置
        this._updateState({ error: null });

        try {
            this.isStreamingResponse = true;
            // 获取系统提示词模板
            const systemPrompt = await getTemplateContent(templateId);
            if (!systemPrompt) {
                throw new Error(ERROR_MESSAGES.TEMPLATE_NOT_FOUND);
            }

            // 获取当前版本
            const group = this.state.groups[groupId];
            const versions = this.state.versions[groupId] || [];

            const versionNumberToUse = this.state.activeVersionNumber || group.currentVersionNumber;
            const currentVersion = versions.find(v => v.number === versionNumberToUse);

            if (!currentVersion || !currentVersion.optimizedPrompt) {
                throw new Error('无法找到当前版本或当前版本尚未优化');
            }

            // 创建新的空白版本，标记迭代方向
            const newVersion = this._createEmptyVersion(groupId, modelId, direction);

            // 构建迭代提示词
            const iterationPrompt = `当前优化后的提示词:\n\n${currentVersion.optimizedPrompt}\n\n迭代方向:\n${direction}`;

            // 存储优化后的内容
            let optimizedPrompt = '';

            // 调用LLM进行迭代
            await callLLMWithCurrentModel({
                userMessage: iterationPrompt,
                systemMessage: systemPrompt,
                modelId,
                onData: (chunk) => {
                    // 累积优化后的内容
                    optimizedPrompt += chunk;

                    // 更新版本中的优化后提示词
                    const versions = this.state.versions[groupId] || [];
                    const updatedVersions = versions.map(v =>
                        v.id === newVersion.id
                            ? {
                                ...v,
                                optimizedPrompt: v.optimizedPrompt === '优化中...' ? chunk : v.optimizedPrompt + chunk,
                                status: v.status // 保持原状态，确保类型一致
                            }
                            : v
                    ) as PromptVersion[]; // 显式类型断言确保类型正确

                    this._updateState({
                        versions: {
                            ...this.state.versions,
                            [groupId]: updatedVersions
                        }
                    });

                    const memoryStore = useMemoryStore.getState();
                    if (newVersion.optimizedPrompt === '优化中...') {
                        memoryStore.setOptimizedPrompt(chunk);
                    } else {
                        memoryStore.setOptimizedPrompt(memoryStore.optimizedPrompt + chunk);
                    }
                }
            });

            // 更新版本状态为已完成
            const updatedVersions = this.state.versions[groupId].map(v =>
                v.id === newVersion.id
                    ? { ...v, status: 'completed' as const, optimizedPrompt }
                    : v
            );

            // 更新组状态
            const updatedGroup = {
                ...this.state.groups[groupId],
                status: 'completed' as const
            };

            this._updateState({
                versions: {
                    ...this.state.versions,
                    [groupId]: updatedVersions
                },
                groups: {
                    ...this.state.groups,
                    [groupId]: updatedGroup
                },
                isProcessing: false
            });

            this.isStreamingResponse = false;
            this.saveToStorage();

            return {
                groupId,
                versionId: newVersion.id,
                versionNumber: newVersion.number,
                optimizedPrompt,
                reasoning: '' // 本次迭代没有返回理由
            };
        } catch (error) {
            this.isStreamingResponse = false;
            // 处理错误
            console.error('提示词迭代失败:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);

            this._updateState({
                error: errorMessage,
                isProcessing: false
            });

            throw error;
        } finally {
            this.isStreamingResponse = false; // 确保标志被重置
        }
    }

    /**
 * 保存用户手动修改的提示词为新版本
 * @param groupId 提示词组ID
 * @param modifiedPrompt 用户修改后的提示词
 * @returns 迭代结果
 */
    public async saveUserModification(groupId: string, modifiedPrompt: string): Promise<IterateResult> {
        if (!this.state.groups[groupId]) {
            throw new Error(`提示词组 ${groupId} 不存在`);
        }

        if (!modifiedPrompt || !modifiedPrompt.trim()) {
            throw new Error('修改后的提示词不能为空');
        }

        try {
            // 获取当前版本
            const group = this.state.groups[groupId];
            const versions = this.state.versions[groupId] || [];
            const currentVersion = versions.find(v => v.number === group.currentVersionNumber);

            if (!currentVersion) {
                throw new Error('无法找到当前版本');
            }

            // 创建新的版本
            const nextVersionNumber = Math.max(...versions.map(v => v.number)) + 1;
            const modelStore = useModelStore.getState();
            const modelId = currentVersion.modelId || modelStore.activeModel;

            // 创建新版本对象
            const newVersion: PromptVersion = {
                id: generateId(),
                number: nextVersionNumber,
                groupId,
                originalPrompt: currentVersion.originalPrompt,
                optimizedPrompt: modifiedPrompt,
                modelId: modelId,
                provider: '用户编辑',
                modelName: '',
                iterationDirection: '用户手动修改',
                status: 'completed',
                timestamp: Date.now()
            };

            console.log("保存用户修改版本:", {
                groupId,
                versionNumber: newVersion.number,
                modelId: newVersion.modelId,
                provider: newVersion.provider,
                modelName: newVersion.modelName
            });

            // 更新状态
            this._updateState({
                versions: {
                    ...this.state.versions,
                    [groupId]: [...versions, newVersion]
                },
                groups: {
                    ...this.state.groups,
                    [groupId]: {
                        ...group,
                        currentVersionNumber: nextVersionNumber,
                        updatedAt: Date.now(),
                        status: 'completed'
                    }
                },
                activeGroupId: groupId,
                activeVersionNumber: nextVersionNumber
            });

            // 保存到存储
            this.saveToStorage();

            return {
                groupId,
                versionId: newVersion.id,
                versionNumber: newVersion.number,
                optimizedPrompt: modifiedPrompt,
                reasoning: ''
            };
        } catch (error) {
            console.error('保存用户修改失败:', error);
            throw error;
        }
    }

    /**
     * 重置活跃会话
     */
    public resetActiveSession(): void {
        this._updateState({
            activeGroupId: null,
            activeVersionNumber: null
        });
    }

    /**
     * 从历史记录加载
     * @param groupId 组ID
     * @param versionNumber 可选的版本号
     */
    public loadFromHistory(groupId: string, versionNumber?: number): void {
        if (!this.state.groups[groupId]) {
            throw new Error(`提示词组 ${groupId} 不存在`);
        }

        const group = this.state.groups[groupId];
        const targetVersion = versionNumber || group.currentVersionNumber;

        this._updateState({
            activeGroupId: groupId,
            activeVersionNumber: targetVersion
        });
    }

    /**
     * 检查状态一致性
     */
    public ensureValidState(): void {
        // 检查活跃组ID是否有效
        if (this.state.activeGroupId && !this.state.groups[this.state.activeGroupId]) {
            this._updateState({
                activeGroupId: null,
                activeVersionNumber: null
            });
        }

        // 检查活跃版本是否有效
        if (this.state.activeGroupId && this.state.activeVersionNumber) {
            const versions = this.state.versions[this.state.activeGroupId] || [];
            const versionExists = versions.some(v => v.number === this.state.activeVersionNumber);

            if (!versionExists) {
                const group = this.state.groups[this.state.activeGroupId];
                this._updateState({
                    activeVersionNumber: group.currentVersionNumber
                });
            }
        }
    }

    /**
     * 单例实例
     */
    private static instance: PromptGroupService;

    /**
     * 获取单例实例
     */
    public static getInstance(): PromptGroupService {
        if (!PromptGroupService.instance) {
            PromptGroupService.instance = new PromptGroupService();
        }

        return PromptGroupService.instance;
    }

}

// 导出单例实例
export const promptGroupService = PromptGroupService.getInstance();