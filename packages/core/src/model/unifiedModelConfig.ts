// packages/core/src/model/unifiedModelConfig.ts
/**
 * 统一的模型配置管理
 * 重新导出API包的配置，避免重复定义
 */

// 从API包导入配置，统一数据源
export { getMaxTokensForModel } from '@prompt-booster/api';

// 模型提供商类型
export type ModelProvider = 'openai' | 'gemini' | 'deepseek' | 'hunyuan' | 'siliconflow' | 'ollama';

// 模型配置基础接口
export interface BaseModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  timeout?: number;
  endpoint?: string;
  isOpenAICompatible: boolean;
}

// 业务层的模型注册表
export const MODEL_REGISTRY: Record<ModelProvider, BaseModelConfig> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    provider: 'openai',
    baseUrl: 'https://api.openai.com',
    defaultModel: 'gpt-4-turbo',
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    timeout: 60000,
    endpoint: '/v1/chat/completions',
    isOpenAICompatible: true
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    provider: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    defaultModel: 'gemini-1.5-pro',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    timeout: 60000,
    endpoint: '/v1beta/models/{model}:generateContent',
    isOpenAICompatible: false
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-coder'],
    timeout: 60000,
    endpoint: '/v1/chat/completions',
    isOpenAICompatible: true
  },
  hunyuan: {
    id: 'hunyuan',
    name: 'Tencent Hunyuan',
    provider: 'hunyuan',
    baseUrl: 'https://api.hunyuan.cloud.tencent.com',
    defaultModel: 'hunyuan-turbos-latest',
    models: ['hunyuan-turbos-latest'],
    timeout: 60000,
    endpoint: '/v1/chat/completions',
    isOpenAICompatible: true
  },
  siliconflow: {
    id: 'siliconflow',
    name: 'SiliconFlow',
    provider: 'siliconflow',
    baseUrl: 'https://api.siliconflow.cn',
    defaultModel: 'Qwen/QwQ-32B',
    models: ['Qwen/QwQ-32B'],
    timeout: 60000,
    endpoint: '/v1/chat/completions',
    isOpenAICompatible: true
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama',
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    defaultModel: 'qwen3:32b',
    models: ['qwen3:32b', 'qwq:latest'],
    timeout: 180000,
    endpoint: '/api/chat',
    isOpenAICompatible: false
  }
};

// 检查是否为OpenAI兼容的提供商
export function isOpenAICompatible(provider: ModelProvider | string): boolean {
  const config = MODEL_REGISTRY[provider as ModelProvider];
  return config?.isOpenAICompatible ?? true;
}

// 获取默认配置
export function getDefaultModelConfig(provider: ModelProvider): BaseModelConfig | null {
  return MODEL_REGISTRY[provider] || null;
}

// 获取所有支持的提供商
export function getSupportedProviders(): ModelProvider[] {
  return Object.keys(MODEL_REGISTRY) as ModelProvider[];
}