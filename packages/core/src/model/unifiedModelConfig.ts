// packages/core/src/model/unifiedModelConfig.ts
import { PROVIDER_CONFIG, LLMProvider } from '@prompt-booster/api';
import { StandardModelType } from './models/config';

/**
 * StandardModelType 到 LLMProvider 的映射
 * 确保类型系统的一致性
 */
const MODEL_TYPE_TO_PROVIDER: Record<StandardModelType, LLMProvider> = {
  'openai': LLMProvider.OPENAI,
  'ollama': LLMProvider.OLLAMA,
  'gemini': LLMProvider.GEMINI,
  'deepseek': LLMProvider.DEEPSEEK,
  'hunyuan': LLMProvider.HUNYUAN,
  'siliconflow': LLMProvider.SILICONFLOW,
};

/**
 * 默认模型配置接口
 * 定义从 API 包获取的配置结构
 */
export interface DefaultModelConfig {
  providerName: string;
  baseUrl: string;
  endpoint: string;
  defaultModel: string;
  timeout: number;
  modelsEndpoint?: string;
  authType?: string;
  requestType?: string;
  responseType?: string;
}

/**
 * 获取指定模型类型的默认配置
 * 从 API 包的 PROVIDER_CONFIG 中获取配置
 * 
 * @param modelType 标准模型类型
 * @returns 默认配置对象，如果不存在则返回 null
 */
export function getDefaultModelConfig(modelType: StandardModelType): DefaultModelConfig | null {
  // 获取对应的 LLMProvider
  const provider = MODEL_TYPE_TO_PROVIDER[modelType];
  if (!provider) {
    console.warn(`未找到模型类型 ${modelType} 对应的提供商`);
    return null;
  }

  // 从 API 包获取提供商配置
  const providerConfig = PROVIDER_CONFIG[provider];
  if (!providerConfig) {
    console.warn(`未找到提供商 ${provider} 的配置`);
    return null;
  }

  // 转换为标准化的默认配置格式
  return {
    providerName: providerConfig.providerName,
    baseUrl: providerConfig.baseUrl,
    endpoint: providerConfig.endpoints.chat,
    defaultModel: providerConfig.defaultModel,
    timeout: providerConfig.timeout,
    modelsEndpoint: providerConfig.endpoints.models,
    authType: providerConfig.auth?.type,
    requestType: providerConfig.request?.type,
    responseType: providerConfig.response?.type,
  };
}

/**
 * 获取所有支持的模型类型的默认配置
 * 
 * @returns 所有模型类型的默认配置映射
 */
export function getAllDefaultModelConfigs(): Record<StandardModelType, DefaultModelConfig | null> {
  const configs: Record<StandardModelType, DefaultModelConfig | null> = {} as any;

  // 遍历所有标准模型类型
  Object.keys(MODEL_TYPE_TO_PROVIDER).forEach((modelType) => {
    configs[modelType as StandardModelType] = getDefaultModelConfig(modelType as StandardModelType);
  });

  return configs;
}