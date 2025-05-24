/**
 * LLM服务
 * 统一处理所有LLM调用
 */
import { createClient, StreamHandler } from "@prompt-booster/api";
import { useModelStore } from "../../model/store";

export interface LLMServiceParams {
  userMessage: string;
  systemMessage: string;
  modelId?: string;
  stream?: boolean;
  onData?: (chunk: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export class LLMService {
  // 调用LLM
  async callLLM(params: LLMServiceParams): Promise<string> {
    const {
      userMessage,
      systemMessage,
      modelId,
      stream = true,
      onData,
      onComplete,
      onError,
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
      options: { temperature: 0.7 },
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
    };

    await client.streamChat(request, handler);
    return fullResponse;
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
        customInterface.endpoint === "/v1/chat/completions" ||
        customInterface.endpoint?.includes("chat/completions");

      return {
        provider: isOpenAICompatible ? "openai" : customInterface.id, // 使用兼容的 provider
        apiKey: customInterface.apiKey,
        baseUrl: customInterface.baseUrl,
        model: customInterface.model,
        timeout: customInterface.timeout || 60000,
        endpoints: {
          chat: customInterface.endpoint || "/v1/chat/completions",
          models: "/v1/models",
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
        chat: config.endpoint || "/v1/chat/completions",
        models: "/v1/models",
      },
    };
  }
}

// 导出单例
export const llmService = new LLMService();
