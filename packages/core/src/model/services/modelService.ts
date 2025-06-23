// packages/core/src/model/services/modelService.ts
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