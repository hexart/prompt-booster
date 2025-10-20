// apps/web/src/core/model/services/modelService.ts
import { createClient } from '@prompt-booster/api';
import {
  ConnectionError,
  AuthenticationError
} from '@prompt-booster/api';
import { ErrorType } from '../models/config';
import { ModelConfig, CustomInterface, StandardModelType } from '../models/config';
import { getDefaultModelConfig } from '../unifiedModelConfig';

type TranslationFunction = (key: string, options?: any) => string;
/**
 * 测试模型连接
 * @param provider 提供商
 * @param apiKey API密钥  
 * @param baseUrl 基础URL
 * @param model 模型名称
 * @param endpoint 自定义聊天端点（可选）
 * @returns 测试结果，包含成功状态、错误类型和原始错误信息
 */
export async function testModelConnection(
  provider: string,
  apiKey: string,
  baseUrl: string,
  model: string,
  endpoint?: string
): Promise<{
  success: boolean;
  errorType?: ErrorType;
  originalError?: string;
}> {

  // 参数验证
  if (!provider) {
    return {
      success: false,
      errorType: 'validation',
      originalError: 'Provider required'
    };
  }

  if (!apiKey || apiKey.trim() === '') {
    return {
      success: false,
      errorType: 'validation',
      originalError: 'API Key required'
    };
  }

  if (!baseUrl || baseUrl.trim() === '') {
    return {
      success: false,
      errorType: 'validation',
      originalError: 'Base URL required'
    };
  }

  if (!model || model.trim() === '') {
    return {
      success: false,
      errorType: 'validation',
      originalError: 'Model name required'
    };
  }

  try {
    // 创建API客户端，包含自定义端点
    const clientConfig: any = {
      provider,
      apiKey,
      baseUrl,
      model
    };

    // 如果提供了自定义端点，添加到配置中
    if (endpoint) {
      clientConfig.endpoints = {
        chat: endpoint
      };
    }

    const client = createClient(clientConfig);

    // 使用 testConnection 方法进行连接测试
    const response = await client.testConnection();

    // 检查响应
    if (response.data?.success) {
      return {
        success: true
      };
    }

    // 不应该到达这里，但以防万一
    return {
      success: false,
      errorType: 'unknown',
      originalError: 'Connection test failed without error'
    };

  } catch (error: any) {
    // 根据错误类型返回不同的结果
    if (error instanceof ConnectionError) {
      return {
        success: false,
        errorType: 'connection',
        originalError: error.message
      };
    }

    if (error instanceof AuthenticationError) {
      return {
        success: false,
        errorType: 'auth',
        originalError: error.message
      };
    }

    // 其他错误
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      errorType: 'unknown',
      originalError: errorMessage
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
 * 验证基础配置字段（不包括model字段）
 */
function validateBaseConfig(config: ModelConfig | CustomInterface, t?: TranslationFunction): {
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

  if (!config.baseUrl || config.baseUrl.trim() === '') {
    return {
      valid: false,
      message: t?.('toast.validation.baseUrlRequired') || 'Base URL required'
    };
  }

  return { valid: true };
}

/**
 * 检查用户的模型配置是否有效
 */
export function validateModelConfig(config: ModelConfig | CustomInterface, t?: TranslationFunction): {
  valid: boolean;
  message?: string
} {
  // 1. 先验证基础字段
  const baseValidation = validateBaseConfig(config, t);
  if (!baseValidation.valid) {
    return baseValidation;
  }

  // 2. 再验证model字段
  if (!config.model) {
    return {
      valid: false,
      message: t?.('toast.validation.modelNameRequired') || 'Model name required'
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
 * 格式化 Base URL
 * - 去除首尾空格
 * - 确保以 http:// 或 https:// 开头
 * - 移除末尾的斜杠
 */
export function formatBaseUrl(url: string | undefined): string {
  if (!url) return '';

  // 去除首尾空格
  let formatted = url.trim();

  if (!formatted) return '';

  // 如果没有协议，默认添加 https://
  // if (!formatted.match(/^https?:\/\//i)) {
  //   formatted = 'https://' + formatted;
  // }

  // 移除末尾的斜杠
  formatted = formatted.replace(/\/+$/, '');

  return formatted;
}

/**
 * 格式化 Endpoint
 * - 去除首尾空格
 * - 确保以斜杠开头
 * - 规范化多余的斜杠
 */
export function formatEndpoint(endpoint: string | undefined): string {
  if (!endpoint) return '/chat/completions';

  // 去除首尾空格
  let formatted = endpoint.trim();

  if (!formatted) return '/chat/completions';

  // 确保以斜杠开头
  if (!formatted.startsWith('/')) {
    formatted = '/' + formatted;
  }

  // 规范化多个连续斜杠为单个斜杠
  formatted = formatted.replace(/\/+/g, '/');

  return formatted;
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
      providerName: config.providerName,
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
      providerName: item.providerName,
      isStandard: false,
      isEnabled: item.enabled !== false,
      apiKey: item.apiKey,
      model: item.model || '',
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

      // 统一使用 providerName 和 model 进行排序，而不依赖 name 字段
      const aName = `${a.providerName} - ${a.model}`;
      const bName = `${b.providerName} - ${b.model}`;
      return aName.localeCompare(bName);
    });
}

/**
 * 模型选项类型（用于UI展示）
 */
export interface ModelOption {
  id: string;
  name: string;
}

/**
 * 获取模型列表
 * @param config 模型配置
 * @param isCustom 是否为自定义接口
 * @param modelType 模型类型（用于内置模型）
 * @param originalApiKey 原始API密钥（用于处理掩码的情况）
 * @returns 模型选项列表
 */
export async function fetchModelList(
  config: ModelConfig | CustomInterface,
  isCustom: boolean,
  modelType?: string,
  originalApiKey?: string
): Promise<ModelOption[]> {
  try {
    // 1. 验证配置（获取模型列表时不验证model字段）
    const validation = validateBaseConfig(config);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // 2. 准备客户端配置
    const provider = isCustom
      ? (config as CustomInterface).providerName || 'custom'
      : modelType || 'unknown';

    // 重要：使用原始 API Key，而不是可能被掩码的
    const apiKey = originalApiKey || config.apiKey;

    if (!apiKey || !config.baseUrl) {
      throw new Error('API Key and Base URL are required');
    }

    // 3. 创建客户端配置 - 与原始代码保持一致
    const clientConfig: any = {
      provider,
      apiKey: originalApiKey || config.apiKey,
      baseUrl: config.baseUrl,
      model: 'default'
    };

    // 4. 不主动设置 endpoints，让 API 包使用默认值
    // 只有在明确有自定义端点时才设置
    if (config.endpoint && config.endpoint !== '/chat/completions') {
      clientConfig.endpoints = {
        chat: config.endpoint
      };
    }

    const client = createClient(clientConfig);

    // 5. 获取模型列表
    const models = await client.getModels();

    // 6. 转换为 ModelOption 格式
    return formatModelOptions(models);

  } catch (error: any) {
    // 重新抛出错误，让调用方处理
    throw error;
  }
}

/**
 * 格式化模型选项
 * @param models 原始模型列表
 * @returns 格式化后的模型选项
 */
export function formatModelOptions(
  models: Array<{ id: string; name?: string }>
): ModelOption[] {
  return models.map(model => ({
    id: model.id,
    name: model.name || model.id  // 如果没有 name，使用 id
  }));
}

/**
 * 合并配置与默认值
 * @param formData 表单数据
 * @param isStandard 是否为标准模型
 * @param modelType 模型类型
 * @returns 完整的配置
 */
export function mergeWithDefaults(
  formData: Partial<ModelConfig | CustomInterface>,
  isStandard: boolean,
  modelType?: string
): ModelConfig | CustomInterface {
  if (isStandard && modelType) {
    const defaultConfig = getDefaultModelConfig(modelType as StandardModelType);
    if (defaultConfig) {
      return {
        ...defaultConfig,
        ...formData,
        // 确保某些字段不被覆盖
        providerName: defaultConfig.providerName,
        baseUrl: formData.baseUrl || defaultConfig.baseUrl,
        endpoint: formData.endpoint || defaultConfig.endpoint
      } as ModelConfig;
    }
  }

  // 自定义接口或找不到默认配置时
  return {
    ...formData,
    // 确保必要字段存在
    baseUrl: formData.baseUrl || '',
    model: formData.model || '',
    enabled: formData.enabled ?? false
  } as ModelConfig | CustomInterface;
}

/**
 * 格式化模型服务错误
 * @param error 原始错误
 * @returns 格式化的错误信息，包含错误类型
 */
export function formatModelServiceError(error: any): {
  type: ErrorType;
  message: string;
} {
  // 利用 API 包的错误类型
  if (error instanceof AuthenticationError || error.name === 'AuthenticationError') {
    return {
      type: 'auth',
      message: error.message || 'Invalid API key'
    };
  }

  if (error instanceof ConnectionError || error.name === 'ConnectionError') {
    return {
      type: 'connection',
      message: error.message || 'Connection failed'
    };
  }

  if (error.message?.includes('required')) {
    return {
      type: 'validation',
      message: error.message
    };
  }

  if (error.message?.includes('parse') || error.message?.includes('JSON')) {
    return {
      type: 'parse',
      message: error.message || 'Failed to parse response'
    };
  }

  return {
    type: 'unknown',
    message: error.message || 'Unknown error occurred'
  };
}