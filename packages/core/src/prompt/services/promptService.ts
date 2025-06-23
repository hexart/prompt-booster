// packages/core/src/prompt/services/promptService.ts
/**
 * 提示词服务
 * 管理提示词组的创建、版本控制和优化操作
 */
import { PromptGroupManager } from "./promptGroupManager";
import { llmService } from "./llmService";
import {
  ConnectionError,
  AuthenticationError,
  RequestFormatError,
  ResponseParseError
} from '@prompt-booster/api';
import { ErrorType } from "../../model/models/config";
import { getTemplateContent } from "./templateService";
import { getLanguageInstruction, removeThinkTags } from "../utils/promptUtils";
import { useMemoryStore } from "../../storage/memoryStorage";
import { useModelStore } from "../../model/store/modelStore";
import {
  PromptGroupServiceState,
  EnhancePromptParams,
  EnhanceResult,
  IteratePromptParams,
  IterateResult,
} from "../models/prompt";

export const PROVIDER_USER_EDIT = '__USEREDIT__';
export class PromptService {
  private groupManager = new PromptGroupManager();
  private listeners: Array<(state: PromptGroupServiceState) => void> = [];
  private refreshDetector: (() => void) | null = null;

  private state: PromptGroupServiceState = {
    groups: {},
    versions: {},
    activeGroupId: null,
    activeVersionNumber: null,
    isProcessing: false,
    error: null,
  };

  constructor() {
    this.loadFromStorage();
    this.setupRefreshDetection();
  }

  /**
   * 设置页面刷新检测
   * 使用sessionStorage检测页面刷新并重置状态
   */
  private setupRefreshDetection() {
    if (typeof window === "undefined") return;

    const PAGE_LOAD_KEY = "prompt_service_page_load";
    const pageLoadFlag = sessionStorage.getItem(PAGE_LOAD_KEY);

    if (!pageLoadFlag) {
      // 首次加载，设置标记
      sessionStorage.setItem(PAGE_LOAD_KEY, "loaded");
    } else {
      // 页面刷新，重置状态
      console.log("Page refresh detected, resetting session...");
      this.resetSession();

      // 清除内存存储
      const memoryStore = useMemoryStore.getState();
      memoryStore.clearAll();
    }

    // 注册刷新前的清理函数
    this.refreshDetector = () => {
      sessionStorage.removeItem(PAGE_LOAD_KEY);
    };

    window.addEventListener("beforeunload", this.refreshDetector);
  }

  /**
   * 清理函数
   */
  dispose() {
    if (this.refreshDetector) {
      window.removeEventListener("beforeunload", this.refreshDetector);
    }
  }

  // 订阅状态变化
  subscribe(listener: (state: PromptGroupServiceState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // 获取状态
  getState(): PromptGroupServiceState {
    return { ...this.state };
  }

  // 更新状态
  private updateState(updates: Partial<PromptGroupServiceState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
    this.saveToStorage();
  }

  // 直接获取当前显示的内容
  getCurrentDisplayContent(): {
    originalPrompt: string;
    optimizedPrompt: string;
  } {
    if (!this.state.activeGroupId || !this.state.activeVersionNumber) {
      return { originalPrompt: "", optimizedPrompt: "" };
    }

    const group = this.groupManager.getGroup(this.state.activeGroupId);
    const version = this.groupManager.getVersion(
      this.state.activeGroupId,
      this.state.activeVersionNumber
    );

    return {
      originalPrompt: group?.originalPrompt || "",
      optimizedPrompt: version?.optimizedPrompt || "",
    };
  }

  // 通知监听器
  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  // 增强提示词
  async enhancePrompt(params: EnhancePromptParams): Promise<EnhanceResult> {
    const { originalPrompt, templateId, modelId, language } = params;

    if (!originalPrompt?.trim()) {
      throw new Error("Original prompt is empty");
    }

    this.updateState({ isProcessing: true, error: null });

    try {
      // 获取模板
      const systemPrompt = await getTemplateContent(templateId);
      if (!systemPrompt) {
        throw new Error("Template not found");
      }

      // 添加语言指令
      const languageInstruction = getLanguageInstruction(language);
      const finalSystemPrompt = languageInstruction
        ? `${systemPrompt}\n\n${languageInstruction}`
        : systemPrompt;

      // 创建组
      const group = this.groupManager.createGroup(originalPrompt);

      // 获取模型信息
      const modelStore = useModelStore.getState();
      const modelConfig = this.getModelMetadata(modelId || modelStore.activeModel);

      // 创建预备版本
      const version = this.groupManager.createPendingVersion(
        group.id,
        modelConfig
      );

      // 立即更新状态，让 UI 可以响应
      this.updateState({
        groups: { ...this.groupManager.exportData().groups },
        versions: { ...this.groupManager.exportData().versions },
        activeGroupId: group.id,
        activeVersionNumber: version.number,
        isProcessing: true,
      });

      // 存储累积的响应
      let enhancedPrompt = "";

      // 调用LLM
      await llmService.callLLM({
        userMessage: originalPrompt,
        systemMessage: finalSystemPrompt,
        modelId,
        stream: true,
        onData: (chunk) => {
          // 累积响应
          enhancedPrompt += chunk;

          // 直接更新版本内容
          this.groupManager.updateVersionContent(
            group.id,
            version.id,
            enhancedPrompt
          );

          // 触发状态更新通知UI
          this.updateState({
            versions: { ...this.groupManager.exportData().versions },
          });
        },
        onError: (error) => {
          // 添加错误处理
          console.error('Enhance prompt error:', error);

          // 判断错误类型并映射到 ErrorType
          let errorType: ErrorType = 'unknown';
          if (error instanceof ConnectionError) {
            errorType = 'connection';
          } else if (error instanceof AuthenticationError) {
            errorType = 'auth';
          } else if (error instanceof RequestFormatError) {
            errorType = 'validation';
          } else if (error instanceof ResponseParseError) {
            errorType = 'parse';
          }

          this.updateState({
            isProcessing: false,
            error: error.message,  // 直接存储错误消息
            errorType: errorType   // 存储错误类型供前端使用
          });
        },
        onComplete: () => {
          // 可选：添加完成回调
          console.log('Enhancement completed');
        }
      });

      // 完成后最终更新
      const cleanedEnhancedPrompt = removeThinkTags(enhancedPrompt);
      this.groupManager.updateVersionContent(
        group.id,
        version.id,
        cleanedEnhancedPrompt
      );

      // 最终更新状态
      this.updateState({
        groups: { ...this.groupManager.exportData().groups },
        versions: { ...this.groupManager.exportData().versions },
        isProcessing: false,
      });

      return {
        groupId: group.id,
        versionId: version.id,
        enhancedPrompt: cleanedEnhancedPrompt,
      };
    } catch (error) {
      this.updateState({
        isProcessing: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // 迭代提示词
  async iteratePrompt(params: IteratePromptParams): Promise<IterateResult> {
    const { groupId, direction, templateId, modelId, language } = params;

    if (!direction?.trim()) {
      throw new Error("Iteration direction is empty");
    }

    this.updateState({ isProcessing: true, error: null });

    try {
      // 获取当前版本
      const group = this.groupManager.getGroup(groupId);
      if (!group) {
        throw new Error("Group not found");
      }

      const currentVersion = this.groupManager.getVersion(
        groupId,
        group.currentVersionNumber
      );
      if (!currentVersion) {
        throw new Error("Current version not found");
      }

      // 获取模板
      const systemPrompt = await getTemplateContent(templateId);
      if (!systemPrompt) {
        throw new Error("Template not found");
      }

      // 清理当前提示词
      const currentCleanedPrompt = removeThinkTags(currentVersion.optimizedPrompt);

      // 构建迭代消息
      const iterationMessage = `当前优化后的提示词:\n\n${currentCleanedPrompt}\n\n迭代方向:\n${direction}`;

      // 添加语言指令
      const languageInstruction = getLanguageInstruction(language);
      const finalSystemPrompt = languageInstruction
        ? `${systemPrompt}\n\n${languageInstruction}`
        : systemPrompt;

      // 获取模型信息
      const modelStore = useModelStore.getState();
      const modelConfig = this.getModelMetadata(modelId || modelStore.activeModel);

      // 创建预备版本
      const version = this.groupManager.createPendingVersion(
        groupId,
        modelConfig,
        direction
      );

      // 立即更新状态
      this.updateState({
        groups: { ...this.groupManager.exportData().groups },
        versions: { ...this.groupManager.exportData().versions },
        activeVersionNumber: version.number,
        isProcessing: true,
      });

      // 存储累积的响应
      let iteratedPrompt = "";

      // 调用LLM
      await llmService.callLLM({
        userMessage: iterationMessage,
        systemMessage: finalSystemPrompt,
        modelId,
        stream: true,
        onData: (chunk) => {
          // 累积响应
          iteratedPrompt += chunk;

          // 直接更新版本内容
          this.groupManager.updateVersionContent(
            groupId,
            version.id,
            iteratedPrompt
          );

          // 触发状态更新通知UI
          this.updateState({
            versions: { ...this.groupManager.exportData().versions },
          });
        },
        onError: (error) => {
          // 添加错误处理
          console.error('Iterate prompt error:', error);

          // 判断错误类型并映射到 ErrorType
          let errorType: ErrorType = 'unknown';
          if (error instanceof ConnectionError) {
            errorType = 'connection';
          } else if (error instanceof AuthenticationError) {
            errorType = 'auth';
          } else if (error instanceof RequestFormatError) {
            errorType = 'validation';
          } else if (error instanceof ResponseParseError) {
            errorType = 'parse';
          }

          this.updateState({
            isProcessing: false,
            error: error.message,  // 直接存储错误消息
            errorType: errorType   // 存储错误类型供前端使用
          });
        },
        onComplete: () => {
          // 可选：添加完成回调
          console.log('Iteration completed');
        }
      });

      // 完成后最终更新
      const cleanedIteratedPrompt = removeThinkTags(iteratedPrompt);
      this.groupManager.updateVersionContent(
        groupId,
        version.id,
        cleanedIteratedPrompt
      );

      // 最终更新状态
      this.updateState({
        groups: { ...this.groupManager.exportData().groups },
        versions: { ...this.groupManager.exportData().versions },
        isProcessing: false,
      });

      return {
        groupId,
        versionId: version.id,
        versionNumber: version.number,
        iteratedPrompt,
      };
    } catch (error) {
      this.updateState({
        isProcessing: false,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * 保存用户手动修改的提示词为新版本
   */
  async saveUserModification(
    groupId: string,
    userEditedPrompt: string
  ): Promise<IterateResult> {
    if (!this.groupManager.getGroup(groupId)) {
      throw new Error(`Group ${groupId} not found`);
    }

    if (!userEditedPrompt?.trim()) {
      throw new Error("Modified prompt is empty");
    }

    try {
      const modelStore = useModelStore.getState();
      const modelConfig = {
        modelId: modelStore.activeModel,
        provider: PROVIDER_USER_EDIT,
        modelName: "",
      };

      const cleanedModifiedPrompt = removeThinkTags(userEditedPrompt);
      const version = this.groupManager.createVersion(
        groupId,
        cleanedModifiedPrompt,
        modelConfig,
        PROVIDER_USER_EDIT
      );

      // 更新状态
      this.updateState({
        groups: { ...this.groupManager.exportData().groups },
        versions: { ...this.groupManager.exportData().versions },
        activeVersionNumber: version.number,
      });

      return {
        groupId,
        versionId: version.id,
        versionNumber: version.number,
        iteratedPrompt: cleanedModifiedPrompt,
      };
    } catch (error) {
      throw error;
    }
  }

  // 获取模型信息
  private getModelMetadata(modelId: string) {
    const modelStore = useModelStore.getState();
    const enabledModels = modelStore.getEnabledModels();
    const modelConfig = enabledModels.find((m: any) => m.id === modelId);

    if (modelConfig) {
      const parts = modelConfig.name.split(" - ");
      return {
        modelId,
        provider: parts[0] || modelId,
        modelName: parts[1] || modelConfig.name,
      };
    }

    return {
      modelId,
      provider: modelId,
      modelName: modelId,
    };
  }

  // 存储相关方法
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem("PROMPT_STORE");
      if (stored) {
        const data = JSON.parse(stored);
        this.groupManager.importData(data);
        this.state = {
          ...this.state,
          groups: data.groups || {},
          versions: data.versions || {},
          activeGroupId: data.activeGroupId || null,
          activeVersionNumber: data.activeVersionNumber || null,
        };
      }
    } catch (error) {
      console.error("Failed to load from storage:", error);
    }
  }

  private saveToStorage() {
    try {
      const data = {
        ...this.groupManager.exportData(),
        activeGroupId: this.state.activeGroupId,
        activeVersionNumber: this.state.activeVersionNumber,
      };
      localStorage.setItem("PROMPT_STORE", JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save to storage:", error);
    }
  }

  // 公共方法
  getAllGroups() {
    return this.groupManager.getAllGroups();
  }

  getGroupVersions(groupId: string) {
    return this.groupManager.getVersions(groupId);
  }

  deleteGroup(groupId: string) {
    this.groupManager.deleteGroup(groupId);

    let newState: Partial<PromptGroupServiceState> = {
      groups: { ...this.groupManager.exportData().groups },
      versions: { ...this.groupManager.exportData().versions },
    };

    if (this.state.activeGroupId === groupId) {
      newState.activeGroupId = null;
      newState.activeVersionNumber = null;
    }

    this.updateState(newState);
  }

  switchVersion(groupId: string, versionNumber: number) {
    this.updateState({
      activeGroupId: groupId,
      activeVersionNumber: versionNumber,
    });
  }

  resetSession() {
    this.updateState({
      activeGroupId: null,
      activeVersionNumber: null,
    });
  }

  loadFromHistory(groupId: string, versionNumber?: number) {
    const group = this.groupManager.getGroup(groupId);
    if (!group) {
      throw new Error(`Group ${groupId} not found`);
    }

    const targetVersion = versionNumber || group.currentVersionNumber;
    this.updateState({
      activeGroupId: groupId,
      activeVersionNumber: targetVersion,
    });
  }

  // 单例模式
  private static instance: PromptService;

  static getInstance(): PromptService {
    if (!PromptService.instance) {
      PromptService.instance = new PromptService();
    }
    return PromptService.instance;
  }
}

// 导出单例
export const promptService = PromptService.getInstance();
