// packages/core/src/model/services/modelService.ts
import { createClient, testConnection } from '@prompt-booster/api';
import { ModelConfig, CustomInterface, StandardModelType } from '../models/config';
import { getDefaultModelConfig } from '../unifiedModelConfig';

/**
 * 测试模型连接
 */
export async function testModelConnection(
  provider: string,
  apiKey: string,
  baseUrl: string,
  model: string,
  endpoint?: string
) {
  if (!apiKey) {
    return {
      success: false,
      message: '缺少API Key，无法测试连接'
    };
  }

  if (!baseUrl || baseUrl.trim() === '') {
    return {
      success: false,
      message: '缺少API基础URL，无法测试连接'
    };
  }

  try {
    const modelsEndpoint = '/v1/models';

    const client = createClient({
      provider,
      apiKey,
      baseUrl,
      model,
      endpoints: {
        chat: endpoint || '/v1/chat/completions',
        models: modelsEndpoint
      }
    });

    return await testConnection(client, 3);
  } catch (error: any) {
    const errorMessage = error instanceof Error ? (error.message || '未知错误') : '未知错误';
    return {
      success: false,
      message: `连接测试出错: ${errorMessage}`
    };
  }
}

/**
 * API Key 掩码函数
 */
export function maskApiKey(key: string): string {
  if (!key) return '';

  if (key.length <= 8) {
    return '*'.repeat(key.length);
  }

  const visiblePart = 3;
  const prefix = key.substring(0, visiblePart);
  const suffix = key.substring(key.length - visiblePart);
  const maskedLength = key.length - (visiblePart * 2);

  return `${prefix}${'*'.repeat(maskedLength)}${suffix}`;
}

/**
 * 检查模型配置是否有效
 */
export function validateModelConfig(config: ModelConfig | CustomInterface): {
  valid: boolean;
  message?: string
} {
  if (!config.apiKey) {
    return { valid: false, message: '请输入API Key' };
  }

  if ('providerName' in config && !config.providerName) {
    return { valid: false, message: '请输入供应商名称' };
  }

  if (!config.model) {
    return { valid: false, message: '请输入模型名称' };
  }

  if (!config.baseUrl || config.baseUrl.trim() === '') {
    return { valid: false, message: '请配置 API 基础 URL' };
  }

  return { valid: true };
}

/**
 * 获取标准模型的默认baseUrl
 */
export function getDefaultBaseUrl(modelType: StandardModelType): string {
  const config = getDefaultModelConfig(modelType);
  return config?.baseUrl || '';
}

/**
 * 准备模型用于UI展示的数据
 */
export function prepareModelsForDisplay(
  configs: Record<StandardModelType, ModelConfig>,
  customInterfaces: CustomInterface[]
) {
  // 标准模型
  const standardModels = Object.entries(configs).map(([id, config]) => {
    return {
      id,
      name: `${config.providerName} - ${config.model}`,
      isStandard: true,
      isEnabled: config.enabled !== false,
      apiKey: config.apiKey,
      model: config.model || '',
      config
    };
  });

  // 自定义接口
  const customModels = customInterfaces.map(item => {
    return {
      id: item.id,
      name: item.name,
      isStandard: false,
      isEnabled: item.enabled !== false,
      apiKey: item.apiKey,
      model: item.model || '',
      providerName: item.providerName,
      config: item
    };
  });

  // 合并并排序
  return [...standardModels, ...customModels]
    .sort((a, b) => {
      if (a.isEnabled && !b.isEnabled) return -1;
      if (!a.isEnabled && b.isEnabled) return 1;
      if (!a.isStandard && b.isStandard) return -1;
      if (a.isStandard && !b.isStandard) return 1;
      return a.name.localeCompare(b.name);
    });
}