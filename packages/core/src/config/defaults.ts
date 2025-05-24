/**
 * 默认配置
 */
import { ModelConfig, StandardModelType } from '../model';
import { MODEL_REGISTRY } from '../model/unifiedModelConfig';

/**
 * 创建默认模型配置
 */
export const createDefaultModelConfigs = (): Record<StandardModelType, ModelConfig> => {
  const configs: Record<string, ModelConfig> = {};
  
  Object.entries(MODEL_REGISTRY).forEach(([key, registry]) => {
    configs[key] = {
      id: key,
      providerName: registry.name,
      apiKey: '',
      model: registry.defaultModel,
      baseUrl: registry.baseUrl,
      endpoint: registry.endpoint,
      timeout: registry.timeout,
      enabled: false
    };
  });
  
  return configs as Record<StandardModelType, ModelConfig>;
};

/**
 * 默认模型配置
 */
export const defaultModelConfigs = createDefaultModelConfigs();

/**
 * 默认优化设置
 */
export const defaultOptimizeSettings = {
  temperature: 0.7,
  maxTokens: 1000,
  stream: true,
  timeout: 60000
};