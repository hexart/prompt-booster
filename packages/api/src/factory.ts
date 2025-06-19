//packages/api/src/factory.ts
/**
 * 客户端工厂
 * 用于创建LLM客户端实例
 */
import { LLMClient, ClientConfig } from './types';
import { LLMClientImpl } from './client';
import { DEFAULT_TIMEOUT, PROVIDER_CONFIG } from './config';

/**
 * 创建LLM客户端
 * 根据配置创建适当的客户端实例
 * 
 * @param config 客户端配置
 * @returns LLM客户端实例
 */
export function createClient(config: ClientConfig | {
  provider: string;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  timeout?: number;
  endpoints?: Partial<ClientConfig['endpoints']>;
}): LLMClient {
  // 标准化 provider
  const provider = config.provider.toLowerCase();

  // 获取提供商默认配置
  const providerConfig = PROVIDER_CONFIG[provider] || {};

  // 确定最终的模型名称
  const finalModel = config.model || providerConfig.defaultModel;

  // 处理端点占位符替换
  const chatEndpoint = replaceEndpointPlaceholders(
    config.endpoints?.chat || providerConfig.endpoints?.chat,
    finalModel,
    provider
  );

  // 智能合并配置
  const finalConfig: ClientConfig = {
    provider,
    apiKey: config.apiKey,
    baseUrl: config.baseUrl || providerConfig.baseUrl,
    model: finalModel,
    timeout: config.timeout || providerConfig.timeout || DEFAULT_TIMEOUT,
    endpoints: {
      chat: chatEndpoint,
      models: config.endpoints?.models || providerConfig.endpoints?.models
    },
    // 如果config中没有这些字段，使用providerConfig中的
    auth: (config as ClientConfig).auth || providerConfig.auth,
    request: (config as ClientConfig).request || providerConfig.request,
    response: (config as ClientConfig).response || providerConfig.response
  };

  return new LLMClientImpl(finalConfig);
}

/**
 * 处理端点地址中占位符的替换
 * @param endpoint 端点地址
 * @param model 模型名称
 * @param provider 提供商名称
 * @returns 替换占位符后的端点地址
 */
function replaceEndpointPlaceholders(endpoint: string, model: string, provider: string): string {
  if (!endpoint) return endpoint;

  /**
   * 清理模型名称以用于端点拼接
   * 只处理特定的已知问题格式，不破坏正常的模型名称
   */
  function cleanModelNameForEndpoint(modelName: string): string {
    if (!modelName || typeof modelName !== 'string') {
      return modelName;
    }

    // 只处理 Gemini 的 "models/" 前缀问题
    // 这是 Google Gemini API 的特定问题：getModels 返回 "models/gemini-2.0-flash"
    // 但端点拼接时需要 "gemini-2.0-flash"
    if (modelName.startsWith('models/') && !modelName.includes('/', 7)) {
      // 确保这确实是 Gemini 格式：models/模型名（没有其他斜杠）
      return modelName.substring(7); // 移除 "models/" 前缀
    }

    // 对于其他格式（如 stabilityai/stable-diffusion-xl-base-1.0），保持原样
    return modelName;
  }

  // 清理模型名称后进行占位符替换
  const cleanModel = cleanModelNameForEndpoint(model);

  return endpoint
    .replace(/\{model\}/g, cleanModel || '')
    .replace(/\{provider\}/g, provider || '');
}