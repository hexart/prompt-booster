// packages/core/src/model/services/modelService.ts
import { createClient } from '@prompt-booster/api';
import { ModelConfig, CustomInterface, StandardModelType } from '../models/config';
import { getDefaultModelConfig } from '../unifiedModelConfig';

type TranslationFunction = (key: string, options?: any) => string;
/**
 * 测试模型连接 - 简化版本，单次测试
 * @param provider 提供商
 * @param apiKey API密钥  
 * @param baseUrl 基础URL
 * @param model 模型名称
 * @param endpoint 端点
 * @returns 测试结果
 */
export async function testModelConnection(
  provider: string,
  apiKey: string,
  baseUrl: string,
  model: string,
  endpoint?: string,
  t?: TranslationFunction

): Promise<{ success: boolean; message: string }> {

  // 参数验证
  if (!provider) return {
    success: false,
    message: t ? t('toast.validation.providerRequired') : 'Provider required'
  };
  if (!apiKey || apiKey.trim() === '') return {
    success: false,
    message: t ? t('toast.validation.apiKeyRequired') : 'API Key required'
  };
  if (!baseUrl || baseUrl.trim() === '') return {
    success: false,
    message: t ? t('toast.validation.baseUrlRequired') : 'Base URL required'
  };
  if (!model || model.trim() === '') return {
    success: false,
    message: t ? t('toast.validation.modelNameRequired') : 'Model name required'
  };

  try {
    // 创建API客户端
    const client = createClient({
      provider,
      apiKey,
      baseUrl,
      model,
      endpoints: {
        chat: endpoint || '/v1/chat/completions',
        models: '/v1/models'
      }
    });

    // 发送测试消息
    const response = await client.chat({
      userMessage: 'Say hi',
      options: {
        maxTokens: 10,
        temperature: 0
      }
    });

    // 极简判断逻辑
    if (response.error) {
      return {
        success: false,
        message: t?.('toast.connection.failed', { error: response.error }) ||
          `Connection failed: ${response.error}`
      };
    }

    if (response.data !== null && response.data !== undefined) {
      return {
        success: true,
        message: t?.('toast.connection.successGeneric') || 'Connection test successful'
      };
    }

    return {
      success: false,
      message: t?.('toast.connection.noResponseData') || 'No response data received'
    };

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: t?.('toast.connection.error', { errorMessage }) ||
        `Connection error: ${errorMessage}`
    };
  }
}

/**
 * API Key 掩码函数
 */
export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '*'.repeat(key.length);

  const visiblePart = 3;
  const prefix = key.substring(0, visiblePart);
  const suffix = key.substring(key.length - visiblePart);
  const maskedLength = key.length - (visiblePart * 2);

  return `${prefix}${'*'.repeat(maskedLength)}${suffix}`;
}

/**
 * 检查用户的模型配置是否有效
 */
export function validateModelConfig(config: ModelConfig | CustomInterface, t?: TranslationFunction): {
  valid: boolean;
  message?: string
} {
  if (!config.apiKey) {
    return {
      valid: false,
      message: t?.('toast.validation.apiKeyRequired') || 'API Key required'
    };
  }

  if ('providerName' in config && !config.providerName) {
    return {
      valid: false,
      message: t?.('toast.validation.providerNameRequired') || 'Provider name required'
    };
  }

  if (!config.model) {
    return {
      valid: false,
      message: t?.('toast.validation.modelNameRequired') || 'Model name required'
    };
  }

  if (!config.baseUrl || config.baseUrl.trim() === '') {
    return {
      valid: false,
      message: t?.('toast.validation.baseUrlRequired') || 'Base URL required'
    };
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