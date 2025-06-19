// packages/core/src/prompt/services/llmService.ts
/**
 * LLM服务
 * 统一处理所有LLM调用
 */
import { createClient, StreamHandler } from "@prompt-booster/api";
import { useModelStore } from "../../model/store";

// 接口定义
export interface LLMServiceParams {
  userMessage: string;
  systemMessage: string;
  modelId?: string;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
  onData?: (chunk: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  abortController?: AbortController;
}

// 对比测试参数
export interface ComparisonTestParams {
  userMessage: string;
  originalSystemMessage: string;
  optimizedSystemMessage: string;
  modelId?: string;
  onOriginalData?: (chunk: string) => void;
  onOptimizedData?: (chunk: string) => void;
  onOriginalComplete?: () => void;
  onOptimizedComplete?: () => void;
  onOriginalError?: (error: Error) => void;
  onOptimizedError?: (error: Error) => void;
  originalAbortController?: AbortController;
  optimizedAbortController?: AbortController;
}

export class LLMService {
  // 基础调用LLM方法（保持兼容）
  async callLLM(params: LLMServiceParams): Promise<string> {
    const {
      userMessage,
      systemMessage,
      modelId,
      stream = true,
      maxTokens,
      temperature,
      onData,
      onComplete,
      onError,
      abortController,
    } = params;

    // 获取模型配置
    const modelConfig = this.getModelConfig(modelId);

    // 创建客户端
    const client = createClient({
      provider: modelConfig.provider,
      apiKey: modelConfig.apiKey,
      baseUrl: modelConfig.baseUrl,
      model: modelConfig.model,
      timeout: modelConfig.timeout,
      endpoints: modelConfig.endpoints,
    });

    const request = {
      userMessage,
      systemMessage,
      options: {
        temperature,
        ...(maxTokens && { maxTokens })
      },
    };

    if (!stream) {
      const response = await client.chat(request);
      return response.data?.content || "";
    }

    // 流式响应
    let fullResponse = "";
    const handler: StreamHandler = {
      onData: (chunk: string) => {
        fullResponse += chunk;
        onData?.(chunk);
      },
      onComplete: () => {
        onComplete?.();
      },
      onError: (error: Error) => {
        onError?.(error);
      },
      abortController: abortController,
    };

    await client.streamChat(request, handler);
    return fullResponse;
  }

  // 专门的对比测试方法
  async runComparisonTest(params: ComparisonTestParams): Promise<void> {
    const {
      userMessage,
      originalSystemMessage,
      optimizedSystemMessage,
      modelId,
      onOriginalData,
      onOptimizedData,
      onOriginalComplete,
      onOptimizedComplete,
      onOriginalError,
      onOptimizedError,
      originalAbortController,
      optimizedAbortController
    } = params;

    // 原始提示词测试
    const originalPromise = this.callLLM({
      userMessage,
      systemMessage: originalSystemMessage,
      modelId,
      stream: true,
      onData: onOriginalData,
      onComplete: onOriginalComplete,
      onError: onOriginalError,
      abortController: originalAbortController,
    });

    // 优化提示词测试
    const optimizedPromise = this.callLLM({
      userMessage,
      systemMessage: optimizedSystemMessage,
      modelId,
      stream: true,
      onData: onOptimizedData,
      onComplete: onOptimizedComplete,
      onError: onOptimizedError,
      abortController: optimizedAbortController,
    });

    // 启动两个独立的请求，不等待结果
    originalPromise.catch(() => {
      // 错误已在 onError 中处理
    });

    optimizedPromise.catch(() => {
      // 错误已在 onError 中处理
    });
  }

  // 获取模型配置
  private getModelConfig(modelId?: string) {
    const modelStore = useModelStore.getState();
    const activeModelId = modelId || modelStore.activeModel;

    if (modelStore.isCustomInterface(activeModelId)) {
      const customInterface = modelStore.getCustomInterface(activeModelId);
      if (!customInterface) {
        throw new Error("Custom interface not found");
      }

      // 对于自定义接口，如果它兼容 OpenAI，就使用 'openai' 作为 provider
      // 这样可以复用 OpenAI 的请求/响应处理逻辑
      const isOpenAICompatible =
        customInterface.endpoint === "/chat/completions" ||
        customInterface.endpoint?.includes("chat/completions");

      return {
        provider: isOpenAICompatible ? "openai" : customInterface.id, // 使用兼容的 provider
        apiKey: customInterface.apiKey,
        baseUrl: customInterface.baseUrl,
        model: customInterface.model,
        timeout: customInterface.timeout || 60000,
        endpoints: {
          chat: customInterface.endpoint || "/chat/completions",
          models: "/models",
        },
      };
    }

    const config =
      modelStore.configs[activeModelId as keyof typeof modelStore.configs];
    if (!config) {
      throw new Error("Model config not found");
    }

    return {
      provider: activeModelId,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
      timeout: config.timeout || 60000,
      endpoints: {
        chat: config.endpoint || "/chat/completions",
        models: "/models",
      },
    };
  }
}

// 导出单例
export const llmService = new LLMService();