// apps/web/src/core/config/defaults.ts
/**
 * 默认配置
 */
import { ModelConfig, StandardModelType } from '../model';
import { getAllDefaultModelConfigs } from '../model/unifiedModelConfig';

/**
 * 创建默认模型配置
 */
export const defaultModelConfigs = (): Record<StandardModelType, ModelConfig> => {
  const configs: Record<string, ModelConfig> = {};

  // 使用新的 API 获取所有默认配置
  const allDefaultConfigs = getAllDefaultModelConfigs();

  Object.entries(allDefaultConfigs).forEach(([modelType, defaultConfig]) => {
    if (defaultConfig) {
      configs[modelType] = {
        id: modelType,
        providerName: defaultConfig.providerName,
        apiKey: '',
        model: defaultConfig.defaultModel,
        baseUrl: defaultConfig.baseUrl,
        endpoint: defaultConfig.endpoint,
        timeout: defaultConfig.timeout,
        enabled: false
      };
    }
  });

  return configs as Record<StandardModelType, ModelConfig>;
};

/**
 * 默认优化设置
 */
export const defaultOptimizeSettings = {
  temperature: 0.7,
  stream: true,
  timeout: 60000
};